const STORAGE_KEY = "g1-common-math2-science2-dashboard-v5";
const OLD_STORAGE_KEY = "g1-common-math2-science2-dashboard-v3";
const DB_NAME = "g1-study-dashboard-files";
const DB_VERSION = 1;
const FILE_STORE = "attachments";
const DAY_CHECK_KEYS = ["mathLecture", "conceptMath", "maplMath", "scienceLecture", "o2Science", "wanjaScience", "englishPassage", "mae3biPassage", "output"];
const BOOK_CHECK_KEYS = ["conceptMath", "maplMath", "o2Science", "wanjaScience", "englishPassage", "mae3biPassage"];

let state = loadState();
let activeView = "dashboard";
let activeDay = null;
let activeDate = null;
let phaseFilter = "전체";
let statusFilter = "전체";
let toastTimer = null;
let dbPromise = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function multiline(value = "") {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value, amount) {
  const date = typeof value === "string" ? parseDate(value) : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  date.setDate(date.getDate() + Number(amount));
  return date;
}

function compareDateStrings(a, b) {
  return parseDate(a) - parseDate(b);
}

function formatDate(value, includeYear = true) {
  const date = typeof value === "string" ? parseDate(value) : value;
  return new Intl.DateTimeFormat("ko-KR", {
    ...(includeYear ? { year: "numeric" } : {}),
    month: "short",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function formatDateLong(value) {
  const date = typeof value === "string" ? parseDate(value) : value;
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(date);
}

function formatMinutes(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest}분`;
  if (!rest) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
}

function normalizeIntervals(values) {
  const cleaned = values.map(value => Math.max(1, Math.min(90, Number(value) || 1))).sort((a, b) => a - b);
  const result = [];
  cleaned.forEach(value => {
    const next = result.length && value <= result[result.length - 1] ? result[result.length - 1] + 1 : value;
    result.push(Math.min(90, next));
  });
  while (result.length < 5) result.push(Math.min(90, (result.at(-1) || 0) + 1));
  return result.slice(0, 5);
}

function defaultDayState() {
  return {
    checks: {
      mathLecture: false,
      conceptMath: false,
      maplMath: false,
      scienceLecture: false,
      o2Science: false,
      wanjaScience: false,
      englishPassage: false,
      mae3biPassage: false,
      output: false
    },
    logs: { conceptMath: "", maplMath: "", o2Science: "", wanjaScience: "", englishPassage: "", mae3biPassage: "" },
    school: { done: false, topic: "", note: "" },
    resultTitle: "",
    rating: "",
    concepts: ["", "", ""],
    representative: "",
    mistake: "",
    visual: "",
    stuck: "",
    question: "",
    attachment: null,
    updatedAt: null
  };
}

function buildDefaultState() {
  const days = {};
  STUDY_PLAN.forEach(item => { days[item.day] = defaultDayState(); });
  return {
    version: APP_VERSION,
    startDate: DEFAULT_START_DATE,
    schoolStartDate: DEFAULT_SCHOOL_START_DATE,
    reviewIntervals: [...DEFAULT_REVIEW_INTERVALS],
    reviewViewDate: localDateString(),
    timeBudgets: {
      vacationMath: 360,
      vacationScience: 240,
      schoolMath: 180,
      schoolScience: 60,
      englishReading: 25,
      koreanReading: 25,
      schoolReview: 60
    },
    theme: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    days,
    reviewCycles: {},
    mistakes: [],
    blankReviews: []
  };
}

function normalizeDayState(raw = {}) {
  const base = defaultDayState();
  return {
    ...base,
    ...raw,
    checks: { ...base.checks, ...(raw.checks || {}) },
    logs: { ...base.logs, ...(raw.logs || {}) },
    school: { ...base.school, ...(raw.school || {}) },
    concepts: Array.isArray(raw.concepts) ? [raw.concepts[0] || "", raw.concepts[1] || "", raw.concepts[2] || ""] : base.concepts
  };
}

function migrateOldState(oldState, fallback) {
  if (!oldState || typeof oldState !== "object") return fallback;
  const next = structuredClone(fallback);
  next.startDate = oldState.startDate || fallback.startDate;
  next.theme = oldState.theme || fallback.theme;
  STUDY_PLAN.forEach(item => {
    const oldDay = oldState.days?.[item.day];
    if (!oldDay) return;
    const target = next.days[item.day];
    target.resultTitle = oldDay.resultTitle || "";
    target.rating = oldDay.rating || "";
    target.concepts = Array.isArray(oldDay.concepts) ? oldDay.concepts.slice(0, 3) : ["", "", ""];
    target.representative = oldDay.representative || "";
    target.mistake = oldDay.mistake || "";
    target.visual = oldDay.visual || "";
    target.stuck = oldDay.stuck || "";
    target.question = oldDay.question || "";
    target.attachment = oldDay.attachment || null;
    target.checks.output = Boolean(oldDay.checks?.output);
  });
  return next;
}

function loadState() {
  const fallback = buildDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) return migrateOldState(JSON.parse(oldRaw), fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    const days = {};
    STUDY_PLAN.forEach(item => { days[item.day] = normalizeDayState(parsed.days?.[item.day]); });
    return {
      version: APP_VERSION,
      startDate: parsed.startDate || fallback.startDate,
      schoolStartDate: parsed.schoolStartDate || fallback.schoolStartDate,
      reviewIntervals: normalizeIntervals(parsed.reviewIntervals || fallback.reviewIntervals),
      reviewViewDate: parsed.reviewViewDate || fallback.reviewViewDate,
      timeBudgets: { ...fallback.timeBudgets, ...(parsed.timeBudgets || {}) },
      theme: parsed.theme || fallback.theme,
      days,
      reviewCycles: parsed.reviewCycles && typeof parsed.reviewCycles === "object" ? parsed.reviewCycles : {},
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      blankReviews: Array.isArray(parsed.blankReviews) ? parsed.blankReviews : []
    };
  } catch (error) {
    console.warn("저장된 진도를 불러오지 못했습니다.", error);
    return fallback;
  }
}

function saveState(showSaved = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const label = $("#autosave-label");
  if (label) label.textContent = "자동 저장됨";
  if (showSaved) showToast("진도가 저장되었습니다.");
}

function getPlan(day) {
  return STUDY_PLAN.find(item => item.day === Number(day));
}

function getDayState(day) {
  if (!state.days[day]) state.days[day] = defaultDayState();
  return state.days[day];
}

function getDateForDay(day) {
  return addDays(state.startDate, Number(day) - 1);
}

function getDateStringForDay(day) {
  return localDateString(getDateForDay(day));
}

function getDayForDate(dateString) {
  const start = parseDate(state.startDate);
  const current = parseDate(dateString);
  const diff = Math.round((current - start) / 86400000) + 1;
  return diff >= 1 && diff <= STUDY_PLAN.length ? diff : null;
}

function getStudyEndDateString() {
  return getDateStringForDay(STUDY_PLAN.length);
}

function isSchoolDate(dateString) {
  return compareDateStrings(dateString, state.schoolStartDate) >= 0;
}

function phaseForDay(day) {
  const dateString = getDateStringForDay(day);
  if (day >= 28) return "최종 실전";
  return isSchoolDate(dateString) ? "개학 후 루틴" : "방학 집중";
}

function getLanguageTask(key) {
  return LANGUAGE_TASKS.find(task => task.key === key);
}

function getLanguageMinutes(taskOrKey) {
  const task = typeof taskOrKey === "string" ? getLanguageTask(taskOrKey) : taskOrKey;
  if (!task) return 0;
  return Number(state.timeBudgets?.[task.minutesKey]) || task.defaultMinutes || 25;
}

function getLanguageTotalMinutes() {
  return LANGUAGE_TASKS.reduce((total, task) => total + getLanguageMinutes(task), 0);
}

function getLanguageSummary() {
  return LANGUAGE_TASKS.map(task => `${task.shortTitle || task.title} ${formatMinutes(getLanguageMinutes(task))}`).join(" · ");
}

function getMockExamsOnDate(dateString) {
  return (typeof MOCK_EXAMS === "undefined" ? [] : MOCK_EXAMS).filter(exam => exam.date === dateString);
}

function getOutputPrompt(item) {
  return `${item.outputPrompt} + 영어 막힌 문장 1개 + 매3비 선지 근거 1개`;
}

function getDayBudget(day) {
  const school = isSchoolDate(getDateStringForDay(day));
  const language = getLanguageTotalMinutes();
  return school
    ? { math: state.timeBudgets.schoolMath, science: state.timeBudgets.schoolScience, language, school: state.timeBudgets.schoolReview, mode: "개학 후" }
    : { math: state.timeBudgets.vacationMath, science: state.timeBudgets.vacationScience, language, school: 0, mode: "방학" };
}

function lectureRangeLabel(range) {
  if (!Array.isArray(range) || !range.length) return "누적 실전";
  const [start, end] = range;
  return start === end ? `${String(start).padStart(2, "0")}강` : `${String(start).padStart(2, "0")}~${String(end).padStart(2, "0")}강`;
}

function lectureTitleSummary(titles) {
  if (!titles?.length) return "누적 실전·오답 재풀이";
  if (titles.length === 1) return titles[0];
  return `${titles[0]} → ${titles.at(-1)}`;
}

function getRequiredTaskKeys(day) {
  const keys = [...DAY_CHECK_KEYS];
  if (isSchoolDate(getDateStringForDay(day))) keys.push("schoolReview");
  return keys;
}

function getTaskDone(day, key) {
  const dayState = getDayState(day);
  if (key === "schoolReview") return Boolean(dayState.school.done);
  return Boolean(dayState.checks[key]);
}

function setTaskDone(day, key, value) {
  const dayState = getDayState(day);
  if (key === "schoolReview") dayState.school.done = Boolean(value);
  else dayState.checks[key] = Boolean(value);
  dayState.updatedAt = new Date().toISOString();
}

function getDayProgress(day) {
  const keys = getRequiredTaskKeys(day);
  const count = keys.filter(key => getTaskDone(day, key)).length;
  return { count, total: keys.length, percent: Math.round((count / keys.length) * 100), complete: count === keys.length };
}

function nextIncompleteDay() {
  return STUDY_PLAN.find(item => !getDayProgress(item.day).complete) || STUDY_PLAN.at(-1);
}

function stats() {
  const completedDays = STUDY_PLAN.filter(item => getDayProgress(item.day).complete).length;
  let mathDone = 0;
  let scienceDone = 0;
  STUDY_PLAN.forEach(item => {
    const dayState = getDayState(item.day);
    if (dayState.checks.mathLecture && item.math.lectureRange.length) {
      mathDone += item.math.lectureRange[1] - item.math.lectureRange[0] + 1;
    }
    if (dayState.checks.scienceLecture && item.science.lectureRange.length) {
      scienceDone += item.science.lectureRange[1] - item.science.lectureRange[0] + 1;
    }
  });
  const outputCount = STUDY_PLAN.filter(item => getDayState(item.day).checks.output).length;
  const readingDone = STUDY_PLAN.reduce((total, item) => total + LANGUAGE_TASKS.filter(task => getDayState(item.day).checks[task.key]).length, 0);
  const readingTotal = STUDY_PLAN.length * LANGUAGE_TASKS.length;
  let streak = 0;
  for (const item of STUDY_PLAN) {
    if (getDayProgress(item.day).complete) streak += 1;
    else break;
  }
  return {
    completedDays,
    overallPercent: Math.round((completedDays / STUDY_PLAN.length) * 100),
    mathDone: Math.min(MATH_LECTURES.length, mathDone),
    scienceDone: Math.min(SCIENCE_LECTURES.length, scienceDone),
    readingDone,
    readingTotal,
    outputCount,
    streak
  };
}

function getBookProgress(key) {
  const done = STUDY_PLAN.filter(item => Boolean(getDayState(item.day).checks[key])).length;
  return { done, total: STUDY_PLAN.length, percent: Math.round((done / STUDY_PLAN.length) * 100) };
}

function makeStudyTracks() {
  return STUDY_PLAN.flatMap(item => {
    const baseDate = getDateStringForDay(item.day);
    const languageTracks = LANGUAGE_TASKS.map(task => ({
      id: `study-${task.key}-${item.day}`,
      type: "study",
      subject: task.subject,
      day: item.day,
      baseDate,
      label: `Day ${item.day} · ${task.title}`,
      source: task.role,
      detail: task.detail
    }));
    return [
      {
        id: `study-math-${item.day}`,
        type: "study",
        subject: "수학",
        day: item.day,
        baseDate,
        label: `Day ${item.day} · ${item.math.focus}`,
        source: item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)}` : "수학 누적 실전",
        detail: `${item.math.unit} · ${item.math.conceptTask}`
      },
      {
        id: `study-science-${item.day}`,
        type: "study",
        subject: "과학",
        day: item.day,
        baseDate,
        label: `Day ${item.day} · ${item.science.focus}`,
        source: `김청해 ${lectureRangeLabel(item.science.lectureRange)}`,
        detail: `${item.science.unit} · ${item.science.o2Task}`
      },
      ...languageTracks
    ];
  });
}

