const STORAGE_KEY = "g1-common-math2-science2-dashboard-v5";
const OLD_STORAGE_KEY = "g1-common-math2-science2-dashboard-v3";
const DB_NAME = "g1-study-dashboard-files";
const DB_VERSION = 1;
const FILE_STORE = "attachments";
const DAY_CHECK_KEYS = ["mathLecture", "conceptMath", "maplMath", "scienceLecture", "o2Science", "wanjaScience", "englishPassage", "mae3biPassage", "output"];
const BOOK_CHECK_KEYS = ["conceptMath", "maplMath", "o2Science", "wanjaScience", "englishPassage", "mae3biPassage"];
const TASK_STATUS_PENDING = "pending";
const TASK_STATUS_DONE = "done";
const TASK_STATUS_MISSED = "missed";

let state = loadState();
let activeView = "dashboard";
let activeDay = null;
let activeDate = null;
let phaseFilter = "전체";
let statusFilter = "전체";
let toastTimer = null;
let dbPromise = null;
let timerTickHandle = null;
let timerWakeLock = null;
let timerAudioContext = null;
const BASE_DOCUMENT_TITLE = document.title;

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

function defaultTimerState() {
  return {
    focusMinutes: 50,
    breakMinutes: 10,
    phase: "focus",
    status: "idle",
    remainingSeconds: 50 * 60,
    phaseTotalSeconds: 50 * 60,
    targetAt: null,
    phaseStartedAt: null,
    subject: "수학",
    task: "정승제 강의",
    autoStartNext: false,
    sound: true
  };
}

function normalizeTimerState(raw = {}) {
  const base = defaultTimerState();
  const focusMinutes = Math.max(10, Math.min(120, Number(raw.focusMinutes) || base.focusMinutes));
  const breakMinutes = Math.max(1, Math.min(60, Number(raw.breakMinutes) || base.breakMinutes));
  const phase = raw.phase === "break" ? "break" : "focus";
  const configuredSeconds = (phase === "focus" ? focusMinutes : breakMinutes) * 60;
  let status = ["idle", "running", "paused"].includes(raw.status) ? raw.status : "idle";
  const targetAt = Number(raw.targetAt) || null;
  if (status === "running" && !targetAt) status = "paused";
  const phaseTotalSeconds = Math.max(1, Number(raw.phaseTotalSeconds) || configuredSeconds);
  let remainingSeconds = Math.max(0, Math.min(phaseTotalSeconds, Number(raw.remainingSeconds) || phaseTotalSeconds));
  if (status === "running" && targetAt) remainingSeconds = Math.max(0, Math.ceil((targetAt - Date.now()) / 1000));
  if (status === "idle" && remainingSeconds <= 0) remainingSeconds = configuredSeconds;
  const subjectAliases = { "매3비": "국어", "학교 복습": "학교 수업", "오답·간격 복습": "복습" };
  const subject = subjectAliases[String(raw.subject || "")] || String(raw.subject || base.subject);
  return {
    ...base,
    ...raw,
    focusMinutes,
    breakMinutes,
    phase,
    status,
    remainingSeconds,
    phaseTotalSeconds,
    targetAt,
    phaseStartedAt: raw.phaseStartedAt || null,
    subject,
    task: String(raw.task || base.task).slice(0, 80),
    autoStartNext: Boolean(raw.autoStartNext),
    sound: raw.sound !== false
  };
}

function normalizeStudySessions(values) {
  if (!Array.isArray(values)) return [];
  return values
    .filter(item => item && typeof item === "object")
    .map(item => ({
      id: String(item.id || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      date: item.date || localDateString(item.endedAt ? new Date(item.endedAt) : new Date()),
      subject: String(item.subject || "기타"),
      task: String(item.task || "집중 학습").slice(0, 80),
      durationSeconds: Math.max(1, Math.round(Number(item.durationSeconds) || 0)),
      startedAt: item.startedAt || new Date().toISOString(),
      endedAt: item.endedAt || new Date().toISOString(),
      completed: Boolean(item.completed)
    }))
    .filter(item => item.durationSeconds > 0)
    .slice(0, 2000);
}

function defaultDayState() {
  const flags = Object.fromEntries(DAY_CHECK_KEYS.map(key => [key, false]));
  return {
    checks: { ...flags },
    missed: { ...flags },
    logs: { conceptMath: "", maplMath: "", o2Science: "", wanjaScience: "", englishPassage: "", mae3biPassage: "" },
    school: { done: false, missed: false, topic: "", note: "" },
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
    reviewDrafts: {},
    mistakes: [],
    blankReviews: [],
    manualReviews: [],
    carryovers: [],
    timer: defaultTimerState(),
    studySessions: []
  };
}

function normalizeDayState(raw = {}) {
  const base = defaultDayState();
  const checks = { ...base.checks, ...(raw.checks || {}) };
  const missed = { ...base.missed, ...(raw.missed || {}) };
  DAY_CHECK_KEYS.forEach(key => {
    checks[key] = Boolean(checks[key]);
    missed[key] = checks[key] ? false : Boolean(missed[key]);
  });
  const school = { ...base.school, ...(raw.school || {}) };
  school.done = Boolean(school.done);
  school.missed = school.done ? false : Boolean(school.missed);
  return {
    ...base,
    ...raw,
    checks,
    missed,
    logs: { ...base.logs, ...(raw.logs || {}) },
    school,
    concepts: Array.isArray(raw.concepts) ? [raw.concepts[0] || "", raw.concepts[1] || "", raw.concepts[2] || ""] : base.concepts
  };
}

function normalizeReviewDrafts(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, {
    range: String(value?.range || value?.scope || "").slice(0, 500),
    note: String(value?.note || "").slice(0, 1000),
    updatedAt: value?.updatedAt || null
  }]));
}

