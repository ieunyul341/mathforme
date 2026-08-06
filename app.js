const STORAGE_KEY = "g1-common-math2-science2-dashboard-v3";
const DB_NAME = "g1-study-dashboard-files";
const DB_VERSION = 1;
const FILE_STORE = "attachments";
const CHECK_KEYS = ["video", "note", "problems", "errors", "output"];
const CHECK_LABELS = {
  video: "강의 시청",
  note: "개념노트",
  problems: "문제풀이",
  errors: "오답정리",
  output: "한 장 결과물"
};

let state = loadState();
let activeView = "dashboard";
let subjectFilter = "전체";
let statusFilter = "전체";
let activeDay = null;
let toastTimer = null;
let dbPromise = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultDayState() {
  return {
    checks: { video: false, note: false, problems: false, errors: false, output: false },
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
    version: 3,
    startDate: localDateString(),
    theme: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    days
  };
}

function normalizeDayState(raw = {}) {
  const base = defaultDayState();
  return {
    ...base,
    ...raw,
    checks: { ...base.checks, ...(raw.checks || {}) },
    concepts: Array.isArray(raw.concepts) ? [raw.concepts[0] || "", raw.concepts[1] || "", raw.concepts[2] || ""] : base.concepts
  };
}

function loadState() {
  const fallback = buildDefaultState();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return fallback;
    const days = {};
    STUDY_PLAN.forEach(item => { days[item.day] = normalizeDayState(parsed.days?.[item.day]); });
    return {
      version: 3,
      startDate: parsed.startDate || fallback.startDate,
      theme: parsed.theme || fallback.theme,
      days
    };
  } catch (error) {
    console.warn("저장된 진도를 불러오지 못했습니다.", error);
    return fallback;
  }
}

function saveState(showSaved = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (showSaved) showToast("진도가 저장되었습니다.");
  const label = $("#autosave-label");
  if (label) {
    label.textContent = "자동 저장됨";
    label.dataset.savedAt = new Date().toISOString();
  }
}

function getPlan(day) {
  return STUDY_PLAN.find(item => item.day === Number(day));
}

function getDayState(day) {
  if (!state.days[day]) state.days[day] = defaultDayState();
  return state.days[day];
}

function getProgress(day) {
  const checks = getDayState(day).checks;
  const count = CHECK_KEYS.filter(key => Boolean(checks[key])).length;
  return { count, percent: count * 20, complete: count === CHECK_KEYS.length };
}

function getDateForDay(day) {
  const [year, month, date] = state.startDate.split("-").map(Number);
  const result = new Date(year, month - 1, date);
  result.setDate(result.getDate() + Number(day) - 1);
  return result;
}