function makeMistakeTracks() {
  return state.mistakes.map(item => ({
    id: item.id,
    type: "mistake",
    subject: item.subject,
    baseDate: item.baseDate,
    label: `${item.book} · ${item.locator}`,
    source: "틀린 문제",
    detail: item.reason
  }));
}

function makeBlankTracks() {
  return state.blankReviews.map(item => ({
    id: item.id,
    type: "blank",
    subject: item.subject,
    baseDate: item.baseDate,
    label: item.unit,
    source: "백지 복습",
    detail: item.blocked
  }));
}

function getAllReviewTracks() {
  return [...makeStudyTracks(), ...makeMistakeTracks(), ...makeBlankTracks()];
}

function getTrackById(id) {
  return getAllReviewTracks().find(track => track.id === id);
}

function getReviewCycle(track) {
  const stored = state.reviewCycles[track.id] || {};
  return {
    baseDate: stored.baseDate || null,
    stage: Math.max(0, Math.min(state.reviewIntervals.length, Number(stored.stage) || 0)),
    done: Boolean(stored.done),
    history: Array.isArray(stored.history) ? stored.history : []
  };
}

function getCycleBaseDate(track, cycle = getReviewCycle(track)) {
  return cycle.baseDate || track.baseDate;
}

function reviewStageLabel(index) {
  const labels = ["다음날", "3일 뒤", "1주 뒤", "2주 뒤", "한 달 뒤"];
  const custom = state.reviewIntervals[index];
  if (DEFAULT_REVIEW_INTERVALS[index] === custom) return labels[index];
  return `${custom}일 뒤`;
}

function getNextReviewDate(track) {
  const cycle = getReviewCycle(track);
  if (cycle.done || cycle.stage >= state.reviewIntervals.length) return null;
  return localDateString(addDays(getCycleBaseDate(track, cycle), state.reviewIntervals[cycle.stage]));
}

function getPlannedReviewEvents(track) {
  const cycle = getReviewCycle(track);
  const baseDate = getCycleBaseDate(track, cycle);
  return state.reviewIntervals.map((interval, index) => ({
    track,
    stage: index,
    interval,
    date: localDateString(addDays(baseDate, interval)),
    status: cycle.done || index < cycle.stage ? "done" : index === cycle.stage ? "next" : "planned"
  }));
}

function getPlannedReviewEventsOnDate(dateString) {
  const events = [];
  getAllReviewTracks().forEach(track => {
    getPlannedReviewEvents(track).forEach(event => {
      if (event.date === dateString) events.push(event);
    });
  });
  return events.sort((a, b) => a.track.subject.localeCompare(b.track.subject, "ko") || a.track.label.localeCompare(b.track.label, "ko"));
}

function getDueReviewItems(dateString, includeOverdue = true) {
  return getAllReviewTracks().map(track => {
    const dueDate = getNextReviewDate(track);
    if (!dueDate) return null;
    const compare = compareDateStrings(dueDate, dateString);
    if (includeOverdue ? compare > 0 : compare !== 0) return null;
    const cycle = getReviewCycle(track);
    return {
      track,
      dueDate,
      stage: cycle.stage,
      overdue: compare < 0,
      interval: state.reviewIntervals[cycle.stage]
    };
  }).filter(Boolean).sort((a, b) => compareDateStrings(a.dueDate, b.dueDate) || a.track.subject.localeCompare(b.track.subject, "ko"));
}

function handleReview(trackId, result, handledDate = localDateString()) {
  const track = getTrackById(trackId);
  if (!track) return;
  const cycle = getReviewCycle(track);
  const dueDate = getNextReviewDate(track);
  if (!dueDate) return;
  if (compareDateStrings(handledDate, dueDate) < 0) {
    showToast("아직 복습 예정일 전입니다.");
    return;
  }
  const historyItem = {
    handledDate,
    dueDate,
    stage: cycle.stage,
    result,
    createdAt: new Date().toISOString()
  };
  if (result === "success") {
    cycle.stage += 1;
    if (cycle.stage >= state.reviewIntervals.length) cycle.done = true;
  } else {
    cycle.baseDate = handledDate;
    cycle.stage = 0;
    cycle.done = false;
  }
  cycle.history.push(historyItem);
  state.reviewCycles[trackId] = cycle;
  saveState();
  renderAll();
  if (activeDate) openDate(activeDate);
  showToast(result === "success" ? "복습 성공! 다음 주기로 이동했습니다." : "다시 학습으로 표시하고 복습 주기를 오늘부터 리셋했습니다.");
}