function normalizeManualReviews(values) {
  if (!Array.isArray(values)) return [];
  return values.filter(item => item && typeof item === "object").map(item => ({
    id: String(item.id || `manual-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    subject: String(item.subject || "수학"),
    title: String(item.title || "직접 등록 복습").slice(0, 120),
    range: String(item.range || "").slice(0, 500),
    question: String(item.question || "").slice(0, 1000),
    baseDate: item.baseDate || localDateString(),
    createdAt: item.createdAt || new Date().toISOString()
  })).slice(0, 1000);
}

function normalizeCarryovers(values) {
  if (!Array.isArray(values)) return [];
  return values.filter(item => item && typeof item === "object").map(item => ({
    id: String(item.id || `carry-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    originalDay: Math.max(1, Math.min(STUDY_PLAN.length, Number(item.originalDay || item.originDay) || 1)),
    originalDate: item.originalDate || item.originDate || item.sourceDate || DEFAULT_START_DATE,
    taskKey: String(item.taskKey || ""),
    subject: String(item.subject || "기타"),
    title: String(item.title || "이월 학습").slice(0, 160),
    detail: String(item.detail || "").slice(0, 800),
    minutes: Math.max(0, Number(item.minutes) || 0),
    dueDate: item.dueDate || item.scheduledDate || localDateString(),
    status: ["pending", "done", "cancelled", "completed"].includes(item.status) ? (item.status === "completed" ? "done" : item.status) : "pending",
    note: String(item.note || item.actualScope || "").slice(0, 1000),
    history: Array.isArray(item.history) ? item.history : [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    completedDate: item.completedDate || null
  })).slice(0, 1000);
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
      reviewDrafts: normalizeReviewDrafts(parsed.reviewDrafts),
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      blankReviews: Array.isArray(parsed.blankReviews) ? parsed.blankReviews : [],
      manualReviews: normalizeManualReviews(parsed.manualReviews),
      carryovers: normalizeCarryovers(parsed.carryovers),
      timer: normalizeTimerState(parsed.timer),
      studySessions: normalizeStudySessions(parsed.studySessions)
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

function getTaskDescriptor(day, key) {
  const item = getPlan(day);
  if (!item) return null;
  const language = getLanguageTask(key);
  if (language) return { subject: language.subject, title: language.title, detail: language.detail, minutes: getLanguageMinutes(language) };
  const budget = getDayBudget(day);
  const descriptors = {
    mathLecture: { subject: "수학", title: item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)}` : "수학 누적 실전", detail: item.math.lectureRange.length ? item.math.lectureTitles.join(" · ") : "도형·집합과 명제·함수 누적 실전", minutes: item.math.lectureMinutes },
    conceptMath: { subject: "수학", title: "개념원리 공통수학2", detail: item.math.conceptTask, minutes: item.math.conceptMinutes },
    maplMath: { subject: "수학", title: "마플 시너지 공통수학2", detail: item.math.practiceTask, minutes: item.math.practiceMinutes },
    scienceLecture: { subject: "과학", title: `김청해 ${lectureRangeLabel(item.science.lectureRange)}`, detail: item.science.lectureTitles.join(" · "), minutes: item.science.lectureMinutes },
    o2Science: { subject: "과학", title: "오투 통합과학2", detail: item.science.o2Task, minutes: item.science.o2Minutes },
    wanjaScience: { subject: "과학", title: "완자 기출픽 통합과학2", detail: item.science.wanjaTask, minutes: item.science.wanjaMinutes },
    output: { subject: "결과물", title: "오늘의 한 장 결과물", detail: getOutputPrompt(item), minutes: 20 },
    schoolReview: { subject: "학교 수업", title: "학교 수업 복습", detail: "오늘 배운 범위 재구성 → 예제·숙제 → 질문 정리", minutes: budget.school || state.timeBudgets.schoolReview }
  };
  return descriptors[key] || null;
}

function carryoverId(day, key) {
  return `carry-${Number(day)}-${key}`;
}

function getCarryoverForTask(day, key) {
  return state.carryovers.find(item => item.id === carryoverId(day, key) && item.status !== "cancelled") || null;
}

function ensureCarryoverForTask(day, key) {
  const descriptor = getTaskDescriptor(day, key);
  if (!descriptor) return null;
  const id = carryoverId(day, key);
  let item = state.carryovers.find(entry => entry.id === id);
  const originalDate = getDateStringForDay(day);
  if (!item) {
    item = {
      id,
      originalDay: Number(day),
      originalDate,
      taskKey: key,
      subject: descriptor.subject,
      title: descriptor.title,
      detail: descriptor.detail,
      minutes: descriptor.minutes || 0,
      dueDate: localDateString(addDays(originalDate, 1)),
      status: "pending",
      note: "",
      history: [{ handledDate: originalDate, result: "created", note: "계획일에 ✕ 못함으로 표시되어 다음 날로 이월", createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedDate: null
    };
    state.carryovers.push(item);
  } else {
    const previousStatus = item.status;
    item.originalDate = originalDate;
    item.subject = descriptor.subject;
    item.title = descriptor.title;
    item.detail = descriptor.detail;
    item.minutes = descriptor.minutes || 0;
    item.dueDate = localDateString(addDays(originalDate, 1));
    item.status = "pending";
    item.note = "";
    item.completedDate = null;
    item.updatedAt = new Date().toISOString();
    if (previousStatus !== "pending") {
      item.history.push({ handledDate: localDateString(), result: "reopened", note: "원래 일정에서 ✕ 못함으로 다시 표시해 이월을 재개", createdAt: new Date().toISOString() });
    }
  }
  return item;
}

function cancelCarryoverForTask(day, key, reason = "원래 일정 상태 변경") {
  const item = state.carryovers.find(entry => entry.id === carryoverId(day, key) && entry.status !== "cancelled");
  if (!item) return;
  item.status = "cancelled";
  item.updatedAt = new Date().toISOString();
  item.history.push({ handledDate: localDateString(), result: "cancelled", note: reason, createdAt: new Date().toISOString() });
}

function getTaskStatus(day, key) {
  const dayState = getDayState(day);
  const done = key === "schoolReview" ? Boolean(dayState.school.done) : Boolean(dayState.checks[key]);
  if (done) return "done";
  const carry = getCarryoverForTask(day, key);
  if (carry?.status === "done") return "doneLate";
  const missed = key === "schoolReview" ? Boolean(dayState.school.missed) : Boolean(dayState.missed[key]);
  return missed ? "missed" : "pending";
}

function getTaskDone(day, key) {
  const status = getTaskStatus(day, key);
  return status === "done" || status === "doneLate";
}

function setTaskStatus(day, key, status) {
  const dayState = getDayState(day);
  const done = status === "done";
  const missed = status === "missed";
  if (key === "schoolReview") {
    dayState.school.done = done;
    dayState.school.missed = missed;
  } else {
    dayState.checks[key] = done;
    dayState.missed[key] = missed;
  }
  if (missed) ensureCarryoverForTask(day, key);
  else cancelCarryoverForTask(day, key, done ? "원래 일정에서 완료 처리" : "표시를 미정으로 되돌림");
  dayState.updatedAt = new Date().toISOString();
}

function setTaskDone(day, key, value) {
  setTaskStatus(day, key, value ? "done" : "pending");
}

function getCarryoversOnDate(dateString) {
  return state.carryovers.filter(item => item.status === "pending" && item.dueDate === dateString).sort((a, b) => a.originalDay - b.originalDay);
}

function getDueCarryovers(dateString, includeOverdue = true) {
  return state.carryovers
    .filter(item => item.status === "pending")
    .filter(item => includeOverdue ? compareDateStrings(item.dueDate, dateString) <= 0 : item.dueDate === dateString)
    .sort((a, b) => compareDateStrings(a.dueDate, b.dueDate) || a.originalDay - b.originalDay);
}

function handleCarryover(id, result, handledDate = localDateString()) {
  const item = state.carryovers.find(entry => entry.id === id && entry.status === "pending");
  if (!item) return;
  if (compareDateStrings(handledDate, item.dueDate) < 0) {
    showToast("아직 이월 예정일 전입니다.");
    return;
  }
  const note = String(item.note || "").trim();
  if (result === "done" && !note) {
    showToast("오늘 실제로 마친 범위·페이지·문제 번호를 먼저 적어주세요.");
    return;
  }
  item.history.push({ handledDate, dueDate: item.dueDate, result, range: note || "복습하지 못함", createdAt: new Date().toISOString() });
  if (result === "done") {
    item.status = "done";
    item.completedDate = handledDate;
  } else {
    item.dueDate = localDateString(addDays(handledDate, 1));
    item.note = "";
  }
  item.updatedAt = new Date().toISOString();
  saveState();
  renderAll();
  if (activeDay) openDay(activeDay);
  if (activeDate) openDate(activeDate);
  showToast(result === "done" ? "이월 과제를 완료했습니다. 원래 일정에는 ‘이월 완료’로 반영됩니다." : "아직 못한 과제를 다음 날로 다시 이월했습니다.");
}

function getDayProgress(day) {
  const keys = getRequiredTaskKeys(day);
  const count = keys.filter(key => getTaskDone(day, key)).length;
  const missed = keys.filter(key => getTaskStatus(day, key) === "missed").length;
  const late = keys.filter(key => getTaskStatus(day, key) === "doneLate").length;
  return { count, missed, late, total: keys.length, percent: Math.round((count / keys.length) * 100), complete: count === keys.length };
}

function nextIncompleteDay() {
  const todayDay = getDayForDate(localDateString());
  if (todayDay) {
    const currentOrFuture = STUDY_PLAN.find(item => item.day >= todayDay && !getDayProgress(item.day).complete);
    if (currentOrFuture) return currentOrFuture;
  }
  return STUDY_PLAN.find(item => !getDayProgress(item.day).complete) || STUDY_PLAN.at(-1);
}

function stats() {
  const completedDays = STUDY_PLAN.filter(item => getDayProgress(item.day).complete).length;
  let mathDone = 0;
  let scienceDone = 0;
  STUDY_PLAN.forEach(item => {
    const dayState = getDayState(item.day);
    if (getTaskDone(item.day, "mathLecture") && item.math.lectureRange.length) {
      mathDone += item.math.lectureRange[1] - item.math.lectureRange[0] + 1;
    }
    if (getTaskDone(item.day, "scienceLecture") && item.science.lectureRange.length) {
      scienceDone += item.science.lectureRange[1] - item.science.lectureRange[0] + 1;
    }
  });
  const outputCount = STUDY_PLAN.filter(item => getTaskDone(item.day, "output")).length;
  const readingDone = STUDY_PLAN.reduce((total, item) => total + LANGUAGE_TASKS.filter(task => getTaskDone(item.day, task.key)).length, 0);
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
  const done = STUDY_PLAN.filter(item => getTaskDone(item.day, key)).length;
  return { done, total: STUDY_PLAN.length, percent: Math.round((done / STUDY_PLAN.length) * 100) };
}

function makeStudyTracks() {
  return STUDY_PLAN.flatMap(item => {
    const baseDate = getDateStringForDay(item.day);
    const dayState = getDayState(item.day);
    const mathActual = [dayState.logs.conceptMath && `개념원리 ${dayState.logs.conceptMath}`, dayState.logs.maplMath && `마플 ${dayState.logs.maplMath}`].filter(Boolean).join(" · ");
    const scienceActual = [dayState.logs.o2Science && `오투 ${dayState.logs.o2Science}`, dayState.logs.wanjaScience && `완자 ${dayState.logs.wanjaScience}`].filter(Boolean).join(" · ");
    const languageTracks = LANGUAGE_TASKS.map(task => ({
      id: `study-${task.key}-${item.day}`,
      type: "study",
      subject: task.subject,
      day: item.day,
      baseDate,
      label: `Day ${item.day} · ${task.title}`,
      source: task.role,
      detail: dayState.logs[task.key] ? `실제 학습: ${dayState.logs[task.key]}` : task.detail
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
        detail: mathActual ? `${item.math.unit} · 실제 학습: ${mathActual}` : `${item.math.unit} · ${item.math.conceptTask}`
      },
      {
        id: `study-science-${item.day}`,
        type: "study",
        subject: "과학",
        day: item.day,
        baseDate,
        label: `Day ${item.day} · ${item.science.focus}`,
        source: `김청해 ${lectureRangeLabel(item.science.lectureRange)}`,
        detail: scienceActual ? `${item.science.unit} · 실제 학습: ${scienceActual}` : `${item.science.unit} · ${item.science.o2Task}`
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

function makeManualTracks() {
  return state.manualReviews.map(item => ({
    id: item.id,
    type: "manual",
    subject: item.subject,
    baseDate: item.baseDate,
    label: item.title,
    source: "직접 등록 복습",
    detail: `${item.range}${item.question ? ` · 인출 질문: ${item.question}` : ""}`
  }));
}

function getAllReviewTracks() {
  return [...makeStudyTracks(), ...makeMistakeTracks(), ...makeBlankTracks(), ...makeManualTracks()];
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

function reviewDraftKey(trackId, stage, dueDate) {
  return `${trackId}::${stage}::${dueDate}`;
}

function getReviewDraft(trackId, stage, dueDate) {
  const key = reviewDraftKey(trackId, stage, dueDate);
  const draft = state.reviewDrafts[key] || {};
  return { key, range: String(draft.range || ""), note: String(draft.note || "") };
}

function handleReview(trackId, result, handledDate = localDateString(), record = {}) {
  const track = getTrackById(trackId);
  if (!track) return;
  const cycle = getReviewCycle(track);
  const dueDate = getNextReviewDate(track);
  if (!dueDate) return;
  if (compareDateStrings(handledDate, dueDate) < 0) {
    showToast("아직 복습 예정일 전입니다.");
    return;
  }
  const draft = getReviewDraft(trackId, cycle.stage, dueDate);
  const range = String(record.range ?? draft.range ?? "").trim();
  const note = String(record.note ?? draft.note ?? "").trim();
  if (!range) {
    showToast("이번에 실제로 복습한 범위·페이지·문제 번호를 먼저 적어주세요.");
    return;
  }
  const historyItem = {
    handledDate,
    dueDate,
    stage: cycle.stage,
    result,
    range,
    note,
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
  delete state.reviewDrafts[draft.key];
  saveState();
  renderAll();
  if (activeDay) openDay(activeDay);
  if (activeDate) openDate(activeDate);
  showToast(result === "success" ? "복습 범위를 기록하고 다음 주기로 이동했습니다." : "복습 범위를 기록하고 주기를 오늘부터 다시 시작했습니다.");
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
  state.carryovers.filter(item => item.status === "pending").forEach(item => {
    if (compareDateStrings(item.dueDate, latest) > 0) latest = item.dueDate;
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


function timerConfiguredSeconds(phase = state.timer.phase) {
  return Math.max(1, Number(phase === "break" ? state.timer.breakMinutes : state.timer.focusMinutes) * 60);
}

function getTimerRemainingSeconds(now = Date.now()) {
  const timer = state.timer;
  if (timer.status === "running" && timer.targetAt) return Math.max(0, Math.ceil((timer.targetAt - now) / 1000));
  return Math.max(0, Math.round(Number(timer.remainingSeconds) || 0));
}

function getTimerElapsedSeconds(now = Date.now()) {
  return Math.max(0, Number(state.timer.phaseTotalSeconds || timerConfiguredSeconds()) - getTimerRemainingSeconds(now));
}

function formatTimerClock(seconds) {
  const total = Math.max(0, Math.ceil(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function formatStudyDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (total === 0) return "0분";
  if (total < 60) return `${total}초`;
  const minutes = Math.round(total / 60);
  return formatMinutes(minutes);
}

function formatTimeOfDay(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function getStudySessionsForDate(dateString) {
  return state.studySessions.filter(item => item.date === dateString);
}

function getStudyStatsForDate(dateString) {
  const sessions = getStudySessionsForDate(dateString);
  const totalSeconds = sessions.reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0);
  const completed = sessions.filter(item => item.completed).length;
  const bySubject = sessions.reduce((acc, item) => {
    acc[item.subject] = (acc[item.subject] || 0) + Number(item.durationSeconds || 0);
    return acc;
  }, {});
  return { sessions, totalSeconds, completed, bySubject };
}

function getPlannedStudyMinutesForDate(dateString) {
  const day = getDayForDate(dateString);
  if (!day) return 0;
  const budget = getDayBudget(day);
  return budget.math + budget.science + budget.language + budget.school;
}

function getMeasuredSecondsForSubjects(dateString, subjects) {
  const wanted = new Set(subjects);
  return getStudySessionsForDate(dateString)
    .filter(item => wanted.has(item.subject))
    .reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0);
}

function addStudySession(durationSeconds, completed) {
  const endedAt = new Date();
  const startedAt = state.timer.phaseStartedAt
    ? new Date(state.timer.phaseStartedAt)
    : new Date(endedAt.getTime() - Number(durationSeconds) * 1000);
  state.studySessions.unshift({
    id: uniqueId("session"),
    date: localDateString(endedAt),
    subject: state.timer.subject || "기타",
    task: state.timer.task.trim() || "집중 학습",
    durationSeconds: Math.max(1, Math.round(Number(durationSeconds) || 0)),
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    completed: Boolean(completed)
  });
  state.studySessions = state.studySessions.slice(0, 2000);
}

function resetTimerToPhase(phase = "focus") {
  state.timer.phase = phase === "break" ? "break" : "focus";
  state.timer.status = "idle";
  state.timer.phaseTotalSeconds = timerConfiguredSeconds(state.timer.phase);
  state.timer.remainingSeconds = state.timer.phaseTotalSeconds;
  state.timer.targetAt = null;
  state.timer.phaseStartedAt = null;
}

function prepareTimerAudio() {
  if (!state.timer.sound) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!timerAudioContext) timerAudioContext = new AudioContextClass();
  if (timerAudioContext.state === "suspended") timerAudioContext.resume().catch(() => {});
}

function playTimerAlert(finishedPhase) {
  if (!state.timer.sound) return;
  prepareTimerAudio();
  if (!timerAudioContext) return;
  const frequencies = finishedPhase === "focus" ? [660, 880, 1040] : [660, 520];
  const start = timerAudioContext.currentTime + 0.03;
  frequencies.forEach((frequency, index) => {
    const oscillator = timerAudioContext.createOscillator();
    const gain = timerAudioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, start + index * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.16, start + index * 0.22 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.22 + 0.18);
    oscillator.connect(gain).connect(timerAudioContext.destination);
    oscillator.start(start + index * 0.22);
    oscillator.stop(start + index * 0.22 + 0.2);
  });
}

async function requestTimerWakeLock() {
  if (state.timer.status !== "running" || document.visibilityState !== "visible" || !navigator.wakeLock?.request) return;
  try {
    if (timerWakeLock) return;
    timerWakeLock = await navigator.wakeLock.request("screen");
    timerWakeLock.addEventListener("release", () => {
      timerWakeLock = null;
      renderTimerClockDisplays();
    }, { once: true });
    renderTimerClockDisplays();
  } catch (error) {
    console.warn("화면 켜짐 유지 요청 실패", error);
  }
}

async function releaseTimerWakeLock() {
  if (!timerWakeLock) return;
  try { await timerWakeLock.release(); } catch (error) { console.warn(error); }
  timerWakeLock = null;
}

function startTimerLoop() {
  if (timerTickHandle) return;
  timerTickHandle = window.setInterval(timerTick, 250);
}

function stopTimerLoop() {
  if (!timerTickHandle) return;
  clearInterval(timerTickHandle);
  timerTickHandle = null;
}

function startTimer() {
  if (state.timer.status === "running") return;
  let remaining = getTimerRemainingSeconds();
  if (remaining <= 0) {
    state.timer.phaseTotalSeconds = timerConfiguredSeconds();
    state.timer.remainingSeconds = state.timer.phaseTotalSeconds;
    remaining = state.timer.remainingSeconds;
  }
  if (!state.timer.task.trim()) state.timer.task = state.timer.phase === "focus" ? "집중 학습" : "휴식";
  const now = Date.now();
  if (!state.timer.phaseStartedAt) state.timer.phaseStartedAt = new Date(now).toISOString();
  state.timer.status = "running";
  state.timer.targetAt = now + remaining * 1000;
  state.timer.remainingSeconds = remaining;
  prepareTimerAudio();
  saveState();
  startTimerLoop();
  requestTimerWakeLock();
  renderTimerClockDisplays();
}

function pauseTimer() {
  if (state.timer.status !== "running") return;
  state.timer.remainingSeconds = getTimerRemainingSeconds();
  state.timer.status = "paused";
  state.timer.targetAt = null;
  saveState();
  stopTimerLoop();
  releaseTimerWakeLock();
  renderTimerClockDisplays();
}

function toggleTimer() {
  if (state.timer.status === "running") pauseTimer();
  else startTimer();
}

function handleTimerPhaseComplete(playAlert = true) {
  const finishedPhase = state.timer.phase;
  if (finishedPhase === "focus") addStudySession(state.timer.phaseTotalSeconds, true);
  const nextPhase = finishedPhase === "focus" ? "break" : "focus";
  resetTimerToPhase(nextPhase);
  const autoStart = state.timer.autoStartNext;
  if (autoStart) {
    const now = Date.now();
    state.timer.status = "running";
    state.timer.phaseStartedAt = new Date(now).toISOString();
    state.timer.targetAt = now + state.timer.remainingSeconds * 1000;
  }
  saveState();
  if (playAlert) playTimerAlert(finishedPhase);
  if (autoStart) {
    startTimerLoop();
    requestTimerWakeLock();
  } else {
    stopTimerLoop();
    releaseTimerWakeLock();
  }
  renderDashboard();
  renderTimerView();
  const message = finishedPhase === "focus"
    ? `집중 ${state.timer.focusMinutes}분 완료! 이제 ${state.timer.breakMinutes}분 쉬세요.`
    : "휴식 완료! 다음 집중을 시작할 준비가 됐어요.";
  showToast(message);
}

function timerTick() {
  if (state.timer.status !== "running") {
    stopTimerLoop();
    renderTimerClockDisplays();
    return;
  }
  const remaining = getTimerRemainingSeconds();
  if (remaining <= 0) {
    state.timer.remainingSeconds = 0;
    state.timer.status = "paused";
    state.timer.targetAt = null;
    handleTimerPhaseComplete(true);
    return;
  }
  renderTimerClockDisplays();
}

function recordAndStopTimer() {
  const elapsed = getTimerElapsedSeconds();
  if (state.timer.phase === "focus" && elapsed > 0) addStudySession(elapsed, false);
  const recorded = state.timer.phase === "focus" && elapsed > 0;
  resetTimerToPhase("focus");
  saveState();
  stopTimerLoop();
  releaseTimerWakeLock();
  renderDashboard();
  renderTimerView();
  showToast(recorded ? `${formatStudyDuration(elapsed)} 집중 기록을 저장했습니다.` : "타이머를 종료했습니다.");
}

function skipTimerPhase() {
  const elapsed = getTimerElapsedSeconds();
  if (state.timer.phase === "focus" && elapsed > 0) {
    const record = confirm(`현재까지 ${formatStudyDuration(elapsed)}을 기록하고 휴식으로 넘어갈까요?`);
    if (record) addStudySession(elapsed, false);
    else if (!confirm("기록하지 않고 현재 집중 단계를 건너뛸까요?")) return;
  }
  const nextPhase = state.timer.phase === "focus" ? "break" : "focus";
  resetTimerToPhase(nextPhase);
  saveState();
  stopTimerLoop();
  releaseTimerWakeLock();
  renderDashboard();
  renderTimerView();
  showToast(nextPhase === "break" ? "휴식 단계로 이동했습니다." : "다음 집중 단계로 이동했습니다.");
}

function resetCurrentTimer() {
  const elapsed = getTimerElapsedSeconds();
  if ((state.timer.status !== "idle" || elapsed > 0) && !confirm("현재 단계의 측정 시간을 지우고 처음부터 다시 시작할까요?")) return;
  resetTimerToPhase(state.timer.phase);
  saveState();
  stopTimerLoop();
  releaseTimerWakeLock();
  renderTimerView();
  renderDashboard();
}

function updateTimerDuration(key, value) {
  if (state.timer.status !== "idle" || getTimerElapsedSeconds() > 0) {
    showToast("실행 중인 단계를 종료한 뒤 시간을 변경해주세요.");
    renderTimerView();
    return;
  }
  const min = key === "focusMinutes" ? 10 : 1;
  const max = key === "focusMinutes" ? 120 : 60;
  const fallback = key === "focusMinutes" ? 50 : 10;
  state.timer[key] = Math.max(min, Math.min(max, Number(value) || fallback));
  if ((key === "focusMinutes" && state.timer.phase === "focus") || (key === "breakMinutes" && state.timer.phase === "break")) {
    state.timer.phaseTotalSeconds = timerConfiguredSeconds();
    state.timer.remainingSeconds = state.timer.phaseTotalSeconds;
  }
  saveState();
  renderTimerView();
  renderDashboard();
}

function applyTimerPreset(subject, task, openView = true) {
  if (state.timer.status !== "idle" || getTimerElapsedSeconds() > 0) {
    showToast("현재 세션을 종료하거나 초기화한 뒤 다른 과제를 선택해주세요.");
    if (openView) switchView("timer");
    return;
  }
  state.timer.subject = subject || "기타";
  state.timer.task = String(task || "집중 학습").slice(0, 80);
  saveState();
  renderTimerView();
  renderDashboard();
  if (openView) switchView("timer");
}

function getTimerPresetItems() {
  const todayDay = getDayForDate(localDateString());
  const day = todayDay || nextIncompleteDay().day;
  const item = getPlan(day);
  const presets = [
    { subject: "수학", task: item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)}` : "수학 누적 실전" },
    { subject: "수학", task: "개념원리 공통수학2" },
    { subject: "수학", task: "마플 시너지 공통수학2" },
    { subject: "과학", task: `김청해 ${lectureRangeLabel(item.science.lectureRange)}` },
    { subject: "과학", task: "오투 통합과학2" },
    { subject: "과학", task: "완자 기출픽 통합과학2" },
    { subject: "영어", task: "영어 독해 지문 1개" },
    { subject: "국어", task: "매3비 비문학 지문 1개" },
    { subject: "복습", task: "오답·간격 복습" }
  ];
  if (isSchoolDate(getDateStringForDay(day))) presets.push({ subject: "학교 수업", task: "오늘 학교 수업 복습" });
  return presets;
}

function renderTimerPresets() {
  const container = $("#timer-presets");
  if (!container) return;
  container.innerHTML = getTimerPresetItems().map(item => `<button class="timer-preset-button" type="button" data-timer-subject="${escapeHtml(item.subject)}" data-timer-task="${escapeHtml(item.task)}">${escapeHtml(item.task)}</button>`).join("");
}

function renderTimerStats() {
  const today = localDateString();
  const stats = getStudyStatsForDate(today);
  const totalMinutes = Math.round(stats.totalSeconds / 60);
  const plannedMinutes = getPlannedStudyMinutesForDate(today);
  const percent = plannedMinutes ? Math.min(100, Math.round((totalMinutes / plannedMinutes) * 100)) : 0;
  const totalEl = $("#timer-today-total");
  if (!totalEl) return;
  totalEl.textContent = formatMinutes(totalMinutes);
  $("#timer-today-sessions").textContent = `${stats.sessions.length}회`;
  $("#timer-today-completed").textContent = `${stats.completed}회`;
  $("#timer-plan-progress-text").textContent = plannedMinutes ? `${formatMinutes(totalMinutes)} / ${formatMinutes(plannedMinutes)}` : `${formatMinutes(totalMinutes)} / 계획 없음`;
  $("#timer-plan-progress-fill").style.width = `${percent}%`;
  const subjectEntries = Object.entries(stats.bySubject).sort((a, b) => b[1] - a[1]);
  const maxSeconds = Math.max(1, ...subjectEntries.map(([, seconds]) => seconds));
  $("#timer-subject-summary").innerHTML = subjectEntries.length
    ? subjectEntries.map(([subject, seconds]) => `<div class="timer-subject-row"><span>${escapeHtml(subject)}</span><div class="timer-subject-track"><i style="width:${Math.max(4, Math.round((seconds / maxSeconds) * 100))}%"></i></div><strong>${formatStudyDuration(seconds)}</strong></div>`).join("")
    : `<div class="mini-empty"><strong>아직 측정 기록이 없습니다.</strong><span>첫 집중 세션을 시작해보세요.</span></div>`;
}

function renderTimerWeekChart() {
  const container = $("#timer-week-chart");
  if (!container) return;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const dateString = localDateString(date);
    const minutes = Math.round(getStudyStatsForDate(dateString).totalSeconds / 60);
    return { date, dateString, minutes };
  });
  const maxMinutes = Math.max(60, ...days.map(item => item.minutes));
  container.innerHTML = days.map(item => {
    const height = item.minutes ? Math.max(4, Math.round((item.minutes / maxMinutes) * 100)) : 0;
    const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(item.date);
    return `<div class="timer-week-day"><div class="timer-week-bar-wrap"><i class="timer-week-bar" style="height:${height}%" title="${item.minutes}분"></i></div><strong>${weekday}</strong><span>${item.minutes ? `${item.minutes}분` : "-"}</span></div>`;
  }).join("");
}

