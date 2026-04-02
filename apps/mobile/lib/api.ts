import Constants from 'expo-constants'

const BASE = Constants.expoConfig?.extra?.apiUrl as string

export async function apiFetch(path: string, options: RequestInit = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export const mobileApi = {
  getJobs:     (limit = 20) => apiFetch(`/jobs?limit=${limit}`),
  getSignals:  ()           => apiFetch('/signals?min_score=40'),
  getPipeline: (uid: string) => apiFetch(`/pipeline/${uid}`),
  tailorResume: (jobId: string, userId: string) =>
    apiFetch('/resume/tailor', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, user_id: userId, create_doc: true }),
    }),
}