function formatStudyDate(day, includeYear = false) {
  const date = getDateForDay(day);
  return new Intl.DateTimeFormat("ko-KR", {
    ...(includeYear ? { year: "numeric" } : {}),
    month: "short",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function todayDayNumber() {
  const start = getDateForDay(1);
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((current - start) / 86400000) + 1;
  return diff >= 1 && diff <= 30 ? diff : null;
}

function stats() {
  const all = STUDY_PLAN.map(item => ({ ...item, progress: getProgress(item.day) }));
  const completed = all.filter(item => item.progress.complete).length;
  const math = all.filter(item => item.subject === "수학");
  const science = all.filter(item => item.subject === "과학");
  const outputCount = all.filter(item => getDayState(item.day).checks.output).length;
  const mathDone = math.filter(item => item.progress.complete).length;
  const scienceDone = science.filter(item => item.progress.complete).length;
  let streak = 0;
  for (const item of all) {
    if (item.progress.complete) streak += 1;
    else break;
  }
  return {
    completed,
    overallPercent: Math.round((completed / 30) * 100),
    mathDone,
    mathPercent: Math.round((mathDone / math.length) * 100),
    scienceDone,
    sciencePercent: Math.round((scienceDone / science.length) * 100),
    outputCount,
    streak
  };
}

function nextIncompleteDay() {
  const next = STUDY_PLAN.find(item => !getProgress(item.day).complete);
  return next || STUDY_PLAN[STUDY_PLAN.length - 1];
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $("#theme-toggle").textContent = state.theme === "dark" ? "☀" : "◐";
}

function switchView(view) {
  activeView = view;
  $$(".app-view").forEach(section => section.classList.toggle("is-active", section.id === `view-${view}`));
  $$(".nav-button").forEach(button => button.classList.toggle("is-active", button.dataset.view === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "outputs") renderOutputs();
  if (view === "plan") renderPlan();
}

function renderAll() {
  $("#start-date").value = state.startDate;
  applyTheme();
  renderDashboard();
  renderPlan();
  renderOutputs();
  renderResources();
}

function renderDashboard() {
  const data = stats();
  $("#overall-percent").textContent = `${data.overallPercent}%`;
  $("#overall-days").textContent = `${data.completed} / 30일 완료`;
  $("#streak-label").textContent = `연속 완료 ${data.streak}일`;
  $("#overall-ring").style.setProperty("--progress", `${data.overallPercent * 3.6}deg`);
  $("#math-progress").textContent = `${data.mathPercent}%`;
  $("#math-days").textContent = `${data.mathDone} / 15일`;
  $("#science-progress").textContent = `${data.sciencePercent}%`;
  $("#science-days").textContent = `${data.scienceDone} / 14일`;
  $("#output-progress").textContent = data.outputCount;
  $("#output-count-large").textContent = data.outputCount;
  $("#today-label").textContent = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date());

  renderNext();
  renderWeekly();
  renderRoadmap();
}

function renderNext() {
  const item = nextIncompleteDay();
  const isAllDone = stats().completed === 30;
  $("#next-subject").textContent = isAllDone ? "완료" : item.subject;
  $("#next-subject").dataset.subject = item.subject;
  $("#next-day").textContent = isAllDone ? "30일 완주" : `Day ${item.day}`;
  $("#next-date").textContent = formatStudyDate(item.day, true);
  $("#next-topic").textContent = isAllDone ? "모든 학습을 완료했습니다" : item.topic;
  $("#next-lecture").textContent = isAllDone ? "백업 파일을 저장하고 취약 단원을 다시 복습하세요." : `${item.lecture} · ${item.minutes}분 권장`;
  $("#next-mission").textContent = isAllDone ? "수학 오답과 과학 개념 기록을 다음 학습 계획으로 이어가세요." : item.mission;
  $("#next-link").href = item.primaryUrl;
  $("#next-detail-button").dataset.day = item.day;
  $("#start-next-button").dataset.day = item.day;
  $("#open-next-output").dataset.day = item.day;
}

function renderWeekly() {
  const weeks = [
    { label: "1주차", start: 1, end: 7 },
    { label: "2주차", start: 8, end: 14 },
    { label: "3주차", start: 15, end: 21 },
    { label: "4주차", start: 22, end: 28 },
    { label: "5주차", start: 29, end: 30 }
  ];
  $("#weekly-progress").innerHTML = weeks.map(week => {
    const items = STUDY_PLAN.filter(item => item.day >= week.start && item.day <= week.end);
    const avg = Math.round(items.reduce((sum, item) => sum + getProgress(item.day).percent, 0) / items.length);
    return `
      <div class="week-row">
        <strong>${week.label}</strong>
        <div class="progress-track" aria-label="${week.label} ${avg}%"><div class="progress-fill" style="width:${avg}%"></div></div>
        <span>${avg}%</span>
      </div>`;
  }).join("");
}

function renderRoadmap() {
  const today = todayDayNumber();
  const next = nextIncompleteDay().day;
  $("#roadmap").innerHTML = STUDY_PLAN.map(item => {
    const progress = getProgress(item.day);
    const classNames = ["roadmap-day"];
    if (progress.complete) classNames.push("is-done");
    else if (progress.percent > 0 || item.day === next) classNames.push("is-active");
    if (today === item.day) classNames.push("is-today");
    return `<button class="${classNames.join(" ")}" type="button" data-open-day="${item.day}" title="${escapeHtml(item.topic)} · ${progress.percent}%">
      <strong>${item.day}</strong><small>${item.subject}</small>
    </button>`;
  }).join("");
}

function renderPlan() {
  const filtered = STUDY_PLAN.filter(item => {
    const subjectMatches = subjectFilter === "전체" || item.subject === subjectFilter;
    const complete = getProgress(item.day).complete;
    const statusMatches = statusFilter === "전체" || (statusFilter === "완료" ? complete : !complete);
    return subjectMatches && statusMatches;
  });

  if (!filtered.length) {
    $("#plan-list").innerHTML = `<div class="empty-state">선택한 조건에 맞는 학습일이 없습니다.</div>`;
    return;
  }

  $("#plan-list").innerHTML = filtered.map(item => {
    const dayState = getDayState(item.day);
    const progress = getProgress(item.day);
    return `<article class="plan-card ${progress.complete ? "is-done" : ""}">
      <div class="plan-card-day">
        <strong>Day ${item.day}</strong>
        <span>${formatStudyDate(item.day)}</span>
        <span>${item.minutes}분 · ${item.difficulty}</span>
      </div>
      <div class="plan-card-main">
        <span class="subject-chip" data-subject="${item.subject}">${item.subject} · ${item.unit}</span>
        <h3>${escapeHtml(item.topic)}</h3>
        <p class="lecture-line">${escapeHtml(item.lecture)} · ${escapeHtml(item.provider)}</p>
      </div>
      <div class="plan-card-mission">
        <strong>오늘 미션</strong>
        ${escapeHtml(item.mission)}
      </div>
      <div class="plan-card-progress">
        <div class="mini-progress-line"><span>완료율</span><strong>${progress.percent}%</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${progress.percent}%"></div></div>
        <div class="mini-checks" aria-label="Day ${item.day} 체크 현황">
          ${CHECK_KEYS.map(key => `<span class="mini-check ${dayState.checks[key] ? "is-done" : ""}" title="${CHECK_LABELS[key]}">${dayState.checks[key] ? "✓" : CHECK_LABELS[key].slice(0, 1)}</span>`).join("")}
        </div>
        <div class="card-actions">
          <button class="primary-button" type="button" data-open-day="${item.day}">체크·작성</button>
          <a class="secondary-button" href="${item.primaryUrl}" target="_blank" rel="noopener noreferrer">강의 ↗</a>
        </div>
      </div>
    </article>`;
  }).join("");
}

function hasOnePageContent(day) {
  const d = getDayState(day);
  return Boolean(
    d.checks.output || d.resultTitle || d.rating || d.concepts.some(Boolean) || d.representative || d.mistake || d.visual || d.stuck || d.question || d.attachment
  );
}

function renderOutputs() {
  const count = stats().outputCount;
  $("#output-count-large").textContent = count;
  $("#output-list").innerHTML = STUDY_PLAN.map(item => {
    const d = getDayState(item.day);
    const hasContent = hasOnePageContent(item.day);
    const title = d.resultTitle || `Day ${item.day} ${item.topic}`;
    const preview = [d.concepts.filter(Boolean).join(" · "), d.question].filter(Boolean);
    return `<article class="output-card ${d.checks.output ? "is-complete" : ""}">
      <div class="output-card-top">
        <div>
          <span class="subject-chip" data-subject="${item.subject}">${item.subject}</span>
          <span class="panel-kicker" style="display:inline;margin-left:6px">DAY ${item.day}</span>
        </div>
        <strong>${d.checks.output ? "완료" : hasContent ? "작성 중" : "미작성"}</strong>
      </div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(item.output)}</p>
      <div class="output-preview">
        ${preview.length ? preview.map(text => `<span>• ${escapeHtml(text)}</span>`).join("") : `<span>핵심 개념과 오답을 한 장에 정리하세요.</span>`}
        ${d.attachment ? `<span class="attachment-badge">▣ ${escapeHtml(d.attachment.name)}</span>` : ""}
      </div>
      <div class="output-card-actions">
        <button class="primary-button" type="button" data-open-day="${item.day}">${hasContent ? "열어보기" : "작성하기"}</button>
        <button class="secondary-button" type="button" data-print-day="${item.day}">인쇄/PDF</button>
      </div>
    </article>`;
  }).join("");
}

function renderResources() {
  $("#resource-list").innerHTML = RESOURCE_LINKS.map(resource => `
    <article class="resource-card">
      <span class="resource-card-type">${escapeHtml(resource.type)}</span>
      <h3>${escapeHtml(resource.title)}</h3>
      <p>${escapeHtml(resource.description)}</p>
      <a class="secondary-button" href="${resource.url}" target="_blank" rel="noopener noreferrer">자료 열기 ↗</a>
    </article>`).join("");

  $("#lecture-index").innerHTML = MATH_LECTURES.map((title, index) => `
    <div class="lecture-item"><span class="lecture-number">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(title)}</span></div>`).join("");
}

function openDay(day) {
  const item = getPlan(day);
  if (!item) return;
  activeDay = item.day;
  const d = getDayState(item.day);
  $("#modal-meta").textContent = `DAY ${item.day} · ${formatStudyDate(item.day, true)} · ${item.minutes}분 권장`;
  $("#modal-title").textContent = item.output;
  $("#modal-subject").textContent = item.subject;
  $("#modal-subject").dataset.subject = item.subject;
  $("#modal-topic").textContent = item.topic;
  $("#modal-lecture").textContent = `${item.lecture} · ${item.provider}`;
  $("#modal-course-link").href = item.primaryUrl;

  $("#modal-checks").innerHTML = CHECK_KEYS.map(key => `
    <label class="daily-check-label">
      <input type="checkbox" data-modal-check="${key}" ${d.checks[key] ? "checked" : ""}>
      <span>${CHECK_LABELS[key]}</span>
    </label>`).join("");

  $("#result-title").value = d.resultTitle;
  $("#self-rating").value = d.rating;
  $("#concept-1").value = d.concepts[0];
  $("#concept-2").value = d.concepts[1];
  $("#concept-3").value = d.concepts[2];
  $("#representative-note").value = d.representative;
  $("#mistake-note").value = d.mistake;
  $("#visual-note").value = d.visual;
  $("#stuck-note").value = d.stuck;
  $("#review-question").value = d.question;
  renderAttachmentInfo(item.day);
  $("#modal-backdrop").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#result-title").focus(), 60);
}

function closeModal() {
  if (activeDay) syncModalToState();
  $("#modal-backdrop").hidden = true;
  document.body.style.overflow = "";
  activeDay = null;
  renderAll();
}

function syncModalToState() {
  if (!activeDay) return;
  const d = getDayState(activeDay);
  d.checks = Object.fromEntries(CHECK_KEYS.map(key => [key, Boolean($(`[data-modal-check="${key}"]`)?.checked)]));
  d.resultTitle = $("#result-title").value.trim();
  d.rating = $("#self-rating").value;
  d.concepts = [$("#concept-1").value.trim(), $("#concept-2").value.trim(), $("#concept-3").value.trim()];
  d.representative = $("#representative-note").value.trim();
  d.mistake = $("#mistake-note").value.trim();
  d.visual = $("#visual-note").value.trim();
  d.stuck = $("#stuck-note").value.trim();
  d.question = $("#review-question").value.trim();
  d.updatedAt = new Date().toISOString();
  state.days[activeDay] = d;
  saveState();
}

function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

const debouncedModalSave = debounce(() => {
  syncModalToState();
  renderDashboard();
}, 220);

function exportProgress() {
  const payload = {
    app: "고1 공통수학2·통합과학2 30일 독학 대시보드",
    exportedAt: new Date().toISOString(),
    note: "첨부 파일은 브라우저 IndexedDB에 저장되므로 JSON 백업에는 파일 자체가 포함되지 않습니다.",
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `30일-학습진도-${localDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("진도 백업 파일을 저장했습니다.");
}

async function importProgress(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = parsed.state || parsed;
    if (!incoming.days || !incoming.startDate) throw new Error("올바른 백업 파일이 아닙니다.");
    const days = {};
    STUDY_PLAN.forEach(item => { days[item.day] = normalizeDayState(incoming.days?.[item.day]); });
    state = { version: 3, startDate: incoming.startDate, theme: incoming.theme || state.theme, days };
    saveState();
    renderAll();
    showToast("백업 진도를 불러왔습니다.");
  } catch (error) {
    console.error(error);
    alert("백업 파일을 불러오지 못했습니다. 이 대시보드에서 만든 JSON 파일인지 확인해 주세요.");
  }
}

function resetProgress() {
  const confirmed = window.confirm("30일 진도와 작성 내용을 모두 초기화할까요? 브라우저에 저장된 첨부 파일도 삭제됩니다.");
  if (!confirmed) return;
  state = buildDefaultState();
  localStorage.removeItem(STORAGE_KEY);
  clearAllAttachments().catch(console.error);
  saveState();
  renderAll();
  showToast("학습 기록을 초기화했습니다.");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function multiline(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function printDay(day) {
  const item = getPlan(day);
  const d = getDayState(day);
  const title = d.resultTitle || `Day ${day} ${item.topic}`;
  const concepts = d.concepts.filter(Boolean);
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) {
    alert("인쇄 창이 차단되었습니다. 브라우저의 팝업 허용 후 다시 시도해 주세요.");
    return;
  }
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>
    @page{size:A4;margin:13mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;color:#111827;margin:0;font-size:12.5px;line-height:1.55}.page{border:1px solid #cbd5e1;padding:16px;min-height:268mm}.top{display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #1e3a8a;padding-bottom:10px}.top h1{font-size:22px;margin:0}.meta{color:#475569}.badge{display:inline-block;background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:4px 9px;font-weight:800}section{border-top:1px dashed #cbd5e1;padding-top:10px;margin-top:10px}h2{font-size:14px;margin:0 0 6px;color:#1e3a8a}.box{min-height:42px;border:1px solid #dbe3ef;border-radius:8px;padding:9px;background:#f8fafc}.concepts{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.footer{display:flex;justify-content:space-between;margin-top:12px;color:#64748b;font-size:11px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><main class="page">
    <div class="top"><div><span class="badge">${escapeHtml(item.subject)} · Day ${item.day}</span><h1>${escapeHtml(title)}</h1><div class="meta">${escapeHtml(item.topic)} · ${escapeHtml(item.lecture)}</div></div><div class="meta">${escapeHtml(formatStudyDate(item.day, true))}<br>자기평가 ${escapeHtml(d.rating || "-")} / 5</div></div>
    <section><h2>1. 오늘의 핵심 개념 3개</h2><div class="concepts">${[0,1,2].map(i => `<div class="box">${escapeHtml(concepts[i] || d.concepts[i] || "")}</div>`).join("")}</div></section>
    <section><h2>2. 대표문제 또는 대표개념 1개</h2><div class="box">${multiline(d.representative)}</div></section>
    <section class="two"><div><h2>3. 오답 또는 헷갈린 포인트</h2><div class="box">${multiline(d.mistake)}</div></div><div><h2>4. 그림·그래프·흐름도</h2><div class="box">${multiline(d.visual)}</div></div></section>
    <section class="two"><div><h2>5. 오늘 막힌 점</h2><div class="box">${multiline(d.stuck)}</div></div><div><h2>6. 내일 복습 질문</h2><div class="box">${multiline(d.question)}</div></div></section>
    <section><h2>오늘의 미션</h2><div class="box">${escapeHtml(item.mission)}</div></section>
    <div class="footer"><span>고1 공통수학2·통합과학2 30일 독학 대시보드</span><span>${d.checks.output ? "한 장 결과물 완료" : "작성 중"}</span></div>
  </main><script>window.onload=()=>{window.print();}</script></body></html>`);
  popup.document.close();
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
  if (!record) {
    showToast("첨부 파일을 찾지 못했습니다.");
    return;
  }
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
  container.innerHTML = `<div class="attachment-file">
    <span>▣ ${escapeHtml(meta.name)} · ${formatBytes(meta.size)}</span>
    <div><button type="button" data-open-attachment="${day}">열기</button><button type="button" data-delete-attachment="${day}">삭제</button></div>
  </div>`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    saveState();
    renderAll();
    showToast("시작일과 30일 날짜를 변경했습니다.");
  });
  $("#export-button").addEventListener("click", exportProgress);
  $("#import-input").addEventListener("change", event => {
    const [file] = event.target.files;
    if (file) importProgress(file);
    event.target.value = "";
  });
  $("#reset-button").addEventListener("click", resetProgress);

  $("#subject-filters").addEventListener("click", event => {
    const button = event.target.closest("[data-filter-subject]");
    if (!button) return;
    subjectFilter = button.dataset.filterSubject;
    $$("[data-filter-subject]").forEach(item => item.classList.toggle("is-active", item === button));
    renderPlan();
  });
  $("#status-filter").addEventListener("change", event => {
    statusFilter = event.target.value;
    renderPlan();
  });

  document.addEventListener("click", event => {
    const open = event.target.closest("[data-open-day]");
    if (open) openDay(Number(open.dataset.openDay));
    const print = event.target.closest("[data-print-day]");
    if (print) printDay(Number(print.dataset.printDay));
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
  $("#open-next-output").addEventListener("click", event => openDay(Number(event.currentTarget.dataset.day)));
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-done").addEventListener("click", closeModal);
  $("#modal-backdrop").addEventListener("click", event => {
    if (event.target === event.currentTarget) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("#modal-backdrop").hidden) closeModal();
  });

  $("#complete-all-button").addEventListener("click", () => {
    $$("[data-modal-check]").forEach(input => { input.checked = true; });
    debouncedModalSave();
    showToast("5단계를 모두 완료로 표시했습니다.");
  });

  ["#result-title", "#self-rating", "#concept-1", "#concept-2", "#concept-3", "#representative-note", "#mistake-note", "#visual-note", "#stuck-note", "#review-question"]
    .forEach(selector => $(selector).addEventListener("input", debouncedModalSave));
  $("#modal-checks").addEventListener("change", debouncedModalSave);
  $("#print-button").addEventListener("click", () => {
    syncModalToState();
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
