async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
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
    add: (yearId, pupilId, date) => request('POST', `/api/years/${yearId}/pupils/${pupilId}/absences`, { date }),
    remove: (yearId, pupilId, date) => request('DELETE', `/api/years/${yearId}/pupils/${pupilId}/absences/${date}`),
  },
  report: {
    year: (yearId) => request('GET', `/api/years/${yearId}/report`),
  },
  closures: {
    list: (yearId) => request('GET', `/api/years/${yearId}/closures`),
    add: (yearId, date) => request('POST', `/api/years/${yearId}/closures`, { date }),
    remove: (yearId, date) => request('DELETE', `/api/years/${yearId}/closures/${date}`),
  },
};