function renderTimerSessionList() {
  const container = $("#timer-session-list");
  if (!container) return;
  const sessions = [...getStudySessionsForDate(localDateString())].sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt));
  if (!sessions.length) {
    container.innerHTML = `<div class="empty-state compact-empty">오늘 기록된 집중 세션이 없습니다.</div>`;
    return;
  }
  container.innerHTML = sessions.map(item => `<article class="timer-session-item"><span class="subject-chip" data-subject="${escapeHtml(item.subject)}">${escapeHtml(item.subject)}</span><div><strong>${escapeHtml(item.task)}</strong><small>${formatTimeOfDay(item.startedAt)}~${formatTimeOfDay(item.endedAt)}</small></div><span class="timer-session-duration">${formatStudyDuration(item.durationSeconds)}</span><span class="timer-session-status ${item.completed ? "complete" : ""}">${item.completed ? "완주" : "부분"}</span><button class="timer-session-delete" type="button" data-delete-timer-session="${escapeHtml(item.id)}" aria-label="이 기록 삭제">×</button></article>`).join("");
}

function renderTimerClockDisplays() {
  const timer = state.timer;
  if (!timer) return;
  const remaining = getTimerRemainingSeconds();
  const total = Math.max(1, Number(timer.phaseTotalSeconds) || timerConfiguredSeconds());
  const elapsed = Math.max(0, total - remaining);
  const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const isFocus = timer.phase === "focus";
  const isRunning = timer.status === "running";
  const isPaused = timer.status === "paused";
  const clock = formatTimerClock(remaining);
  const phaseText = isFocus ? "집중" : "휴식";
  const fullPhaseText = isFocus ? `${timer.focusMinutes}분 집중` : `${timer.breakMinutes}분 휴식`;
  const nextText = isFocus ? `완료 후 ${timer.breakMinutes}분 휴식` : `완료 후 ${timer.focusMinutes}분 집중`;
  const statusText = isRunning
    ? (isFocus ? `${timer.subject} 집중 중` : "잠시 쉬는 중")
    : isPaused
      ? "일시정지됨"
      : (isFocus ? "과제를 정하고 시작하세요" : "쉬고 나서 다음 집중을 준비하세요");

  const modeLabel = $("#timer-mode-label");
  if (modeLabel) {
    modeLabel.textContent = isFocus ? "집중 시간" : "휴식 시간";
    modeLabel.className = `timer-mode-chip ${isFocus ? "focus" : "break"}`;
  }
  if ($("#timer-phase-title")) $("#timer-phase-title").textContent = fullPhaseText;
  if ($("#timer-next-label")) $("#timer-next-label").textContent = nextText;
  if ($("#timer-status-message")) $("#timer-status-message").textContent = statusText;
  if ($("#timer-time")) $("#timer-time").textContent = clock;
  if ($("#timer-progress-text")) $("#timer-progress-text").textContent = `${formatStudyDuration(elapsed)} / ${formatStudyDuration(total)}`;
  const dial = $("#timer-dial");
  if (dial) {
    dial.style.setProperty("--timer-progress", `${progress}%`);
    dial.classList.toggle("is-break", !isFocus);
  }
  const primary = $("#timer-primary-control");
  if (primary) primary.textContent = isRunning ? "일시정지" : isPaused ? "계속" : isFocus ? "집중 시작" : "휴식 시작";
  const stopButton = $("#timer-stop-record-button");
  if (stopButton) stopButton.disabled = !isFocus || elapsed <= 0;
  const locked = timer.status !== "idle" || elapsed > 0;
  const subjectInput = $("#timer-subject");
  const taskInput = $("#timer-task");
  if (subjectInput) subjectInput.disabled = locked;
  if (taskInput) taskInput.disabled = locked;
  [$("#timer-focus-minutes"), $("#timer-break-minutes")].forEach(input => { if (input) input.disabled = locked; });

  const wakeStatus = $("#timer-wake-status");
  if (wakeStatus) {
    const wakeSupported = Boolean(navigator.wakeLock?.request);
    wakeStatus.textContent = timerWakeLock ? "화면 켜짐 유지 중" : isRunning && !wakeSupported ? "화면 유지는 기기 설정에 따름" : isRunning ? "화면 유지 요청 중" : "화면 유지 준비";
    wakeStatus.classList.toggle("is-active", Boolean(timerWakeLock));
  }

  if ($("#dashboard-timer-phase")) $("#dashboard-timer-phase").textContent = isRunning ? `${phaseText} 중` : isPaused ? `${phaseText} 일시정지` : `${phaseText} 준비`;
  if ($("#dashboard-timer-time")) $("#dashboard-timer-time").textContent = clock;
  if ($("#dashboard-timer-control")) $("#dashboard-timer-control").textContent = isRunning ? "일시정지" : isPaused ? "계속" : "시작";
  const todayStats = getStudyStatsForDate(localDateString());
  if ($("#dashboard-timer-today")) $("#dashboard-timer-today").textContent = `오늘 측정 ${formatStudyDuration(todayStats.totalSeconds)}`;

  const floating = $("#floating-timer");
  if (floating) {
    floating.hidden = timer.status === "idle";
    floating.classList.toggle("is-break", !isFocus);
  }
  if ($("#floating-timer-phase")) $("#floating-timer-phase").textContent = isPaused ? `${phaseText} · 일시정지` : phaseText;
  if ($("#floating-timer-time")) $("#floating-timer-time").textContent = clock;
  if ($("#floating-timer-task")) $("#floating-timer-task").textContent = isFocus ? (timer.task || "집중 학습") : "10분 휴식";
  const floatingToggle = $("#floating-timer-toggle");
  if (floatingToggle) {
    floatingToggle.textContent = isRunning ? "Ⅱ" : "▶";
    floatingToggle.setAttribute("aria-label", isRunning ? "타이머 일시정지" : "타이머 계속");
  }
  document.title = timer.status === "idle" ? BASE_DOCUMENT_TITLE : `${clock} · ${phaseText} | ${BASE_DOCUMENT_TITLE}`;
}

