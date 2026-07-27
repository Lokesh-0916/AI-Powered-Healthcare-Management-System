/* ═══════════════════════════════════════════════════════
   api.js — Fetch wrapper with auth header injection
═══════════════════════════════════════════════════════ */

const BASE_URL = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('hc_token');
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  headers['Pragma'] = 'no-cache';
  headers['Expires'] = '0';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      if (window.Auth) {
        window.Auth.logout();
        // Return a promise that never resolves so we don't throw errors while the page is navigating away
        return new Promise(() => {});
      }
    }
    const err = new Error(data.message || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  get:    (path)              => request('GET',    path),
  post:   (path, body)        => request('POST',   path, body),
  put:    (path, body)        => request('PUT',    path, body),
  patch:  (path, body)        => request('PATCH',  path, body),
  delete: (path)              => request('DELETE', path),
  upload: (path, formData)    => request('POST',   path, formData, true),
};

window.api = api;
