/* ============================================================
   Eden API client — thin fetch() wrapper around the Node backend
   ============================================================ */
(function () {
  // Same-origin by default (server serves both /api and /). Override via window.EDEN_API_BASE if needed.
  const BASE = window.EDEN_API_BASE || '';

  const TOKEN_KEY = 'eden.token';
  const USER_KEY  = 'eden.user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
  }
  function setToken(token, remember = true) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, token);
    (remember ? sessionStorage : localStorage).removeItem(TOKEN_KEY);
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function setUser(user, remember = true) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(USER_KEY, JSON.stringify(user));
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (err) {
      throw new Error('Network error — is the server running? (npm start in /backend)');
    }

    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      const msg = (json && json.error) || `HTTP ${res.status}`;
      const e = new Error(msg);
      e.status = res.status;
      e.body = json;
      throw e;
    }
    return json || {};
  }

  window.EdenAPI = {
    // Auth
    signup:  (email, nick, password) => request('POST', '/api/auth/signup', { email, nick, password }),
    verify:  (email, code) => request('POST', '/api/auth/verify', { email, code }),
    resend:  (email) => request('POST', '/api/auth/resend', { email }),
    signin:  (email, password) => request('POST', '/api/auth/signin', { email, password }),
    me:      () => request('GET',  '/api/auth/me'),
    mailerStatus: () => request('GET', '/api/auth/mailer-status'),
    changePassword: (oldPassword, newPassword) =>
      request('POST', '/api/auth/change-password', { oldPassword, newPassword }),

    // Transcribe
    transcribeYoutube: (url) => request('POST', '/api/transcribe/youtube', { url }),
    transcribeStatus:  ()    => request('GET',  '/api/transcribe/status'),
    transcribeAudio:   async (file) => {
      const form = new FormData();
      form.append('file', file, file.name || 'audio.mp3');
      const headers = {};
      const token = getToken();
      if (token) headers.Authorization = 'Bearer ' + token;
      const res = await fetch(BASE + '/api/transcribe/audio', { method: 'POST', headers, body: form });
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) {
        const e = new Error((json && json.error) || `HTTP ${res.status}`);
        e.status = res.status; throw e;
      }
      return json;
    },

    // Boards
    boardsMine:     ()         => request('GET',    '/api/boards/mine'),
    boardsFeed:     ()         => request('GET',    '/api/boards/feed'),
    boardsDiscover: ()         => request('GET',    '/api/boards/discover'),
    boardsCreate:   (title, description, isPublic) =>
                                  request('POST',   '/api/boards', { title, description, isPublic }),
    boardsGet:      (id)       => request('GET',    '/api/boards/' + id),
    boardsPublic:   (slug)     => request('GET',    '/api/boards/public/' + slug),
    boardsUpdate:   (id, p)    => request('PATCH',  '/api/boards/' + id, p),
    boardsDelete:   (id)       => request('DELETE', '/api/boards/' + id),
    boardsAddItem:  (id, kind, payload) =>
                                  request('POST',   `/api/boards/${id}/items`, { kind, payload }),
    boardsDelItem:  (id, itemId) =>
                                  request('DELETE', `/api/boards/${id}/items/${itemId}`),
    boardsFollow:   (id)       => request('POST',   `/api/boards/${id}/follow`),
    boardsUnfollow: (id)       => request('DELETE', `/api/boards/${id}/follow`),

    // Billing
    billingPlans:     ()                 => request('GET',  '/api/billing/plans'),
    billingStatus:    ()                 => request('GET',  '/api/billing/status'),
    billingSubscribe: (plan, trial=false)=> request('POST', '/api/billing/subscribe', { plan, trial }),

    // Token / session
    getToken, setToken, clearToken, getUser, setUser,

    // Generic
    request
  };
})();