function renderTimerView() {
  const focusInput = $("#timer-focus-minutes");
  if (!focusInput) return;
  focusInput.value = state.timer.focusMinutes;
  $("#timer-break-minutes").value = state.timer.breakMinutes;
  $("#timer-auto-start").checked = state.timer.autoStartNext;
  $("#timer-sound").checked = state.timer.sound;
  $("#timer-subject").value = state.timer.subject;
  $("#timer-task").value = state.timer.task;
  renderTimerPresets();
  renderTimerStats();
  renderTimerWeekChart();
  renderTimerSessionList();
  renderTimerClockDisplays();
}

function initializeTimerRuntime() {
  state.timer = normalizeTimerState(state.timer);
  state.studySessions = normalizeStudySessions(state.studySessions);
  if (state.timer.status === "running") {
    if (getTimerRemainingSeconds() <= 0) handleTimerPhaseComplete(false);
    else {
      startTimerLoop();
      requestTimerWakeLock();
    }
  }
  renderTimerView();
}

function switchView(view, options = {}) {
  const validViews = ["dashboard", "timer", "plan", "calendar", "review", "outputs", "resources"];
  const nextView = validViews.includes(view) ? view : "dashboard";
  activeView = nextView;
  $$(".app-view").forEach(section => section.classList.toggle("is-active", section.id === `view-${nextView}`));
  $$(".nav-button").forEach(button => button.classList.toggle("is-active", button.dataset.view === nextView));
  if (nextView === "calendar") renderCalendar();
  if (nextView === "review") renderReviewView();
  if (nextView === "outputs") renderOutputs();
  if (nextView === "plan") renderPlan();
  if (nextView === "timer") renderTimerView();

  if (!options.skipHash) {
    const nextHash = nextView === "dashboard" ? "" : `#${nextView}`;
    try {
      if (window.history?.replaceState && window.location.protocol !== "file:") {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
      } else {
        window.location.hash = nextHash;
      }
    } catch (error) {
      console.warn("화면 주소 표시를 갱신하지 못했습니다.", error);
    }
  }
  if (!options.skipScroll) window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
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
  renderTimerView();
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
  renderTodayCarryoverMini();
  renderTodayTimeBudget();
  renderBookProgress();
  renderRoadmap();
  renderTimerClockDisplays();
}

