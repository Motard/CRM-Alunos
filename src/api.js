const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function request(method, path, body) {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    sessionStorage.removeItem('token');
    window.location.reload();
    throw new Error('unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  years: {
    list: () => request('GET', '/api/years'),
    create: (data) => request('POST', '/api/years', data),
    update: (id, data) => request('PUT', `/api/years/${id}`, data),
    delete: (id) => request('DELETE', `/api/years/${id}`),
  },
  pupils: {
    list: (all = false) => request('GET', `/api/pupils${all ? '?all=1' : ''}`),
    create: (data) => request('POST', '/api/pupils', data),
    update: (id, data) => request('PUT', `/api/pupils/${id}`, data),
    delete: (id) => request('DELETE', `/api/pupils/${id}`),
  },
  enrollments: {
    list: (yearId) => request('GET', `/api/years/${yearId}/pupils`),
    add: (yearId, pupilId) => request('POST', `/api/years/${yearId}/pupils`, { pupil_id: pupilId }),
    remove: (yearId, pupilId) => request('DELETE', `/api/years/${yearId}/pupils/${pupilId}`),
  },
  absences: {
    list: (yearId, pupilId) => request('GET', `/api/years/${yearId}/pupils/${pupilId}/absences`),
    add: (yearId, pupilId, date, justified) => request('POST', `/api/years/${yearId}/pupils/${pupilId}/absences`, { date, justified }),
    remove: (yearId, pupilId, date) => request('DELETE', `/api/years/${yearId}/pupils/${pupilId}/absences/${date}`),
    justify: (yearId, pupilId, date, justified) => request('PATCH', `/api/years/${yearId}/pupils/${pupilId}/absences/${date}`, { justified }),
  },
  report: {
    year: (yearId) => request('GET', `/api/years/${yearId}/report`),
  },
  closures: {
    list: (yearId) => request('GET', `/api/years/${yearId}/closures`),
    add: (yearId, date) => request('POST', `/api/years/${yearId}/closures`, { date }),
    remove: (yearId, date) => request('DELETE', `/api/years/${yearId}/closures/${date}`),
  },
  notes: {
    list: (yearId) => request('GET', `/api/years/${yearId}/notes`),
    save: (yearId, date, note) => request('PUT', `/api/years/${yearId}/notes/${date}`, { note }),
    remove: (yearId, date) => request('DELETE', `/api/years/${yearId}/notes/${date}`),
  },
};