function reviewStats() {
  const tracks = getAllReviewTracks();
  const completed = tracks.filter(track => getReviewCycle(track).done).length;
  const today = localDateString();
  const due = getDueReviewItems(today, true);
  const overdue = due.filter(item => item.overdue).length;
  const histories = Object.values(state.reviewCycles).flatMap(cycle => Array.isArray(cycle.history) ? cycle.history : []);
  const successes = histories.filter(item => item.result === "success").length;
  const attempts = histories.length;
  return {
    tracks: tracks.length,
    completed,
    due: due.length,
    overdue,
    attempts,
    successRate: attempts ? Math.round((successes / attempts) * 100) : 0
  };
}

function getFinalReviewEndDateString() {
  let latest = localDateString(addDays(getStudyEndDateString(), Math.max(...state.reviewIntervals)));
  getAllReviewTracks().forEach(track => {
    const events = getPlannedReviewEvents(track);
    const last = events.at(-1)?.date;
    if (last && compareDateStrings(last, latest) > 0) latest = last;
  });
  return latest;
}

function resetStudyReviewCycles() {
  Object.keys(state.reviewCycles).forEach(key => {
    if (key.startsWith("study-")) delete state.reviewCycles[key];
  });
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $("#theme-toggle").textContent = state.theme === "dark" ? "☀" : "◐";
}

function switchView(view) {
  activeView = view;
  $$(".app-view").forEach(section => section.classList.toggle("is-active", section.id === `view-${view}`));
  $$(".nav-button").forEach(button => button.classList.toggle("is-active", button.dataset.view === view));
  if (view === "calendar") renderCalendar();
  if (view === "review") renderReviewView();
  if (view === "outputs") renderOutputs();
  if (view === "plan") renderPlan();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  syncSettingsInputs();
  applyTheme();
  renderDashboard();
  renderPlan();
  renderCalendar();
  renderReviewView();
  renderOutputs();
  renderResources();
}

function syncSettingsInputs() {
  $("#start-date").value = state.startDate;
  $("#school-start-date").value = state.schoolStartDate;
  $("#study-end-date").value = getStudyEndDateString();
  $("#review-end-date").value = getFinalReviewEndDateString();
  $("#vacation-math-hours").value = state.timeBudgets.vacationMath / 60;
  $("#vacation-science-hours").value = state.timeBudgets.vacationScience / 60;
  $("#school-math-hours").value = state.timeBudgets.schoolMath / 60;
  $("#school-science-hours").value = state.timeBudgets.schoolScience / 60;
  $("#english-reading-minutes").value = getLanguageMinutes("englishPassage");
  $("#korean-reading-minutes").value = getLanguageMinutes("mae3biPassage");
  $("#school-review-hours").value = state.timeBudgets.schoolReview / 60;
  const vacationDays = STUDY_PLAN.filter(item => !isSchoolDate(getDateStringForDay(item.day))).length;
  $("#schedule-note").textContent = `${formatDate(state.startDate)} 시작 · ${formatDate(getStudyEndDateString())} 본학습 종료 · 방학 모드 ${vacationDays}일 / 개학 후 모드 ${30 - vacationDays}일 · 매일 ${getLanguageSummary()}`;
}

function renderDashboard() {
  const data = stats();
  const review = reviewStats();
  const today = localDateString();
  const dueToday = getDueReviewItems(today, true);
  $("#overall-percent").textContent = `${data.overallPercent}%`;
  $("#overall-days").textContent = `${data.completedDays} / 30일 완료`;
  $("#streak-label").textContent = `연속 완료 ${data.streak}일`;
  $("#overall-ring").style.setProperty("--progress", `${data.overallPercent * 3.6}deg`);
  $("#math-progress").textContent = `${Math.round((data.mathDone / MATH_LECTURES.length) * 100)}%`;
  $("#math-lectures").textContent = `${data.mathDone} / ${MATH_LECTURES.length}강`;
  $("#science-progress").textContent = `${Math.round((data.scienceDone / SCIENCE_LECTURES.length) * 100)}%`;
  $("#science-lectures").textContent = `${data.scienceDone} / ${SCIENCE_LECTURES.length}강`;
  $("#reading-progress").textContent = `${Math.round((data.readingDone / data.readingTotal) * 100)}%`;
  $("#reading-passages").textContent = `${data.readingDone} / ${data.readingTotal}개`;
  $("#review-due-count").textContent = `${dueToday.length}개`;
  $("#review-overdue-label").textContent = `밀린 복습 ${review.overdue}개`;
  $("#output-progress").textContent = data.outputCount;
  $("#output-count-large").textContent = data.outputCount;
  $("#today-label").textContent = formatDateLong(today);
  renderNext();
  renderTodayReviewMini();
  renderTodayTimeBudget();
  renderBookProgress();
  renderRoadmap();
}