function renderNext() {
  const item = nextIncompleteDay();
  const progress = getDayProgress(item.day);
  const dateString = getDateStringForDay(item.day);
  const plannedReviews = getPlannedReviewEventsOnDate(dateString);
  const carryovers = getCarryoversOnDate(dateString);
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
  $("#next-review-summary").textContent = `이날 예정 복습 ${plannedReviews.length}개 · 이월 할 일 ${carryovers.length}개 · 현재 완료 ${progress.count}/${progress.total}${progress.missed ? ` · ✕ ${progress.missed}개` : ""}`;
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

function renderTodayCarryoverMini() {
  const today = localDateString();
  const items = getDueCarryovers(today, true);
  const container = $("#today-carryover-mini");
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<div class="mini-empty"><strong>오늘로 넘어온 미완료 항목이 없습니다.</strong><span>✕로 표시한 항목은 다음 날 여기에 나타납니다.</span></div>`;
    return;
  }
  container.innerHTML = items.slice(0, 4).map(item => `<button class="mini-carryover-item" type="button" data-open-date="${today}"><span class="subject-chip" data-subject="${escapeHtml(item.subject)}">${escapeHtml(item.subject)}</span><div><strong>${escapeHtml(item.title)}</strong><small>Day ${item.originalDay}에서 이월 · ${item.dueDate === today ? "오늘 예정" : `${formatDate(item.dueDate, false)}부터 밀림`}</small></div></button>`).join("") + (items.length > 4 ? `<p class="more-label">외 ${items.length - 4}개</p>` : "");
}

function renderTodayTimeBudget() {
  const today = localDateString();
  let day = getDayForDate(today);
  if (!day) day = nextIncompleteDay().day;
  const budget = getDayBudget(day);
  const plan = getPlan(day);
  const rows = [
    { label: "수학", minutes: budget.math, estimate: plan.math.totalMinutes, subjects: ["수학"] },
    { label: "과학", minutes: budget.science, estimate: plan.science.totalMinutes, subjects: ["과학"] },
    ...LANGUAGE_TASKS.map(task => ({ label: task.shortTitle || task.title, minutes: getLanguageMinutes(task), estimate: getLanguageMinutes(task), subjects: [task.subject] }))
  ];
  if (budget.school) rows.push({ label: "학교 수업 복습", minutes: budget.school, estimate: 60, subjects: ["학교 수업"] });
  $("#today-time-budget").innerHTML = rows.map(row => {
    const fit = row.estimate <= row.minutes;
    const measured = getMeasuredSecondsForSubjects(today, row.subjects);
    return `<div class="time-budget-row"><div><strong>${row.label}</strong><small>계획 ${formatMinutes(row.estimate)} · 측정 ${formatStudyDuration(measured)}</small></div><span class="${fit ? "fit" : "over"}">${formatMinutes(row.minutes)} ${fit ? "✓" : "초과"}</span></div>`;
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
    if (progress.missed) classes.push("has-missed");
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
    const carryovers = getCarryoversOnDate(dateString);
    const school = isSchoolDate(dateString);
    return `<article class="plan-card plan-card-expanded ${progress.complete ? "is-done" : ""}">
      <div class="plan-card-head">
        <div><span class="phase-chip">${phaseForDay(item.day)}</span><h3>Day ${item.day}</h3><p>${formatDate(dateString)}</p></div>
        <div class="plan-progress-summary"><strong>${progress.percent}%</strong><span>${progress.count}/${progress.total} 완료${progress.missed ? ` · ✕ ${progress.missed}` : ""}${progress.late ? ` · 이월완료 ${progress.late}` : ""}</span></div>
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
          ${carryovers.length ? `<span>↪ 이월 ${carryovers.length}개</span>` : ""}
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
    const carryovers = getCarryoversOnDate(dateString);
    const exams = getMockExamsOnDate(dateString);
    return `<button class="agenda-row" type="button" data-open-date="${dateString}">
      <div class="agenda-date"><strong>Day ${item.day}</strong><span>${formatDate(dateString)}</span>${exams.length ? `<em>${escapeHtml(exams[0].title)}</em>` : ""}</div>
      <div class="agenda-subject"><b>수학</b><span>${item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)} · ${escapeHtml(lectureTitleSummary(item.math.lectureTitles))}` : "누적 실전"}</span></div>
      <div class="agenda-subject"><b>과학</b><span>김청해 ${lectureRangeLabel(item.science.lectureRange)} · ${escapeHtml(lectureTitleSummary(item.science.lectureTitles))}</span></div>
      <div class="agenda-subject"><b>국어·영어</b><span>${escapeHtml(getLanguageSummary())}</span></div>
      <div class="agenda-review"><b>${reviews.length}</b><span>복습${carryovers.length ? ` · 이월 ${carryovers.length}` : ""}</span></div>
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
    const carryovers = getCarryoversOnDate(dateString);
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
    if (carryovers.length) events.push(`<span class="cal-event carryover">이월 ${carryovers.length}</span>`);
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
  $("#manual-review-date").value ||= localDateString();
  renderReviewStats();
  renderReviewQueue();
  renderMistakes();
  renderBlankReviews();
  renderManualReviews();
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

function reviewHistoryHtml(track) {
  const cycle = getReviewCycle(track);
  const histories = cycle.history.slice(-3).reverse();
  if (!histories.length) return "";
  return `<details class="record-history"><summary>이전 복습 기록 ${cycle.history.length}개</summary><div>${histories.map(history => `<p><b>${formatDate(history.handledDate, false)} · ${history.result === "success" ? "성공" : "다시"}</b><span>${escapeHtml(history.range || "범위 기록 없음")}${history.note ? ` · ${escapeHtml(history.note)}` : ""}</span></p>`).join("")}</div></details>`;
}

function renderReviewEditor(track, stage, dueDate, handledDate) {
  const draft = getReviewDraft(track.id, stage, dueDate);
  return `<div class="review-record-editor" data-review-draft-key="${escapeHtml(draft.key)}">
    <label>이번에 실제로 복습한 범위·문제 번호<input type="text" data-review-draft-field="range" value="${escapeHtml(draft.range)}" placeholder="예: 개념원리 p.56~67 · 마플 121~138번"></label>
    <label>막힌 부분·다음에 확인할 내용<textarea rows="2" data-review-draft-field="note" placeholder="다시 틀린 판단 기준, 설명하지 못한 부분">${escapeHtml(draft.note)}</textarea></label>
    <div class="review-actions"><button class="success-button" type="button" data-review-success="${escapeHtml(track.id)}" data-handled-date="${handledDate}">기록하고 성공 ✓</button><button class="retry-button" type="button" data-review-fail="${escapeHtml(track.id)}" data-handled-date="${handledDate}">기록하고 다시 ↻</button></div>
  </div>`;
}

function renderReviewItems(items, options = {}) {
  const { handledDate = localDateString(), showEmpty = false, allowActions = true } = options;
  if (!items.length) return showEmpty ? `<div class="empty-state compact-empty">이 날짜까지 해야 할 미완료 복습이 없습니다.</div>` : "";
  return items.map(item => {
    const typeLabel = item.track.type === "study" ? "학습 복습" : item.track.type === "mistake" ? "오답" : item.track.type === "blank" ? "백지" : "직접 등록";
    const actionHtml = allowActions ? renderReviewEditor(item.track, item.stage, item.dueDate, handledDate) : `<span class="planned-badge">${formatDate(item.dueDate, false)} 예정</span>`;
    return `<article class="review-item review-item-record ${item.overdue ? "is-overdue" : ""}">
      <div class="review-item-main"><div class="review-item-chips"><span class="subject-chip" data-subject="${escapeHtml(item.track.subject)}">${escapeHtml(item.track.subject)}</span><span class="type-chip">${typeLabel}</span>${item.overdue ? `<span class="overdue-chip">${Math.abs(Math.round((parseDate(item.dueDate) - parseDate(handledDate)) / 86400000))}일 밀림</span>` : ""}</div><h4>${escapeHtml(item.track.label)}</h4><p>${escapeHtml(item.track.source)} · ${escapeHtml(item.track.detail)}</p><small>${reviewStageLabel(item.stage)} · 예정 ${formatDate(item.dueDate)}</small>${reviewHistoryHtml(item.track)}</div>
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

function renderManualReviews() {
  const container = $("#manual-review-list");
  if (!container) return;
  if (!state.manualReviews.length) {
    container.innerHTML = `<div class="empty-state compact-empty">그날 실제로 공부한 범위를 직접 등록하면 복습 일정이 자동 생성됩니다.</div>`;
    return;
  }
  container.innerHTML = state.manualReviews.map(item => {
    const track = getTrackById(item.id);
    const cycle = getReviewCycle(track);
    const next = getNextReviewDate(track);
    return `<article class="tracker-item"><div><span class="subject-chip" data-subject="${escapeHtml(item.subject)}">${escapeHtml(item.subject)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.range)}${item.question ? ` · 질문: ${escapeHtml(item.question)}` : ""}</p><small>${cycle.done ? "복습 5주기 완료" : `다음 복습 ${formatDate(next)} · ${reviewStageLabel(cycle.stage)}`}</small></div><button class="text-button danger" type="button" data-delete-manual-review="${escapeHtml(item.id)}">삭제</button></article>`;
  }).join("");
}

function hasOnePageContent(day) {
  const d = getDayState(day);
  return Boolean(d.resultTitle || d.rating || d.concepts.some(Boolean) || d.representative || d.mistake || d.visual || d.stuck || d.question || d.attachment);
}

function renderOutputs() {
  const count = STUDY_PLAN.filter(item => getTaskDone(item.day, "output")).length;
  $("#output-count-large").textContent = count;
  $("#output-list").innerHTML = STUDY_PLAN.map(item => {
    const d = getDayState(item.day);
    const complete = getTaskDone(item.day, "output");
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

function taskStatusLabel(status) {
  if (status === "done") return "오늘 완료";
  if (status === "doneLate") return "이월 완료";
  if (status === "missed") return "못함 · 다음 날 이월";
  return "아직 표시 전";
}

function taskStatusControls(day, key) {
  const status = getTaskStatus(day, key);
  return `<div class="task-status-buttons" role="group" aria-label="완료 여부">
    <button type="button" class="task-status-button done ${status === "done" || status === "doneLate" ? "is-active" : ""}" data-set-task-status="${key}" data-status="done" aria-pressed="${status === "done" || status === "doneLate"}">✓ 완료</button>
    <button type="button" class="task-status-button missed ${status === "missed" ? "is-active" : ""}" data-set-task-status="${key}" data-status="missed" aria-pressed="${status === "missed"}">✕ 못함</button>
  </div>`;
}

function taskCheckRow(day, key, title, detail, minutes, logKey = null, logPlaceholder = "") {
  const d = getDayState(day);
  const status = getTaskStatus(day, key);
  const carry = getCarryoverForTask(day, key);
  return `<div class="task-check-row is-${status}">
    <div class="task-row-head"><div class="task-row-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)} · ${formatMinutes(minutes)}</small></div>${taskStatusControls(day, key)}</div>
    <div class="task-status-note ${status}">${taskStatusLabel(status)}${status === "missed" && carry ? ` · ${formatDate(carry.dueDate, false)} 할 일에 추가` : ""}${status === "doneLate" && carry ? ` · ${formatDate(carry.completedDate, false)} 보충` : ""}</div>
    ${logKey ? `<input class="actual-log-input" type="text" data-log-key="${logKey}" value="${escapeHtml(d.logs[logKey] || "")}" placeholder="${escapeHtml(logPlaceholder)}">` : ""}
  </div>`;
}

function renderCarryoverItems(items, handledDate, allowActions = true) {
  if (!items.length) return `<div class="empty-state compact-empty">이월된 할 일이 없습니다.</div>`;
  return items.map(item => {
    const overdueDays = Math.max(0, Math.round((parseDate(handledDate) - parseDate(item.dueDate)) / 86400000));
    return `<article class="carryover-item ${overdueDays ? "is-overdue" : ""}">
      <div class="carryover-item-main"><div class="review-item-chips"><span class="subject-chip" data-subject="${escapeHtml(item.subject)}">${escapeHtml(item.subject)}</span><span class="type-chip">Day ${item.originalDay} 이월</span>${overdueDays ? `<span class="overdue-chip">${overdueDays}일 밀림</span>` : ""}</div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.detail)} · ${formatMinutes(item.minutes)}</p><small>원래 일정 ${formatDate(item.originalDate)} → 현재 예정 ${formatDate(item.dueDate)}</small></div>
      <label class="carryover-note-label">오늘 실제로 마친 범위·메모<input type="text" data-carryover-note="${escapeHtml(item.id)}" value="${escapeHtml(item.note || "")}" placeholder="예: p.32~39, 101~118번까지 완료"></label>
      ${allowActions ? `<div class="carryover-actions"><button class="success-button" type="button" data-carryover-result="done" data-carryover-id="${escapeHtml(item.id)}" data-handled-date="${handledDate}">✓ 오늘 완료</button><button class="retry-button" type="button" data-carryover-result="missed" data-carryover-id="${escapeHtml(item.id)}" data-handled-date="${handledDate}">✕ 다시 이월</button></div>` : ""}
    </article>`;
  }).join("");
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

  const carryovers = getDueCarryovers(dateString, true);
  const carryoverSection = $("#day-carryover-section");
  carryoverSection.hidden = !carryovers.length;
  $("#day-carryover-list").innerHTML = renderCarryoverItems(carryovers, dateString, compareDateStrings(dateString, localDateString()) <= 0);

  $("#day-task-sections").innerHTML = `
    <section class="day-subject-section math-section">
      <div class="day-subject-heading"><div><span class="subject-chip" data-subject="수학">수학</span><h3>${escapeHtml(item.math.focus)}</h3><p>${escapeHtml(item.math.unit)}</p></div><div class="timer-inline-actions"><button class="timer-inline-button" type="button" data-timer-subject="수학" data-timer-task="${escapeHtml(item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)}` : "수학 누적 실전")}">50·10 타이머</button><a class="secondary-button" href="${MATH_COURSE_URL}" target="_blank" rel="noopener noreferrer">정승제 강좌 ↗</a></div></div>
      <div class="task-check-list">
        ${taskCheckRow(day, "mathLecture", item.math.lectureRange.length ? `정승제 ${lectureRangeLabel(item.math.lectureRange)}` : "수학 누적 실전", item.math.lectureRange.length ? item.math.lectureTitles.join(" · ") : "도형·집합과 명제·함수 누적 실전", item.math.lectureMinutes)}
        ${taskCheckRow(day, "conceptMath", "개념원리 공통수학2", item.math.conceptTask, item.math.conceptMinutes, "conceptMath", "실제 푼 페이지·예제 번호")}
        ${taskCheckRow(day, "maplMath", "마플 시너지 공통수학2", item.math.practiceTask, item.math.practiceMinutes, "maplMath", "실제 푼 페이지·문제 번호")}
      </div>
    </section>
    <section class="day-subject-section science-section">
      <div class="day-subject-heading"><div><span class="subject-chip" data-subject="과학">과학</span><h3>${escapeHtml(item.science.focus)}</h3><p>${escapeHtml(item.science.unit)}</p></div><div class="timer-inline-actions"><button class="timer-inline-button" type="button" data-timer-subject="과학" data-timer-task="${escapeHtml(`김청해 ${lectureRangeLabel(item.science.lectureRange)}`)}">50·10 타이머</button><a class="secondary-button" href="${SCIENCE_COURSE_URL}" target="_blank" rel="noopener noreferrer">김청해 강좌 ↗</a></div></div>
      <div class="task-check-list">
        ${taskCheckRow(day, "scienceLecture", `김청해 ${lectureRangeLabel(item.science.lectureRange)}`, item.science.lectureTitles.join(" · "), item.science.lectureMinutes)}
        ${taskCheckRow(day, "o2Science", "오투 통합과학2", item.science.o2Task, item.science.o2Minutes, "o2Science", "실제 푼 페이지·문제 번호")}
        ${taskCheckRow(day, "wanjaScience", "완자 기출픽 통합과학2", item.science.wanjaTask, item.science.wanjaMinutes, "wanjaScience", "실제 푼 페이지·문제 번호")}
      </div>
    </section>
    <section class="day-subject-section language-section">
      <div class="day-subject-heading"><div><span class="subject-chip" data-subject="국어">국어·영어</span><h3>매일 지문 루틴</h3><p>영어 1지문과 매3비 비문학 1지문은 속도를 잃지 않기 위한 최소 루틴입니다.</p></div><div class="timer-inline-actions"><button class="timer-inline-button" type="button" data-timer-subject="영어" data-timer-task="영어 독해 지문 1개">영어 타이머</button><button class="timer-inline-button" type="button" data-timer-subject="국어" data-timer-task="매3비 비문학 지문 1개">매3비 타이머</button></div></div>
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
    $("#school-review-status-controls").innerHTML = taskStatusControls(day, "schoolReview");
    $("#school-review-topic").value = d.school.topic || "";
    $("#school-review-note").value = d.school.note || "";
  }
  $("#output-status-controls").innerHTML = taskStatusControls(day, "output");
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
    const action = canHandle ? renderReviewEditor(event.track, event.stage, currentDue, today) : `<span class="planned-badge">${event.status === "done" ? "완료" : formatDate(dateString, false)}</span>`;
    return `<article class="review-item review-item-record planned-review-item ${event.status === "done" ? "is-done" : ""}"><div class="review-item-main"><div class="review-item-chips"><span class="subject-chip" data-subject="${event.track.subject}">${escapeHtml(event.track.subject)}</span><span class="type-chip">${reviewStageLabel(event.stage)}</span></div><h4>${escapeHtml(event.track.label)}</h4><p>${escapeHtml(event.track.source)} · ${escapeHtml(event.track.detail)}</p>${reviewHistoryHtml(event.track)}</div>${action}</article>`;
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
  const carryovers = getDueCarryovers(dateString, true);
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
  if (carryovers.length) html += `<section class="date-carryover-card"><div class="modal-section-heading"><div><span class="panel-kicker">CARRY OVER</span><h3>이날까지 밀린 할 일 (${carryovers.length}개)</h3></div></div><div class="carryover-list">${renderCarryoverItems(carryovers, dateString, compareDateStrings(dateString, localDateString()) <= 0)}</div></section>`;
  html += `<section class="date-review-card"><div class="modal-section-heading"><div><span class="panel-kicker">REVIEW</span><h3>이날의 복습 일정 ${planned.length ? `(${planned.length}개)` : ""}</h3></div></div>${planned.length ? renderPlannedReviewEvents(planned, dateString) : `<div class="empty-state compact-empty">예정된 복습이 없습니다.</div>`}</section>`;
  if (!day && !planned.length && !due.length && !carryovers.length) html = `<div class="empty-state">이 날짜에는 등록된 학습이나 복습 일정이 없습니다.</div>`;
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
    note: "학습 ✓/✕ 상태·복습 범위·이월 기록은 포함되며, 첨부 이미지/PDF 파일만 JSON 백업에 포함되지 않습니다.",
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
        reviewDrafts: normalizeReviewDrafts(imported.reviewDrafts),
        mistakes: Array.isArray(imported.mistakes) ? imported.mistakes : [],
        blankReviews: Array.isArray(imported.blankReviews) ? imported.blankReviews : [],
        manualReviews: normalizeManualReviews(imported.manualReviews),
        carryovers: normalizeCarryovers(imported.carryovers),
        timer: normalizeTimerState(imported.timer),
        studySessions: normalizeStudySessions(imported.studySessions)
      };
    }
    saveState();
    initializeTimerRuntime();
    renderAll();
    showToast("백업을 불러왔습니다.");
  } catch (error) {
    alert(`백업을 불러오지 못했습니다.\n${error.message}`);
  }
}

