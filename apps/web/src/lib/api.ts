const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function apiFetch(path: string, options: RequestInit = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export const api = {
  getJobs: (params?: { company?: string; role?: string; limit?: number; user_id?: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qs = new URLSearchParams(params as any).toString()
    return apiFetch(`/jobs?${qs}`)
  },
  getJob: (id: string) => apiFetch(`/jobs/${id}`),
  scanJobs: (userId: string) =>
    apiFetch(`/jobs/scan`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
  getSignals: (minScore = 0, companies?: string[]) => {
    const qs = new URLSearchParams({ min_score: String(minScore) })
    if (companies && companies.length > 0) qs.set('companies', companies.join(','))
    return apiFetch(`/signals?${qs}`)
  },
  scanSignals: (companies: string[]) =>
    apiFetch('/signals/scan', {
      method: 'POST',
      body: JSON.stringify(companies),
    }),
  tailorResume: (jobId: string, userId: string, createDoc = true) =>
    apiFetch('/resume/tailor', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, user_id: userId, create_doc: createDoc }),
    }),
  uploadResume: (userId: string, resumeText: string) =>
    apiFetch('/resume/upload', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, resume_text: resumeText }),
    }),
  draftOutreach: (jobId: string, userId: string, managerName: string, achievement: string) =>
    apiFetch('/outreach/draft', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId, user_id: userId,
        manager_name: managerName, key_achievement: achievement,
      }),
    }),
  getPipeline: (userId: string) => apiFetch(`/pipeline/${userId}`),
  updateStatus: (userId: string, jobId: string, status: string, notes?: string) =>
    apiFetch('/pipeline/status', {
      method: 'PATCH',
      body: JSON.stringify({ user_id: userId, job_id: jobId, status, notes }),
    }),
  getHiringManagers: (jobId: string) =>
    apiFetch(`/hiring-managers?job_id=${jobId}`),
  discoverHiringManagers: (jobId: string, userId: string) =>
    apiFetch('/hiring-managers/discover', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, user_id: userId }),
    }),
}