function renderNext() {
  const item = nextIncompleteDay();
  const progress = getDayProgress(item.day);
  const dateString = getDateStringForDay(item.day);
  const plannedReviews = getPlannedReviewEventsOnDate(dateString);
  $("#next-phase").textContent = phaseForDay(item.day);
  $("#next-day").textContent = `Day ${item.day}`;
  $("#next-date").textContent = formatDate(dateString);
  $("#next-math-topic").textContent = item.math.focus;
  $("#next-math-lecture").textContent = item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)} · ${lectureTitleSummary(item.math.lectureTitles)}` : "강의 없음 · 누적 실전";
  $("#next-math-books").textContent = `개념원리 + 마플 시너지 · ${formatMinutes(getDayBudget(item.day).math)}`;
  $("#next-science-topic").textContent = item.science.focus;
  $("#next-science-lecture").textContent = `김청해 ${lectureRangeLabel(item.science.lectureRange)} · ${lectureTitleSummary(item.science.lectureTitles)}`;
  $("#next-science-books").textContent = `오투 + 완자 기출픽 · ${formatMinutes(getDayBudget(item.day).science)}`;
  $("#next-reading-topic").textContent = "영어 1지문 + 매3비 1지문";
  $("#next-reading-detail").textContent = LANGUAGE_TASKS.map(task => task.title).join(" · ");
  $("#next-reading-books").textContent = `${getLanguageSummary()} · 해석/근거 기록`;
  $("#next-review-summary").textContent = `이날 예정 복습 ${plannedReviews.length}개 · 현재 완료 ${progress.count}/${progress.total}`;
  $("#next-detail-button").dataset.day = item.day;
  $("#start-next-button").dataset.day = item.day;
  $("#open-next-output").dataset.day = item.day;
  $("#next-calendar-button").dataset.date = dateString;
}

function renderTodayReviewMini() {
  const today = localDateString();
  const items = getDueReviewItems(today, true);
  const container = $("#today-review-mini");
  if (!items.length) {
    container.innerHTML = `<div class="mini-empty"><strong>오늘 예정된 복습이 없습니다.</strong><span>다음 복습은 캘린더에서 미리 확인할 수 있어요.</span></div>`;
    return;
  }
  container.innerHTML = items.slice(0, 4).map(item => `
    <button class="mini-review-item" type="button" data-go-view="review">
      <span class="subject-chip" data-subject="${escapeHtml(item.track.subject)}">${escapeHtml(item.track.subject)}</span>
      <div><strong>${escapeHtml(item.track.label)}</strong><small>${item.overdue ? `밀림 · ${formatDate(item.dueDate, false)}` : reviewStageLabel(item.stage)}</small></div>
    </button>`).join("") + (items.length > 4 ? `<p class="more-label">외 ${items.length - 4}개</p>` : "");
}

function renderTodayTimeBudget() {
  const today = localDateString();
  let day = getDayForDate(today);
  if (!day) day = nextIncompleteDay().day;
  const budget = getDayBudget(day);
  const plan = getPlan(day);
  const rows = [
    { label: "수학", minutes: budget.math, estimate: plan.math.totalMinutes },
    { label: "과학", minutes: budget.science, estimate: plan.science.totalMinutes },
    ...LANGUAGE_TASKS.map(task => ({ label: task.shortTitle || task.title, minutes: getLanguageMinutes(task), estimate: getLanguageMinutes(task) }))
  ];
  if (budget.school) rows.push({ label: "학교 수업 복습", minutes: budget.school, estimate: 60 });
  $("#today-time-budget").innerHTML = rows.map(row => {
    const fit = row.estimate <= row.minutes;
    return `<div class="time-budget-row"><div><strong>${row.label}</strong><small>계획 ${formatMinutes(row.estimate)}</small></div><span class="${fit ? "fit" : "over"}">${formatMinutes(row.minutes)} ${fit ? "✓" : "초과"}</span></div>`;
  }).join("");
}

function renderBookProgress() {
  $("#book-progress-grid").innerHTML = TEXTBOOK_INFO.map(book => {
    const progress = getBookProgress(book.key);
    return `<article class="book-progress-card">
      <div><span class="subject-chip" data-subject="${book.subject}">${book.subject}</span><strong>${escapeHtml(book.title)}</strong><small>${escapeHtml(book.role)}</small></div>
      <div class="book-progress-number"><b>${progress.percent}%</b><span>${progress.done}/30일</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress.percent}%"></div></div>
    </article>`;
  }).join("");
}

function renderRoadmap() {
  const todayDay = getDayForDate(localDateString());
  const next = nextIncompleteDay().day;
  $("#roadmap").innerHTML = STUDY_PLAN.map(item => {
    const progress = getDayProgress(item.day);
    const classes = ["roadmap-day"];
    if (progress.complete) classes.push("is-done");
    else if (progress.percent > 0 || item.day === next) classes.push("is-active");
    if (todayDay === item.day) classes.push("is-today");
    return `<button class="${classes.join(" ")}" type="button" data-open-day="${item.day}" title="${escapeHtml(item.math.focus)} · ${escapeHtml(item.science.focus)} · ${progress.percent}%"><strong>${item.day}</strong><small>${phaseForDay(item.day).replace(" 루틴", "")}</small></button>`;
  }).join("");
}

function renderPlan() {
  const filtered = STUDY_PLAN.filter(item => {
    const phaseMatches = phaseFilter === "전체" || phaseForDay(item.day) === phaseFilter;
    const complete = getDayProgress(item.day).complete;
    const statusMatches = statusFilter === "전체" || (statusFilter === "완료" ? complete : !complete);
    return phaseMatches && statusMatches;
  });
  const container = $("#plan-list");
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">선택한 조건에 맞는 학습일이 없습니다.</div>`;
    return;
  }
  container.innerHTML = filtered.map(item => {
    const dateString = getDateStringForDay(item.day);
    const budget = getDayBudget(item.day);
    const progress = getDayProgress(item.day);
    const reviews = getPlannedReviewEventsOnDate(dateString);
    const school = isSchoolDate(dateString);
    return `<article class="plan-card plan-card-expanded ${progress.complete ? "is-done" : ""}">
      <div class="plan-card-head">
        <div><span class="phase-chip">${phaseForDay(item.day)}</span><h3>Day ${item.day}</h3><p>${formatDate(dateString)}</p></div>
        <div class="plan-progress-summary"><strong>${progress.percent}%</strong><span>${progress.count}/${progress.total} 완료</span></div>
      </div>
      <div class="plan-subject-columns">
        <section class="plan-subject-card math-block">
          <div class="plan-subject-title"><span class="subject-chip" data-subject="수학">수학</span><b>${formatMinutes(budget.math)}</b></div>
          <h4>${escapeHtml(item.math.focus)}</h4>
          <p><strong>강의</strong> ${item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)} · ${escapeHtml(lectureTitleSummary(item.math.lectureTitles))}` : "누적 실전·오답 재풀이"}</p>
          <p><strong>개념원리</strong> ${escapeHtml(item.math.conceptTask)}</p>
          <p><strong>마플</strong> ${escapeHtml(item.math.practiceTask)}</p>
        </section>
        <section class="plan-subject-card science-block">
          <div class="plan-subject-title"><span class="subject-chip" data-subject="과학">과학</span><b>${formatMinutes(budget.science)}</b></div>
          <h4>${escapeHtml(item.science.focus)}</h4>
          <p><strong>강의</strong> 김청해 ${lectureRangeLabel(item.science.lectureRange)} · ${escapeHtml(lectureTitleSummary(item.science.lectureTitles))}</p>
          <p><strong>오투</strong> ${escapeHtml(item.science.o2Task)}</p>
          <p><strong>완자 기출픽</strong> ${escapeHtml(item.science.wanjaTask)}</p>
        </section>
        <section class="plan-subject-card reading-block">
          <div class="plan-subject-title"><span class="subject-chip" data-subject="국어">국어·영어</span><b>${formatMinutes(budget.language)}</b></div>
          <h4>매일 지문 루틴</h4>
          ${LANGUAGE_TASKS.map(task => `<p><strong>${escapeHtml(task.shortTitle || task.title)}</strong> ${escapeHtml(task.detail)}</p>`).join("")}
        </section>
      </div>
      <div class="plan-footer-row">
        <div class="plan-extras">
          <span>↻ 복습 ${reviews.length}개</span>
          ${school ? `<span>🏫 학교 수업 복습 ${formatMinutes(budget.school)}</span>` : ""}
          <span>📘 국어·영어 2지문</span>
          <span>▤ 한 장 결과물</span>
        </div>
        <div class="card-actions"><button class="primary-button" type="button" data-open-day="${item.day}">체크·기록</button><button class="secondary-button" type="button" data-open-date="${dateString}">날짜 상세</button></div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress.percent}%"></div></div>
    </article>`;
  }).join("");
}

function renderCalendar() {
  $("#calendar-start").textContent = formatDate(state.startDate);
  $("#calendar-study-end").textContent = formatDate(getStudyEndDateString());
  $("#calendar-review-end").textContent = formatDate(getFinalReviewEndDateString());
  $("#calendar-intervals").textContent = state.reviewIntervals.map(day => `+${day}`).join(" · ");
  const start = parseDate(state.startDate);
  const end = parseDate(getFinalReviewEndDateString());
  const months = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= lastMonth) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  $("#calendar-months").innerHTML = months.map(renderMonth).join("");
  $("#calendar-agenda").innerHTML = STUDY_PLAN.map(item => {
    const dateString = getDateStringForDay(item.day);
    const reviews = getPlannedReviewEventsOnDate(dateString);
    const exams = getMockExamsOnDate(dateString);
    return `<button class="agenda-row" type="button" data-open-date="${dateString}">
      <div class="agenda-date"><strong>Day ${item.day}</strong><span>${formatDate(dateString)}</span>${exams.length ? `<em>${escapeHtml(exams[0].title)}</em>` : ""}</div>
      <div class="agenda-subject"><b>수학</b><span>${item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)} · ${escapeHtml(lectureTitleSummary(item.math.lectureTitles))}` : "누적 실전"}</span></div>
      <div class="agenda-subject"><b>과학</b><span>김청해 ${lectureRangeLabel(item.science.lectureRange)} · ${escapeHtml(lectureTitleSummary(item.science.lectureTitles))}</span></div>
      <div class="agenda-subject"><b>국어·영어</b><span>${escapeHtml(getLanguageSummary())}</span></div>
      <div class="agenda-review"><b>${reviews.length}</b><span>복습</span></div>
    </button>`;
  }).join("");
}

function renderMonth(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(`<div class="calendar-cell is-empty"></div>`);
  for (let day = 1; day <= lastDate; day += 1) {
    const date = new Date(year, month, day);
    const dateString = localDateString(date);
    const planDay = getDayForDate(dateString);
    const reviews = getPlannedReviewEventsOnDate(dateString);
    const exams = getMockExamsOnDate(dateString);
    const withinRange = compareDateStrings(dateString, state.startDate) >= 0 && compareDateStrings(dateString, getFinalReviewEndDateString()) <= 0;
    const events = [];
    if (exams.length) events.push(`<span class="cal-event exam">${escapeHtml(exams[0].title)}</span>`);
    if (planDay) {
      const plan = getPlan(planDay);
      events.push(`<span class="cal-event math">수 ${plan.math.lectureRange.length ? lectureRangeLabel(plan.math.lectureRange) : "실전"}</span>`);
      events.push(`<span class="cal-event science">과 ${lectureRangeLabel(plan.science.lectureRange)}</span>`);
      events.push(`<span class="cal-event language">국영 2지문</span>`);
      if (isSchoolDate(dateString)) events.push(`<span class="cal-event school">학교 1h</span>`);
    }
    if (reviews.length) events.push(`<span class="cal-event review">복습 ${reviews.length}</span>`);
    const classes = ["calendar-cell"];
    if (!withinRange) classes.push("is-outside-range");
    if (dateString === localDateString()) classes.push("is-today");
    if (planDay && getDayProgress(planDay).complete) classes.push("is-complete");
    cells.push(`<button class="${classes.join(" ")}" type="button" ${withinRange || events.length ? `data-open-date="${dateString}"` : "disabled"}>
      <span class="calendar-number">${day}${planDay ? `<i>D${planDay}</i>` : ""}</span>
      <span class="calendar-events">${events.join("")}</span>
    </button>`);
  }
  return `<article class="calendar-month panel"><h3>${year}년 ${month + 1}월</h3><div class="calendar-weekdays"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="calendar-grid">${cells.join("")}</div></article>`;
}

function renderReviewView() {
  state.reviewIntervals.forEach((value, index) => {
    const input = $(`[data-interval-index="${index}"]`);
    if (input) input.value = value;
  });
  $("#review-view-date").value = state.reviewViewDate;
  $("#mistake-date").value ||= localDateString();
  $("#blank-date").value ||= localDateString();
  renderReviewStats();
  renderReviewQueue();
  renderMistakes();
  renderBlankReviews();
}