async function resetProgress() {
  if (!confirm("모든 ✓/✕ 상태, 이월 과제, 복습 범위 기록, 결과물, 오답·백지 기록, 공부시간 기록과 첨부 파일을 초기화할까요?")) return;
  stopTimerLoop();
  releaseTimerWakeLock();
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
  ["#open-timer-hero", "#open-timer-dashboard", "#floating-timer-open"].forEach(selector => $(selector)?.addEventListener("click", () => switchView("timer")));
  ["#timer-primary-control", "#dashboard-timer-control", "#floating-timer-toggle"].forEach(selector => $(selector)?.addEventListener("click", toggleTimer));
  $("#timer-stop-record-button")?.addEventListener("click", recordAndStopTimer);
  $("#timer-skip-button")?.addEventListener("click", skipTimerPhase);
  $("#timer-reset-button")?.addEventListener("click", resetCurrentTimer);
  $("#timer-focus-minutes")?.addEventListener("change", event => updateTimerDuration("focusMinutes", event.target.value));
  $("#timer-break-minutes")?.addEventListener("change", event => updateTimerDuration("breakMinutes", event.target.value));
  $("#timer-auto-start")?.addEventListener("change", event => {
    state.timer.autoStartNext = event.target.checked;
    saveState();
    renderTimerClockDisplays();
  });
  $("#timer-sound")?.addEventListener("change", event => {
    state.timer.sound = event.target.checked;
    if (state.timer.sound) prepareTimerAudio();
    saveState();
  });
  $("#timer-subject")?.addEventListener("change", event => {
    state.timer.subject = event.target.value;
    saveState();
    renderTimerClockDisplays();
  });
  $("#timer-task")?.addEventListener("input", event => {
    state.timer.task = event.target.value.slice(0, 80);
    saveState();
    renderTimerClockDisplays();
  });
  $("#timer-clear-history")?.addEventListener("click", () => {
    if (!state.studySessions.length) return showToast("삭제할 공부시간 기록이 없습니다.");
    if (!confirm("모든 공부시간 측정 기록을 삭제할까요? 학습 체크와 복습 기록은 유지됩니다.")) return;
    state.studySessions = [];
    saveState();
    renderDashboard();
    renderTimerView();
    showToast("공부시간 기록을 삭제했습니다.");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      timerTick();
      requestTimerWakeLock();
    }
  });
  window.addEventListener("focus", timerTick);
  window.addEventListener("pageshow", timerTick);
  $("#theme-toggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
  });
  $("#start-date").addEventListener("change", event => {
    if (!event.target.value) return;
    state.startDate = event.target.value;
    state.carryovers.filter(item => item.status === "pending").forEach(item => {
      item.originalDate = getDateStringForDay(item.originalDay);
      item.dueDate = localDateString(addDays(item.originalDate, 1));
      item.updatedAt = new Date().toISOString();
    });
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

  $("#manual-review-form").addEventListener("submit", event => {
    event.preventDefault();
    const item = {
      id: uniqueId("manual"),
      subject: $("#manual-review-subject").value,
      title: $("#manual-review-title").value.trim(),
      range: $("#manual-review-range").value.trim(),
      question: $("#manual-review-question").value.trim(),
      baseDate: $("#manual-review-date").value || localDateString(),
      createdAt: new Date().toISOString()
    };
    if (!item.title || !item.range) return;
    state.manualReviews.unshift(item);
    saveState();
    event.currentTarget.reset();
    $("#manual-review-date").value = localDateString();
    renderAll();
    showToast("실제 공부 범위를 등록하고 복습 날짜를 만들었습니다.");
  });

  document.addEventListener("input", event => {
    const reviewField = event.target.closest("[data-review-draft-field]");
    if (reviewField) {
      const editor = reviewField.closest("[data-review-draft-key]");
      if (!editor) return;
      const key = editor.dataset.reviewDraftKey;
      state.reviewDrafts[key] = { ...(state.reviewDrafts[key] || {}), [reviewField.dataset.reviewDraftField]: reviewField.value, updatedAt: new Date().toISOString() };
      saveState();
      return;
    }
    const carryoverNote = event.target.closest("[data-carryover-note]");
    if (carryoverNote) {
      const item = state.carryovers.find(entry => entry.id === carryoverNote.dataset.carryoverNote);
      if (item) {
        item.note = carryoverNote.value;
        item.updatedAt = new Date().toISOString();
        saveState();
      }
    }
  });

  document.addEventListener("click", event => {
    const statusButton = event.target.closest("[data-set-task-status]");
    if (statusButton && activeDay) {
      const key = statusButton.dataset.setTaskStatus;
      const requested = statusButton.dataset.status;
      const current = getTaskStatus(activeDay, key);
      const normalizedCurrent = current === "doneLate" ? "done" : current;
      const next = normalizedCurrent === requested ? "pending" : requested;
      setTaskStatus(activeDay, key, next);
      saveState();
      renderAll();
      openDay(activeDay);
      showToast(next === "missed" ? "✕로 표시했습니다. 이 항목은 다음 날 할 일로 자동 이월됩니다." : next === "done" ? "✓ 완료로 표시했습니다." : "표시를 초기화했습니다.");
      return;
    }
    const carryoverButton = event.target.closest("[data-carryover-result]");
    if (carryoverButton) {
      handleCarryover(carryoverButton.dataset.carryoverId, carryoverButton.dataset.carryoverResult, carryoverButton.dataset.handledDate || localDateString());
      return;
    }
    const timerPreset = event.target.closest("[data-timer-subject][data-timer-task]");
    if (timerPreset) {
      const subject = timerPreset.dataset.timerSubject;
      const task = timerPreset.dataset.timerTask;
      if (!$("#date-modal-backdrop").hidden) closeDateModal();
      if (!$("#day-modal-backdrop").hidden) closeDayModal();
      applyTimerPreset(subject, task, true);
      return;
    }
    const deleteTimerSession = event.target.closest("[data-delete-timer-session]");
    if (deleteTimerSession) {
      state.studySessions = state.studySessions.filter(item => item.id !== deleteTimerSession.dataset.deleteTimerSession);
      saveState();
      renderDashboard();
      renderTimerView();
      showToast("측정 기록을 삭제했습니다.");
      return;
    }
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
    const fail = event.target.closest("[data-review-fail]");
    if (success || fail) {
      const button = success || fail;
      const editor = button.closest(".review-item")?.querySelector("[data-review-draft-key]");
      handleReview(
        success ? success.dataset.reviewSuccess : fail.dataset.reviewFail,
        success ? "success" : "fail",
        button.dataset.handledDate || localDateString(),
        {
          range: editor?.querySelector('[data-review-draft-field="range"]')?.value || "",
          note: editor?.querySelector('[data-review-draft-field="note"]')?.value || ""
        }
      );
      return;
    }
    const deleteMistake = event.target.closest("[data-delete-mistake]");
    if (deleteMistake) {
      const id = deleteMistake.dataset.deleteMistake;
      state.mistakes = state.mistakes.filter(item => item.id !== id);
      delete state.reviewCycles[id];
      saveState();
      renderAll();
    }
    const deleteManual = event.target.closest("[data-delete-manual-review]");
    if (deleteManual) {
      const id = deleteManual.dataset.deleteManualReview;
      state.manualReviews = state.manualReviews.filter(item => item.id !== id);
      delete state.reviewCycles[id];
      Object.keys(state.reviewDrafts).filter(key => key.startsWith(`${id}::`)).forEach(key => delete state.reviewDrafts[key]);
      saveState();
      renderAll();
      return;
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
  $("#open-today-carryover")?.addEventListener("click", () => openDate(localDateString()));
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

  $("#day-task-sections").addEventListener("input", event => {
    const input = event.target.closest("[data-log-key]");
    if (input && activeDay) {
      getDayState(activeDay).logs[input.dataset.logKey] = input.value;
      saveState();
    }
  });
  ["#school-review-topic", "#school-review-note"].forEach(selector => $(selector).addEventListener("input", () => {
    if (!activeDay) return;
    const d = getDayState(activeDay);
    d.school.topic = $("#school-review-topic").value;
    d.school.note = $("#school-review-note").value;
    saveState();
  }));
  ["#result-title", "#self-rating", "#concept-1", "#concept-2", "#concept-3", "#representative-note", "#mistake-note", "#visual-note", "#stuck-note", "#review-question"].forEach(selector => $(selector).addEventListener("input", debouncedOutputSave));
  $("#complete-day-button").addEventListener("click", () => {
    if (!activeDay) return;
    DAY_CHECK_KEYS.filter(key => key !== "output").forEach(key => setTaskDone(activeDay, key, true));
    if (isSchoolDate(getDateStringForDay(activeDay))) setTaskDone(activeDay, "schoolReview", true);
    saveState();
    openDay(activeDay);
    renderDashboard();
    renderPlan();
    showToast("오늘 기본 학습을 모두 ✓ 완료로 표시했습니다. 기존 이월 대기는 취소됩니다.");
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
  initializeTimerRuntime();
  renderAll();
  const initialView = window.location.hash.replace("#", "");
  if (initialView) switchView(initialView, { skipHash: true, skipScroll: true, instant: true });
  registerServiceWorker();
});
