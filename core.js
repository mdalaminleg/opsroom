/**
 * Ops Room — core
 *
 * Loaded by every authenticated page. Provides:
 *   - localStorage state layer (versioned key)
 *   - merge of SYLLABUS + custom additions into a single working tree
 *   - pure calculation functions (completion, coins, percentages)
 *   - api() client (auth + state save/load)
 *   - auth guard (run on DOMContentLoaded of every protected page)
 *   - lastOpenedItem tracking
 *
 * Depends on: syllabus.js (must be loaded first).
 * Depends on: shared.js (loaded after — core calls showToast, but only at runtime,
 *             never at module-eval time, so order is safe either way).
 *
 * No modules, no bundler. Exposes everything under window.Ops.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "admission_tracker_v1";
  const TOKEN_KEY = "ops_token";
  const USERNAME_KEY = "ops_username";

  // ── storage ────────────────────────────────────────────────────────────────
  function emptyState() {
    return {
      v: 1,
      custom: {
        subjects: [], // [{ id, name, nameBn, papers: [{ id, name, nameBn, chapters: [{id,name}] }] }]
      },
      progress: {
        // chapters[chapterId] = {
        //   theory: bool,
        //   revision: number,
        //   qb: number,
        //   exam: bool
        // }
        chapters: {},

        // paperFinals[paperId] = { recall: number, qb: number, exam: number }
        paperFinals: {},

        // subjectFinals[subjectId] = { recall: number, qb: number, exam: number }
        subjectFinals: {},

        // mockTest = { recall: number, qb: number, exam: number }
        mockTest: { recall: 0, qb: 0, exam: 0 },
      },
      ui: {
        lastOpenedItem: null, // { id, type: "chapter" | "subject" | "paperFinal" | "subjectFinal" | "mockTest" }
        unsynced: false,
        lastSyncedAt: null, // ISO string
      },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      // Migration hook point. Currently only v1 exists.
      if (!parsed || typeof parsed !== "object") return emptyState();
      return normalizeState(parsed);
    } catch {
      return emptyState();
    }
  }

  // Ensures every expected field exists even if a partial/older blob is loaded.
  function normalizeState(s) {
    const base = emptyState();
    const out = {
      v: 1,
      custom: {
        subjects: Array.isArray(s?.custom?.subjects) ? s.custom.subjects : [],
      },
      progress: {
        chapters:
          s?.progress && typeof s.progress.chapters === "object"
            ? s.progress.chapters
            : {},
        paperFinals:
          s?.progress && typeof s.progress.paperFinals === "object"
            ? s.progress.paperFinals
            : {},
        subjectFinals:
          s?.progress && typeof s.progress.subjectFinals === "object"
            ? s.progress.subjectFinals
            : {},
        mockTest:
          s?.progress && typeof s.progress.mockTest === "object"
            ? {
                recall: num(s.progress.mockTest.recall),
                qb: num(s.progress.mockTest.qb),
                exam: num(s.progress.mockTest.exam),
              }
            : { ...base.progress.mockTest },
      },
      ui: {
        lastOpenedItem: s?.ui?.lastOpenedItem ?? null,
        unsynced: !!s?.ui?.unsynced,
        lastSyncedAt: typeof s?.ui?.lastSyncedAt === "string" ? s.ui.lastSyncedAt : null,
      },
    };
    return out;
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Quota exceeded, private mode, etc. Surface it.
      if (window.Ops && window.Ops.toast) {
        window.Ops.toast("Could not save to this browser.", "error");
      }
    }
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }

  // ── in-memory state ────────────────────────────────────────────────────────
  let _state = loadState();

  function getState() {
    return _state;
  }

  // The single mutation entry point. Every change goes through here so that
  // persistence + unsynced-flag bookkeeping can never be skipped.
  function mutate(fn) {
    fn(_state);
    _state.ui.unsynced = true;
    saveState(_state);
  }

  function replaceState(next) {
    _state = normalizeState(next);
    _state.ui.unsynced = false;
    saveState(_state);
  }

  // ── merged syllabus (default + custom) ─────────────────────────────────────
  function getMergedSyllabus() {
    const defaults = (window.SYLLABUS && window.SYLLABUS.subjects) || [];
    const custom = _state.custom.subjects || [];

    // Shallow clone of defaults so callers can't mutate the static data.
    const merged = defaults.map((s) => ({
      id: s.id,
      name: s.name,
      nameBn: s.nameBn,
      isCustom: false,
      papers: s.papers.map((p) => ({
        id: p.id,
        name: p.name,
        nameBn: p.nameBn,
        subjectId: s.id,
        isCustom: false,
        chapters: p.chapters.map((c) => ({
          id: c.id,
          name: c.name,
          paperId: p.id,
          subjectId: s.id,
          isCustom: false,
        })),
      })),
    }));

    for (const cs of custom) {
      merged.push({
        id: cs.id,
        name: cs.name,
        nameBn: cs.nameBn || cs.name,
        isCustom: true,
        papers: (cs.papers || []).map((p) => ({
          id: p.id,
          name: p.name,
          nameBn: p.nameBn || p.name,
          subjectId: cs.id,
          isCustom: true,
          chapters: (p.chapters || []).map((c) => ({
            id: c.id,
            name: c.name,
            paperId: p.id,
            subjectId: cs.id,
            isCustom: true,
          })),
        })),
      });
    }

    return merged;
  }

  // ── lookups ────────────────────────────────────────────────────────────────
  function findSubject(subjectId) {
    return getMergedSyllabus().find((s) => s.id === subjectId) || null;
  }
  function findPaper(paperId) {
    for (const s of getMergedSyllabus()) {
      const p = s.papers.find((x) => x.id === paperId);
      if (p) return p;
    }
    return null;
  }
  function findChapter(chapterId) {
    for (const s of getMergedSyllabus()) {
      for (const p of s.papers) {
        const c = p.chapters.find((x) => x.id === chapterId);
        if (c) return c;
      }
    }
    return null;
  }

  function getAllChapters() {
    const out = [];
    for (const s of getMergedSyllabus()) {
      for (const p of s.papers) {
        for (const c of p.chapters) out.push(c);
      }
    }
    return out;
  }

  // ── chapter progress ───────────────────────────────────────────────────────
  function getChapterProgress(chapterId) {
    const p = _state.progress.chapters[chapterId];
    return {
      theory: !!(p && p.theory),
      revision: num(p && p.revision),
      qb: num(p && p.qb),
      exam: !!(p && p.exam),
    };
  }

  function setChapterField(chapterId, field, value) {
    mutate((s) => {
      if (!s.progress.chapters[chapterId]) {
        s.progress.chapters[chapterId] = {
          theory: false,
          revision: 0,
          qb: 0,
          exam: false,
        };
      }
      s.progress.chapters[chapterId][field] = value;
    });
  }

  function isChapterComplete(chapterId) {
    const p = getChapterProgress(chapterId);
    return p.theory === true && p.revision >= 1 && p.qb >= 1 && p.exam === true;
  }

  // ── paper / subject / mock ─────────────────────────────────────────────────
  function getPaperFinal(paperId) {
    const p = _state.progress.paperFinals[paperId];
    return {
      recall: num(p && p.recall),
      qb: num(p && p.qb),
      exam: num(p && p.exam),
    };
  }
  function setPaperFinalField(paperId, field, value) {
    mutate((s) => {
      if (!s.progress.paperFinals[paperId]) {
        s.progress.paperFinals[paperId] = { recall: 0, qb: 0, exam: 0 };
      }
      s.progress.paperFinals[paperId][field] = value;
    });
  }
  function isPaperFinalComplete(paperId) {
    const p = getPaperFinal(paperId);
    return p.recall >= 1 && p.qb >= 1 && p.exam >= 1;
  }

  function getSubjectFinal(subjectId) {
    const p = _state.progress.subjectFinals[subjectId];
    return {
      recall: num(p && p.recall),
      qb: num(p && p.qb),
      exam: num(p && p.exam),
    };
  }
  function setSubjectFinalField(subjectId, field, value) {
    mutate((s) => {
      if (!s.progress.subjectFinals[subjectId]) {
        s.progress.subjectFinals[subjectId] = { recall: 0, qb: 0, exam: 0 };
      }
      s.progress.subjectFinals[subjectId][field] = value;
    });
  }
  function isSubjectFinalComplete(subjectId) {
    const p = getSubjectFinal(subjectId);
    return p.recall >= 1 && p.qb >= 1 && p.exam >= 1;
  }

  function getMockTest() {
    const m = _state.progress.mockTest || { recall: 0, qb: 0, exam: 0 };
    return { recall: num(m.recall), qb: num(m.qb), exam: num(m.exam) };
  }
  function setMockTestField(field, value) {
    mutate((s) => {
      if (!s.progress.mockTest) s.progress.mockTest = { recall: 0, qb: 0, exam: 0 };
      s.progress.mockTest[field] = value;
    });
  }
  function isMockTestComplete() {
    const m = getMockTest();
    return m.recall >= 1 && m.qb >= 1 && m.exam >= 1;
  }

  // ── derived totals ─────────────────────────────────────────────────────────
  // Coins = number of currently-complete chapters. Never stored.
  function getCoins() {
    let n = 0;
    for (const c of getAllChapters()) if (isChapterComplete(c.id)) n++;
    return n;
  }

  function getChapterTotals() {
    const all = getAllChapters();
    let done = 0;
    for (const c of all) if (isChapterComplete(c.id)) done++;
    return { done, total: all.length };
  }

  function getOverallPercentage() {
    const { done, total } = getChapterTotals();
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  }

  function getSubjectStats(subjectId) {
    const s = findSubject(subjectId);
    if (!s) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    let total = 0;
    for (const p of s.papers) {
      for (const c of p.chapters) {
        total++;
        if (isChapterComplete(c.id)) done++;
      }
    }
    return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }

  function getPaperStats(paperId) {
    const p = findPaper(paperId);
    if (!p) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    for (const c of p.chapters) if (isChapterComplete(c.id)) done++;
    const total = p.chapters.length;
    return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }

  // ── last-opened tracking ───────────────────────────────────────────────────
  function rememberOpened(id, type) {
    mutate((s) => {
      s.ui.lastOpenedItem = { id, type };
    });
  }

  function getLastOpened() {
    return _state.ui.lastOpenedItem;
  }

  // Returns a URL the "Continue" button should navigate to, or null.
  function getContinueTarget() {
    const last = getLastOpened();
    if (last) {
      const url = urlForItem(last);
      if (url) return url;
    }
    // Fallback: first incomplete chapter in syllabus order.
    for (const c of getAllChapters()) {
      if (!isChapterComplete(c.id)) return `chapter.html?id=${encodeURIComponent(c.id)}`;
    }
    // Everything complete — land on dashboard.
    return "dashboard.html";
  }

  function urlForItem(item) {
    if (!item || !item.id || !item.type) return null;
    switch (item.type) {
      case "chapter":
        return findChapter(item.id) ? `chapter.html?id=${encodeURIComponent(item.id)}` : null;
      case "subject":
        return findSubject(item.id) ? `subject.html?id=${encodeURIComponent(item.id)}` : null;
      case "paperFinal":
        return findPaper(item.id) ? `finals.html?paper=${encodeURIComponent(item.id)}` : null;
      case "subjectFinal":
        return findSubject(item.id) ? `finals.html?subject=${encodeURIComponent(item.id)}` : null;
      case "mockTest":
        return "mock-test.html";
      default:
        return null;
    }
  }

  // ── sync state helpers ─────────────────────────────────────────────────────
  function markSynced(iso) {
    mutate((s) => {
      s.ui.unsynced = false;
      s.ui.lastSyncedAt = iso || new Date().toISOString();
    });
  }

  function isUnsynced() {
    return !!_state.ui.unsynced;
  }

  function getLastSyncedAt() {
    return _state.ui.lastSyncedAt;
  }

  // ── api client ─────────────────────────────────────────────────────────────
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }
  function getUsername() {
    return localStorage.getItem(USERNAME_KEY) || "";
  }
  function setUsername(u) {
    if (u) localStorage.setItem(USERNAME_KEY, u);
    else localStorage.removeItem(USERNAME_KEY);
  }

  async function api(path, options = {}) {
    const opts = {
      method: options.method || "GET",
      headers: { ...(options.headers || {}) },
    };
    if (options.body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(options.body);
    }
    if (options.auth !== false) {
      const t = getToken();
      if (t) opts.headers["Authorization"] = `Bearer ${t}`;
    }

    let res;
    try {
      res = await fetch(`/api${path}`, opts);
    } catch {
      throw new ApiError("Network unavailable.", 0);
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg = (data && data.error) || `Request failed (${res.status}).`;
      throw new ApiError(msg, res.status);
    }
    return data;
  }

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }

  // ── auth guard ─────────────────────────────────────────────────────────────
  // Call from every protected page on load. If not authenticated, redirects to
  // index.html immediately and returns false. If authenticated, returns true
  // and resolves the username (fire-and-forget verification against server).
  function requireAuth() {
    const token = getToken();
    if (!token) {
      redirectToLogin();
      return false;
    }
    // Optimistic: token present → let the page render. We verify signature
    // asynchronously; if it fails, redirect. This avoids a blank-screen flash.
    api("/auth/me", { auth: true })
      .then((data) => {
        if (data && data.username) setUsername(data.username);
      })
      .catch((err) => {
        if (err && err.status === 401) {
          setToken(null);
          setUsername(null);
          redirectToLogin();
        }
        // Network errors: stay on page. Offline use is supported.
      });
    return true;
  }

  function redirectToLogin() {
    const here = location.pathname.split("/").pop() || "";
    if (here === "index.html" || here === "") return;
    location.replace("index.html");
  }

  async function logout() {
    setToken(null);
    setUsername(null);
    // Do NOT clear app_state — spec says local data survives sign out.
    location.replace("index.html");
  }

  // ── cloud save / load ──────────────────────────────────────────────────────
  async function cloudSave() {
    // Strip runtime-only ui.unsynced from what we upload? No — keep it, so a
    // restore restores "clean" state. We just flip it before upload.
    const payload = JSON.parse(JSON.stringify(_state));
    payload.ui.unsynced = false;
    const res = await api("/state", { method: "PUT", body: { data: payload } });
    markSynced(res && res.updated_at);
    return res;
  }

  async function cloudLoad() {
    const res = await api("/state");
    if (res && res.data) {
      replaceState(res.data);
      if (res.updated_at) {
        // replaceState clears unsynced; record the server's timestamp.
        mutate((s) => {
          s.ui.unsynced = false;
          s.ui.lastSyncedAt = res.updated_at;
        });
      }
    }
    return res;
  }

  // ── export / import ────────────────────────────────────────────────────────
  function exportState() {
    return JSON.stringify(_state, null, 2);
  }

  // Validates shape and returns a summary of what would change.
  function summarizeImport(json) {
    let parsed;
    try {
      parsed = typeof json === "string" ? JSON.parse(json) : json;
    } catch {
      throw new Error("Not valid JSON.");
    }
    if (!parsed || typeof parsed !== "object") throw new Error("Not a state object.");

    const norm = normalizeState(parsed);
    const customSubjects = norm.custom.subjects.length;
    let chaptersTouched = 0;
    for (const k of Object.keys(norm.progress.chapters)) {
      const p = norm.progress.chapters[k];
      if (p && (p.theory || p.revision > 0 || p.qb > 0 || p.exam)) chaptersTouched++;
    }
    const paperFinalsTouched = Object.keys(norm.progress.paperFinals).length;
    const subjectFinalsTouched = Object.keys(norm.progress.subjectFinals).length;
    return {
      normalized: norm,
      summary: {
        customSubjects,
        chaptersTouched,
        paperFinalsTouched,
        subjectFinalsTouched,
        hasMockTest:
          norm.progress.mockTest.recall > 0 ||
          norm.progress.mockTest.qb > 0 ||
          norm.progress.mockTest.exam > 0,
      },
    };
  }

  function applyImport(normalized) {
    replaceState(normalized);
  }

  // ── utils ──────────────────────────────────────────────────────────────────
  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }

  function incField(obj, field, delta) {
    const next = Math.max(0, num(obj[field]) + delta);
    return next;
  }

  // ── exports ────────────────────────────────────────────────────────────────
  window.Ops = {
    // storage
    getState,
    mutate,
    replaceState,
    clearAll,

    // syllabus
    getMergedSyllabus,
    findSubject,
    findPaper,
    findChapter,
    getAllChapters,

    // chapter
    getChapterProgress,
    setChapterField,
    isChapterComplete,

    // paper / subject / mock
    getPaperFinal,
    setPaperFinalField,
    isPaperFinalComplete,
    getSubjectFinal,
    setSubjectFinalField,
    isSubjectFinalComplete,
    getMockTest,
    setMockTestField,
    isMockTestComplete,

    // derived
    getCoins,
    getChapterTotals,
    getOverallPercentage,
    getSubjectStats,
    getPaperStats,

    // navigation memory
    rememberOpened,
    getLastOpened,
    getContinueTarget,

    // sync
    isUnsynced,
    getLastSyncedAt,
    markSynced,

    // auth + api
    api,
    ApiError,
    getToken,
    setToken,
    getUsername,
    setUsername,
    requireAuth,
    logout,

    // cloud
    cloudSave,
    cloudLoad,

    // import/export
    exportState,
    summarizeImport,
    applyImport,

    // utils
    num,
    incField,
  };
})();