function renderReviewStats() {
  const data = reviewStats();
  $("#review-stats").innerHTML = `
    <div><strong>${data.due}</strong><span>오늘/밀린 복습</span></div>
    <div><strong>${data.completed}</strong><span>5주기 완주</span></div>
    <div><strong>${data.successRate}%</strong><span>인출 성공률</span></div>
    <div><strong>${data.tracks}</strong><span>관리 중 묶음</span></div>`;
}

function renderReviewQueue() {
  const items = getDueReviewItems(state.reviewViewDate, true);
  $("#review-queue").innerHTML = renderReviewItems(items, { handledDate: state.reviewViewDate, showEmpty: true, allowActions: compareDateStrings(state.reviewViewDate, localDateString()) <= 0 });
}

function renderReviewItems(items, options = {}) {
  const { handledDate = localDateString(), showEmpty = false, allowActions = true } = options;
  if (!items.length) return showEmpty ? `<div class="empty-state compact-empty">이 날짜까지 해야 할 미완료 복습이 없습니다.</div>` : "";
  return items.map(item => {
    const typeLabel = item.track.type === "study" ? "학습 복습" : item.track.type === "mistake" ? "오답" : "백지";
    const actionHtml = allowActions ? `<div class="review-actions"><button class="success-button" type="button" data-review-success="${escapeHtml(item.track.id)}" data-handled-date="${handledDate}">성공 ✓</button><button class="retry-button" type="button" data-review-fail="${escapeHtml(item.track.id)}" data-handled-date="${handledDate}">다시 ↻</button></div>` : `<span class="planned-badge">${formatDate(item.dueDate, false)} 예정</span>`;
    return `<article class="review-item ${item.overdue ? "is-overdue" : ""}">
      <div class="review-item-main"><div class="review-item-chips"><span class="subject-chip" data-subject="${escapeHtml(item.track.subject)}">${escapeHtml(item.track.subject)}</span><span class="type-chip">${typeLabel}</span>${item.overdue ? `<span class="overdue-chip">${Math.abs(Math.round((parseDate(item.dueDate) - parseDate(handledDate)) / 86400000))}일 밀림</span>` : ""}</div><h4>${escapeHtml(item.track.label)}</h4><p>${escapeHtml(item.track.source)} · ${escapeHtml(item.track.detail)}</p><small>${reviewStageLabel(item.stage)} · 예정 ${formatDate(item.dueDate)}</small></div>
      ${actionHtml}
    </article>`;
  }).join("");
}

function renderMistakes() {
  const container = $("#mistake-list");
  if (!state.mistakes.length) {
    container.innerHTML = `<div class="empty-state compact-empty">틀린 문제를 등록하면 복습 날짜가 자동으로 생성됩니다.</div>`;
    return;
  }
  container.innerHTML = state.mistakes.map(item => {
    const track = getTrackById(item.id);
    const cycle = getReviewCycle(track);
    const next = getNextReviewDate(track);
    return `<article class="tracker-item"><div><span class="subject-chip" data-subject="${item.subject}">${escapeHtml(item.subject)}</span><strong>${escapeHtml(item.book)} · ${escapeHtml(item.locator)}</strong><p>${escapeHtml(item.reason)}</p><small>${cycle.done ? "복습 5주기 완료" : `다음 복습 ${formatDate(next)} · ${reviewStageLabel(cycle.stage)}`}</small></div><button class="text-button danger" type="button" data-delete-mistake="${item.id}">삭제</button></article>`;
  }).join("");
}

function renderBlankReviews() {
  const container = $("#blank-list");
  if (!state.blankReviews.length) {
    container.innerHTML = `<div class="empty-state compact-empty">백지에서 막힌 단원을 등록하면 다시 꺼낼 날이 자동으로 잡힙니다.</div>`;
    return;
  }
  container.innerHTML = state.blankReviews.map(item => {
    const track = getTrackById(item.id);
    const cycle = getReviewCycle(track);
    const next = getNextReviewDate(track);
    return `<article class="tracker-item"><div><span class="subject-chip" data-subject="${item.subject}">${escapeHtml(item.subject)}</span><strong>${escapeHtml(item.unit)}</strong><p>막힌 부분: ${escapeHtml(item.blocked)}</p><small>${cycle.done ? "복습 5주기 완료" : `다음 복습 ${formatDate(next)} · ${reviewStageLabel(cycle.stage)}`}</small></div><button class="text-button danger" type="button" data-delete-blank="${item.id}">삭제</button></article>`;
  }).join("");
}

function hasOnePageContent(day) {
  const d = getDayState(day);
  return Boolean(d.resultTitle || d.rating || d.concepts.some(Boolean) || d.representative || d.mistake || d.visual || d.stuck || d.question || d.attachment);
}

function renderOutputs() {
  const count = STUDY_PLAN.filter(item => getDayState(item.day).checks.output).length;
  $("#output-count-large").textContent = count;
  $("#output-list").innerHTML = STUDY_PLAN.map(item => {
    const d = getDayState(item.day);
    const complete = d.checks.output;
    return `<article class="output-card ${complete ? "is-complete" : ""}">
      <div class="output-card-top"><div><span class="phase-chip">Day ${item.day}</span><small>${formatDate(getDateStringForDay(item.day), false)}</small></div>${d.attachment ? `<span class="attachment-badge">▣ 첨부</span>` : ""}</div>
      <h3>${escapeHtml(d.resultTitle || `${item.math.focus} · ${item.science.focus}`)}</h3>
      <p>${escapeHtml(item.outputPrompt)}</p>
      <div class="output-preview"><span>핵심: ${escapeHtml(d.concepts.filter(Boolean).join(" · ") || "아직 작성 전")}</span><span>다음 질문: ${escapeHtml(d.question || "아직 작성 전")}</span></div>
      <div class="output-card-actions"><button class="primary-button" type="button" data-open-day="${item.day}">${hasOnePageContent(item.day) ? "계속 작성" : "작성"}</button><button class="secondary-button" type="button" data-print-day="${item.day}">인쇄</button></div>
    </article>`;
  }).join("");
}

function renderResources() {
  $("#resource-list").innerHTML = RESOURCE_LINKS.map(item => `<article class="resource-card"><span class="resource-card-type">${escapeHtml(item.type)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><a class="secondary-button" href="${item.url}" target="_blank" rel="noopener noreferrer">열기 ↗</a></article>`).join("");
  $("#textbook-guide").innerHTML = TEXTBOOK_INFO.map(book => `<article><span class="subject-chip" data-subject="${book.subject}">${book.subject}</span><h4>${escapeHtml(book.title)}</h4><strong>${escapeHtml(book.role)}</strong><p>${escapeHtml(book.note)}</p></article>`).join("");
  $("#math-lecture-index").innerHTML = MATH_LECTURES.map((title, index) => `<div class="lecture-item"><span class="lecture-number">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(title)}</span></div>`).join("");
  $("#science-lecture-index").innerHTML = SCIENCE_LECTURES.map((title, index) => `<div class="lecture-item"><span class="lecture-number">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(title)}</span></div>`).join("");
}

function taskCheckRow(day, key, title, detail, minutes, logKey = null, logPlaceholder = "") {
  const d = getDayState(day);
  return `<div class="task-check-row ${getTaskDone(day, key) ? "is-done" : ""}">
    <label><input type="checkbox" data-day-check="${key}" ${getTaskDone(day, key) ? "checked" : ""}><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)} · ${formatMinutes(minutes)}</small></span></label>
    ${logKey ? `<input class="actual-log-input" type="text" data-log-key="${logKey}" value="${escapeHtml(d.logs[logKey] || "")}" placeholder="${escapeHtml(logPlaceholder)}">` : ""}
  </div>`;
}

function openDay(day) {
  const item = getPlan(day);
  if (!item) return;
  activeDay = day;
  const d = getDayState(day);
  const dateString = getDateStringForDay(day);
  const budget = getDayBudget(day);
  $("#day-modal-meta").textContent = `${formatDate(dateString)} · ${phaseForDay(day)}`;
  $("#day-modal-title").textContent = `Day ${day} 학습·결과물`;
  const mathFit = item.math.totalMinutes <= budget.math;
  const scienceFit = item.science.totalMinutes <= budget.science;
  $("#day-budget-banner").innerHTML = `<div><strong>${budget.mode} 시간표</strong><span>수학 ${formatMinutes(budget.math)} · 과학 ${formatMinutes(budget.science)} · 국어·영어 ${formatMinutes(budget.language)}${budget.school ? ` · 학교복습 ${formatMinutes(budget.school)}` : ""}</span></div><div class="fit-badges"><span class="${mathFit ? "fit" : "over"}">수학 ${mathFit ? "적합" : "초과"}</span><span class="${scienceFit ? "fit" : "over"}">과학 ${scienceFit ? "적합" : "초과"}</span><span class="fit">국영 지문</span></div>`;

  $("#day-task-sections").innerHTML = `
    <section class="day-subject-section math-section">
      <div class="day-subject-heading"><div><span class="subject-chip" data-subject="수학">수학</span><h3>${escapeHtml(item.math.focus)}</h3><p>${escapeHtml(item.math.unit)}</p></div><a class="secondary-button" href="${MATH_COURSE_URL}" target="_blank" rel="noopener noreferrer">정승제 강좌 ↗</a></div>
      <div class="task-check-list">
        ${taskCheckRow(day, "mathLecture", item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)}` : "수학 누적 실전", item.math.lectureRange.length ? item.math.lectureTitles.join(" · ") : "도형·집합과 명제·함수 누적 실전", item.math.lectureMinutes)}
        ${taskCheckRow(day, "conceptMath", "개념원리 공통수학2", item.math.conceptTask, item.math.conceptMinutes, "conceptMath", "실제 푼 페이지·예제 번호")}
        ${taskCheckRow(day, "maplMath", "마플 시너지 공통수학2", item.math.practiceTask, item.math.practiceMinutes, "maplMath", "실제 푼 페이지·문제 번호")}
      </div>
    </section>
    <section class="day-subject-section science-section">
      <div class="day-subject-heading"><div><span class="subject-chip" data-subject="과학">과학</span><h3>${escapeHtml(item.science.focus)}</h3><p>${escapeHtml(item.science.unit)}</p></div><a class="secondary-button" href="${SCIENCE_COURSE_URL}" target="_blank" rel="noopener noreferrer">김청해 강좌 ↗</a></div>
      <div class="task-check-list">
        ${taskCheckRow(day, "scienceLecture", `김청해 ${lectureRangeLabel(item.science.lectureRange)}`, item.science.lectureTitles.join(" · "), item.science.lectureMinutes)}
        ${taskCheckRow(day, "o2Science", "오투 통합과학2", item.science.o2Task, item.science.o2Minutes, "o2Science", "실제 푼 페이지·문제 번호")}
        ${taskCheckRow(day, "wanjaScience", "완자 기출픽 통합과학2", item.science.wanjaTask, item.science.wanjaMinutes, "wanjaScience", "실제 푼 페이지·문제 번호")}
      </div>
    </section>
    <section class="day-subject-section language-section">
      <div class="day-subject-heading"><div><span class="subject-chip" data-subject="국어">국어·영어</span><h3>매일 지문 루틴</h3><p>영어 1지문과 매3비 비문학 1지문은 속도를 잃지 않기 위한 최소 루틴입니다.</p></div></div>
      <div class="task-check-list language-task-list">
        ${LANGUAGE_TASKS.map(task => taskCheckRow(day, task.key, task.title, task.detail, getLanguageMinutes(task), task.key, task.logPlaceholder)).join("")}
      </div>
    </section>`;

  const planned = getPlannedReviewEventsOnDate(dateString);
  $("#day-review-list").innerHTML = renderPlannedReviewEvents(planned, dateString);
  const schoolSection = $("#school-review-section");
  const school = isSchoolDate(dateString);
  schoolSection.hidden = !school;
  if (school) {
    $("#school-review-check").checked = Boolean(d.school.done);
    $("#school-review-topic").value = d.school.topic || "";
    $("#school-review-note").value = d.school.note || "";
  }
  $("#output-check").checked = Boolean(d.checks.output);
  $("#result-title").value = d.resultTitle || "";
  $("#self-rating").value = d.rating || "";
  $("#concept-1").value = d.concepts[0] || "";
  $("#concept-2").value = d.concepts[1] || "";
  $("#concept-3").value = d.concepts[2] || "";
  $("#representative-note").value = d.representative || "";
  $("#mistake-note").value = d.mistake || "";
  $("#visual-note").value = d.visual || "";
  $("#stuck-note").value = d.stuck || "";
  $("#review-question").value = d.question || "";
  $("#output-prompt").textContent = getOutputPrompt(item);
  renderAttachmentInfo(day);
  $("#day-modal-backdrop").hidden = false;
  document.body.style.overflow = "hidden";
}

function renderPlannedReviewEvents(events, dateString) {
  if (!events.length) return `<div class="empty-state compact-empty">이날 예정된 간격 복습이 없습니다.</div>`;
  const today = localDateString();
  return events.map(event => {
    const currentDue = getNextReviewDate(event.track);
    const canHandle = event.status === "next" && currentDue && compareDateStrings(today, currentDue) >= 0;
    return `<article class="review-item planned-review-item ${event.status === "done" ? "is-done" : ""}"><div class="review-item-main"><div class="review-item-chips"><span class="subject-chip" data-subject="${event.track.subject}">${escapeHtml(event.track.subject)}</span><span class="type-chip">${reviewStageLabel(event.stage)}</span></div><h4>${escapeHtml(event.track.label)}</h4><p>${escapeHtml(event.track.source)} · ${escapeHtml(event.track.detail)}</p></div>${canHandle ? `<div class="review-actions"><button class="success-button" type="button" data-review-success="${event.track.id}" data-handled-date="${today}">성공 ✓</button><button class="retry-button" type="button" data-review-fail="${event.track.id}" data-handled-date="${today}">다시 ↻</button></div>` : `<span class="planned-badge">${event.status === "done" ? "완료" : formatDate(dateString, false)}</span>`}</article>`;
  }).join("");
}

function closeDayModal() {
  $("#day-modal-backdrop").hidden = true;
  document.body.style.overflow = "";
  activeDay = null;
  renderAll();
}

function openDate(dateString) {
  activeDate = dateString;
  const day = getDayForDate(dateString);
  const planned = getPlannedReviewEventsOnDate(dateString);
  const due = getDueReviewItems(dateString, false);
  $("#date-modal-title").textContent = formatDateLong(dateString);
  let html = "";
  const exams = getMockExamsOnDate(dateString);
  if (exams.length) {
    html += exams.map(exam => `<section class="exam-date-card"><span class="subject-chip" data-subject="모의고사">${escapeHtml(exam.weekday || "")}</span><h3>${escapeHtml(exam.title)}</h3><p>${escapeHtml(exam.description)}</p></section>`).join("");
  }
  if (day) {
    const item = getPlan(day);
    const budget = getDayBudget(day);
    const mathLectureList = item.math.lectureRange.length
      ? item.math.lectureTitles.map((title, index) => `<li><b>${item.math.lectureRange[0] + index}강</b> ${escapeHtml(title)}</li>`).join("")
      : `<li><b>누적 실전</b> 개념·유형·오답을 시간 안에 다시 풉니다.</li>`;
    const scienceLectureList = item.science.lectureTitles.map((title, index) => `<li><b>${item.science.lectureRange[0] + index}강</b> ${escapeHtml(title)}</li>`).join("");
    html += `<section class="date-study-card"><div class="date-study-head"><div><span class="phase-chip">Day ${day} · ${phaseForDay(day)}</span><h3>새 학습</h3></div><button class="primary-button" type="button" data-open-day="${day}">체크·기록 열기</button></div><div class="date-study-grid"><div class="math-block"><b>수학 ${formatMinutes(budget.math)}</b><strong>${escapeHtml(item.math.focus)}</strong><span>${item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)}` : "누적 실전"}</span><ul class="date-lecture-list">${mathLectureList}</ul><div class="date-book-tasks"><p><b>개념원리</b> ${escapeHtml(item.math.conceptTask)}</p><p><b>마플 시너지</b> ${escapeHtml(item.math.practiceTask)}</p></div></div><div class="science-block"><b>과학 ${formatMinutes(budget.science)}</b><strong>${escapeHtml(item.science.focus)}</strong><span>김청해 ${lectureRangeLabel(item.science.lectureRange)}</span><ul class="date-lecture-list">${scienceLectureList}</ul><div class="date-book-tasks"><p><b>오투</b> ${escapeHtml(item.science.o2Task)}</p><p><b>완자 기출픽</b> ${escapeHtml(item.science.wanjaTask)}</p></div></div><div class="reading-block"><b>국어·영어 ${formatMinutes(budget.language)}</b><strong>매일 지문 루틴</strong><span>${escapeHtml(getLanguageSummary())}</span><div class="date-book-tasks">${LANGUAGE_TASKS.map(task => `<p><b>${escapeHtml(task.shortTitle || task.title)}</b> ${escapeHtml(task.detail)}</p>`).join("")}</div></div></div>${isSchoolDate(dateString) ? `<p class="school-date-note">🏫 학교 수업 복습 ${formatMinutes(budget.school)}</p>` : ""}</section>`;
  }
  html += `<section class="date-review-card"><div class="modal-section-heading"><div><span class="panel-kicker">REVIEW</span><h3>이날의 복습 일정 ${planned.length ? `(${planned.length}개)` : ""}</h3></div></div>${planned.length ? renderPlannedReviewEvents(planned, dateString) : `<div class="empty-state compact-empty">예정된 복습이 없습니다.</div>`}</section>`;
  if (!day && !planned.length && !due.length) html = `<div class="empty-state">이 날짜에는 등록된 학습이나 복습 일정이 없습니다.</div>`;
  $("#date-modal-body").innerHTML = html;
  $("#date-modal-backdrop").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDateModal() {
  $("#date-modal-backdrop").hidden = true;
  document.body.style.overflow = "";
  activeDate = null;
}

function syncOutputFields() {
  if (!activeDay) return;
  const d = getDayState(activeDay);
  d.resultTitle = $("#result-title").value;
  d.rating = $("#self-rating").value;
  d.concepts = [$("#concept-1").value, $("#concept-2").value, $("#concept-3").value];
  d.representative = $("#representative-note").value;
  d.mistake = $("#mistake-note").value;
  d.visual = $("#visual-note").value;
  d.stuck = $("#stuck-note").value;
  d.question = $("#review-question").value;
  d.updatedAt = new Date().toISOString();
  saveState();
}

function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

const debouncedOutputSave = debounce(syncOutputFields, 240);

function printDay(day) {
  const item = getPlan(day);
  const d = getDayState(day);
  const title = d.resultTitle || `Day ${day} 공통수학2·통합과학2·국영 지문 한 장 정리`;
  const concepts = [0, 1, 2].map(index => d.concepts[index] || "");
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) {
    showToast("팝업 차단을 해제한 뒤 다시 시도해주세요.");
    return;
  }
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    @page{size:A4;margin:13mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;color:#111827;margin:0;font-size:12.5px;line-height:1.55}.page{border:1px solid #cbd5e1;padding:16px;min-height:268mm}.top{display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #1e3a8a;padding-bottom:10px}.top h1{font-size:22px;margin:0}.meta{color:#475569}.badge{display:inline-block;background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:4px 9px;font-weight:800}section{border-top:1px dashed #cbd5e1;padding-top:10px;margin-top:10px}h2{font-size:14px;margin:0 0 6px;color:#1e3a8a}.box{min-height:42px;border:1px solid #dbe3ef;border-radius:8px;padding:9px;background:#f8fafc}.concepts{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.courses{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px}.footer{display:flex;justify-content:space-between;margin-top:12px;color:#64748b;font-size:11px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><main class="page"><div class="top"><div><span class="badge">Day ${day}</span><h1>${escapeHtml(title)}</h1><div class="meta">${escapeHtml(formatDate(getDateStringForDay(day)))} · 자기평가 ${escapeHtml(d.rating || "-")} / 5</div></div></div><section class="courses"><div><h2>수학</h2><div class="box">${escapeHtml(item.math.focus)}<br>${item.math.lectureRange.length ? `정승제 ${escapeHtml(lectureRangeLabel(item.math.lectureRange))}` : "누적 실전"}</div></div><div><h2>과학</h2><div class="box">${escapeHtml(item.science.focus)}<br>김청해 ${escapeHtml(lectureRangeLabel(item.science.lectureRange))}</div></div><div><h2>국어·영어</h2><div class="box">${escapeHtml(getLanguageSummary())}<br>영어 막힌 문장 + 매3비 선지 근거</div></div></section><section><h2>1. 오늘의 핵심 개념 3개</h2><div class="concepts">${concepts.map(value => `<div class="box">${escapeHtml(value)}</div>`).join("")}</div></section><section><h2>2. 대표문제 또는 대표개념</h2><div class="box">${multiline(d.representative)}</div></section><section class="two"><div><h2>3. 오답·헷갈린 포인트</h2><div class="box">${multiline(d.mistake)}</div></div><div><h2>4. 그림·그래프·흐름도</h2><div class="box">${multiline(d.visual)}</div></div></section><section class="two"><div><h2>5. 오늘 막힌 점</h2><div class="box">${multiline(d.stuck)}</div></div><div><h2>6. 다음 복습 질문</h2><div class="box">${multiline(d.question)}</div></div></section><section><h2>오늘 결과물 미션</h2><div class="box">${escapeHtml(getOutputPrompt(item))}</div></section><div class="footer"><span>고1 공통수학2·통합과학2 학습·복습 대시보드</span><span>${d.checks.output ? "완료" : "작성 중"}</span></div></main><script>window.onload=()=>window.print();</script></body></html>`);
  popup.document.close();
}

function exportProgress() {
  const payload = {
    app: "고1 공통수학2·통합과학2 학습·복습 대시보드",
    exportedAt: new Date().toISOString(),
    note: "첨부 이미지/PDF 파일은 JSON 백업에 포함되지 않습니다.",
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `g1-study-backup-${localDateString()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("진도 백업 파일을 만들었습니다.");
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const imported = parsed.state || parsed;
    if (!imported || typeof imported !== "object") throw new Error("올바른 백업 파일이 아닙니다.");
    const fallback = buildDefaultState();
    if (Number(imported.version) < 5) state = migrateOldState(imported, fallback);
    else {
      const days = {};
      STUDY_PLAN.forEach(item => { days[item.day] = normalizeDayState(imported.days?.[item.day]); });
      state = {
        ...fallback,
        ...imported,
        version: APP_VERSION,
        days,
        reviewIntervals: normalizeIntervals(imported.reviewIntervals || DEFAULT_REVIEW_INTERVALS),
        timeBudgets: { ...fallback.timeBudgets, ...(imported.timeBudgets || {}) },
        reviewCycles: imported.reviewCycles || {},
        mistakes: Array.isArray(imported.mistakes) ? imported.mistakes : [],
        blankReviews: Array.isArray(imported.blankReviews) ? imported.blankReviews : []
      };
    }
    saveState();
    renderAll();
    showToast("백업을 불러왔습니다.");
  } catch (error) {
    alert(`백업을 불러오지 못했습니다.\n${error.message}`);
  }
}

async function resetProgress() {
  if (!confirm("모든 체크, 결과물, 복습 기록, 오답·백지 기록과 첨부 파일을 초기화할까요?")) return;
  state = buildDefaultState();
  saveState();
  try { await clearAllAttachments(); } catch (error) { console.warn(error); }
  renderAll();
  showToast("전체 데이터를 초기화했습니다.");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function uniqueId(prefix) {
  return `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function openDb() {
  if (!window.indexedDB) return Promise.reject(new Error("IndexedDB를 지원하지 않는 브라우저입니다."));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE, { keyPath: "day" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function saveAttachment(day, file) {
  if (file.size > 10 * 1024 * 1024) throw new Error("첨부 파일은 10MB 이하만 가능합니다.");
  const allowed = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!allowed) throw new Error("이미지 또는 PDF 파일만 첨부할 수 있습니다.");
  const db = await openDb();
  const data = await file.arrayBuffer();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).put({ day: Number(day), name: file.name, type: file.type, size: file.size, lastModified: file.lastModified, data });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  const d = getDayState(day);
  d.attachment = { name: file.name, type: file.type, size: file.size };
  d.updatedAt = new Date().toISOString();
  saveState();
}

async function getAttachment(day) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readonly");
    const request = tx.objectStore(FILE_STORE).get(Number(day));
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteAttachment(day) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).delete(Number(day));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  getDayState(day).attachment = null;
  saveState();
}

async function clearAllAttachments() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function openAttachment(day) {
  const record = await getAttachment(day);
  if (!record) return showToast("첨부 파일을 찾지 못했습니다.");
  const blob = new Blob([record.data], { type: record.type });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function renderAttachmentInfo(day) {
  const meta = getDayState(day).attachment;
  const container = $("#attachment-info");
  if (!meta) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `<div class="attachment-file"><span>▣ ${escapeHtml(meta.name)} · ${formatBytes(meta.size)}</span><div><button type="button" data-open-attachment="${day}">열기</button><button type="button" data-delete-attachment="${day}">삭제</button></div></div>`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function updateTimeBudget(key, value) {
  const numeric = Math.max(0, Number(value) || 0);
  const isMinuteInput = key === "englishReading" || key === "koreanReading";
  const minutes = Math.round(isMinuteInput ? numeric : numeric * 60);
  state.timeBudgets[key] = minutes;
  saveState();
  renderAll();
}

function bindEvents() {
  $$(".nav-button").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
  $("#theme-toggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
  });
  $("#start-date").addEventListener("change", event => {
    if (!event.target.value) return;
    state.startDate = event.target.value;
    resetStudyReviewCycles();
    saveState();
    renderAll();
    showToast("시작일·종료일·복습 캘린더를 다시 계산했습니다.");
  });
  $("#school-start-date").addEventListener("change", event => {
    if (!event.target.value) return;
    state.schoolStartDate = event.target.value;
    saveState();
    renderAll();
    showToast("개학일과 일일 시간표를 변경했습니다.");
  });
  const timeMap = {
    "#vacation-math-hours": "vacationMath",
    "#vacation-science-hours": "vacationScience",
    "#school-math-hours": "schoolMath",
    "#school-science-hours": "schoolScience",
    "#english-reading-minutes": "englishReading",
    "#korean-reading-minutes": "koreanReading",
    "#school-review-hours": "schoolReview"
  };
  Object.entries(timeMap).forEach(([selector, key]) => $(selector).addEventListener("change", event => updateTimeBudget(key, event.target.value)));
  $("#export-button").addEventListener("click", exportProgress);
  $("#import-input").addEventListener("change", event => {
    const [file] = event.target.files;
    if (file) importProgress(file);
    event.target.value = "";
  });
  $("#reset-button").addEventListener("click", resetProgress);

  $("#phase-filters").addEventListener("click", event => {
    const button = event.target.closest("[data-filter-phase]");
    if (!button) return;
    phaseFilter = button.dataset.filterPhase;
    $$("[data-filter-phase]").forEach(item => item.classList.toggle("is-active", item === button));
    renderPlan();
  });
  $("#status-filter").addEventListener("change", event => {
    statusFilter = event.target.value;
    renderPlan();
  });

  $("#review-view-date").addEventListener("change", event => {
    state.reviewViewDate = event.target.value || localDateString();
    saveState();
    renderReviewQueue();
  });
  $("#interval-inputs").addEventListener("change", () => {
    const values = $$('[data-interval-index]').map(input => input.value);
    state.reviewIntervals = normalizeIntervals(values);
    saveState();
    renderAll();
    showToast("복습 주기와 전체 캘린더를 다시 계산했습니다.");
  });
  $("#restore-default-intervals").addEventListener("click", () => {
    state.reviewIntervals = [...DEFAULT_REVIEW_INTERVALS];
    saveState();
    renderAll();
    showToast("기본 복습 주기로 복원했습니다.");
  });

  $("#mistake-form").addEventListener("submit", event => {
    event.preventDefault();
    const item = {
      id: uniqueId("mistake"),
      subject: $("#mistake-subject").value,
      book: $("#mistake-book").value,
      locator: $("#mistake-locator").value.trim(),
      reason: $("#mistake-reason").value.trim(),
      baseDate: $("#mistake-date").value || localDateString()
    };
    if (!item.locator || !item.reason) return;
    state.mistakes.unshift(item);
    saveState();
    event.currentTarget.reset();
    $("#mistake-date").value = localDateString();
    renderAll();
    showToast("오답을 등록하고 복습 날짜를 만들었습니다.");
  });

  $("#blank-form").addEventListener("submit", event => {
    event.preventDefault();
    const item = {
      id: uniqueId("blank"),
      subject: $("#blank-subject").value,
      unit: $("#blank-unit").value.trim(),
      blocked: $("#blank-blocked").value.trim(),
      baseDate: $("#blank-date").value || localDateString()
    };
    if (!item.unit || !item.blocked) return;
    state.blankReviews.unshift(item);
    saveState();
    event.currentTarget.reset();
    $("#blank-date").value = localDateString();
    renderAll();
    showToast("백지 복습 항목과 다음 복습일을 만들었습니다.");
  });

  document.addEventListener("click", event => {
    const goView = event.target.closest("[data-go-view]");
    if (goView) {
      if (!$("#date-modal-backdrop").hidden) closeDateModal();
      if (!$("#day-modal-backdrop").hidden) closeDayModal();
      switchView(goView.dataset.goView);
    }
    const openDayButton = event.target.closest("[data-open-day]");
    if (openDayButton) {
      if (!$("#date-modal-backdrop").hidden) closeDateModal();
      openDay(Number(openDayButton.dataset.openDay));
    }
    const openDateButton = event.target.closest("[data-open-date]");
    if (openDateButton) openDate(openDateButton.dataset.openDate);
    const printButton = event.target.closest("[data-print-day]");
    if (printButton) printDay(Number(printButton.dataset.printDay));
    const success = event.target.closest("[data-review-success]");
    if (success) handleReview(success.dataset.reviewSuccess, "success", success.dataset.handledDate || localDateString());
    const fail = event.target.closest("[data-review-fail]");
    if (fail) handleReview(fail.dataset.reviewFail, "fail", fail.dataset.handledDate || localDateString());
    const deleteMistake = event.target.closest("[data-delete-mistake]");
    if (deleteMistake) {
      const id = deleteMistake.dataset.deleteMistake;
      state.mistakes = state.mistakes.filter(item => item.id !== id);
      delete state.reviewCycles[id];
      saveState();
      renderAll();
    }
    const deleteBlank = event.target.closest("[data-delete-blank]");
    if (deleteBlank) {
      const id = deleteBlank.dataset.deleteBlank;
      state.blankReviews = state.blankReviews.filter(item => item.id !== id);
      delete state.reviewCycles[id];
      saveState();
      renderAll();
    }
    const openFile = event.target.closest("[data-open-attachment]");
    if (openFile) openAttachment(Number(openFile.dataset.openAttachment)).catch(error => alert(error.message));
    const deleteFile = event.target.closest("[data-delete-attachment]");
    if (deleteFile) {
      const day = Number(deleteFile.dataset.deleteAttachment);
      deleteAttachment(day).then(() => {
        renderAttachmentInfo(day);
        renderOutputs();
        showToast("첨부 파일을 삭제했습니다.");
      }).catch(error => alert(error.message));
    }
  });

  $("#start-next-button").addEventListener("click", event => openDay(Number(event.currentTarget.dataset.day)));
  $("#next-detail-button").addEventListener("click", event => openDay(Number(event.currentTarget.dataset.day)));
  $("#next-calendar-button").addEventListener("click", event => openDate(event.currentTarget.dataset.date));
  $("#open-next-output").addEventListener("click", event => openDay(Number(event.currentTarget.dataset.day)));
  $("#open-today-review").addEventListener("click", () => {
    state.reviewViewDate = localDateString();
    saveState();
    switchView("review");
  });

  $("#day-modal-close").addEventListener("click", closeDayModal);
  $("#day-modal-done").addEventListener("click", closeDayModal);
  $("#day-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) closeDayModal(); });
  $("#date-modal-close").addEventListener("click", closeDateModal);
  $("#date-modal-done").addEventListener("click", closeDateModal);
  $("#date-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) closeDateModal(); });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (!$("#date-modal-backdrop").hidden) closeDateModal();
    else if (!$("#day-modal-backdrop").hidden) closeDayModal();
  });

  $("#day-task-sections").addEventListener("change", event => {
    const checkbox = event.target.closest("[data-day-check]");
    if (checkbox && activeDay) {
      setTaskDone(activeDay, checkbox.dataset.dayCheck, checkbox.checked);
      saveState();
      openDay(activeDay);
      renderDashboard();
      renderPlan();
    }
  });
  $("#day-task-sections").addEventListener("input", event => {
    const input = event.target.closest("[data-log-key]");
    if (input && activeDay) {
      getDayState(activeDay).logs[input.dataset.logKey] = input.value;
      saveState();
    }
  });
  $("#school-review-check").addEventListener("change", event => {
    if (!activeDay) return;
    getDayState(activeDay).school.done = event.target.checked;
    saveState();
    renderDashboard();
  });
  ["#school-review-topic", "#school-review-note"].forEach(selector => $(selector).addEventListener("input", () => {
    if (!activeDay) return;
    const d = getDayState(activeDay);
    d.school.topic = $("#school-review-topic").value;
    d.school.note = $("#school-review-note").value;
    saveState();
  }));
  $("#output-check").addEventListener("change", event => {
    if (!activeDay) return;
    getDayState(activeDay).checks.output = event.target.checked;
    saveState();
    renderDashboard();
    renderOutputs();
  });
  ["#result-title", "#self-rating", "#concept-1", "#concept-2", "#concept-3", "#representative-note", "#mistake-note", "#visual-note", "#stuck-note", "#review-question"].forEach(selector => $(selector).addEventListener("input", debouncedOutputSave));
  $("#complete-day-button").addEventListener("click", () => {
    if (!activeDay) return;
    DAY_CHECK_KEYS.filter(key => key !== "output").forEach(key => setTaskDone(activeDay, key, true));
    if (isSchoolDate(getDateStringForDay(activeDay))) setTaskDone(activeDay, "schoolReview", true);
    saveState();
    openDay(activeDay);
    renderDashboard();
    renderPlan();
    showToast("기본 학습을 모두 완료로 표시했습니다.");
  });
  $("#print-button").addEventListener("click", () => {
    syncOutputFields();
    printDay(activeDay);
  });
  $("#attachment-input").addEventListener("change", async event => {
    const [file] = event.target.files;
    event.target.value = "";
    if (!file || !activeDay) return;
    try {
      await saveAttachment(activeDay, file);
      renderAttachmentInfo(activeDay);
      renderOutputs();
      showToast("결과물 파일을 브라우저에 저장했습니다.");
    } catch (error) {
      alert(error.message);
    }
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.warn("오프라인 캐시 등록 실패", error)));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderAll();
  registerServiceWorker();
});
