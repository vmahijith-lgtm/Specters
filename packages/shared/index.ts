export type LLMProvider = 'openai' | 'anthropic' | 'gemini'

export type SignalType =
  | 'funding_round'
  | 'headcount_growth'
  | 'github_spike'
  | 'glassdoor_review'
  | 'exec_hire'
  | 'product_launch'

export type ApplicationStatus =
  | 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  target_roles: string[]
  target_locations: string[]
  target_industries: string[]
  base_resume: string | null
  llm_provider: LLMProvider
  llm_api_key: string | null
  expo_push_token: string | null
  watchlist: string[]
  email_digest: boolean
  created_at: string
}

export interface Signal {
  id: string
  company: string
  signal_type: SignalType
  signal_score: number
  headline: string | null
  source_url: string | null
  detected_at: string
}

export interface Job {
  id: string
  title: string
  company: string
  location: string | null
  remote: boolean
  description: string | null
  salary_min: number | null
  salary_max: number | null
  url: string
  source: string
  posted_at: string | null
  signal_id: string | null
  created_at: string
}

export interface UserJob {
  id: string
  user_id: string
  job_id: string
  status: ApplicationStatus
  tailored_resume_text: string | null
  tailored_resume_url: string | null
  outreach_draft: string | null
  response_probability: number | null
  notes: string | null
  applied_at: string | null
  next_follow_up: string | null
  created_at: string
  job?: Job
}

export interface HiringManager {
  id: string
  job_id: string
  name: string | null
  title: string | null
  linkedin_url: string | null
  company: string | null
}

export interface TailorResumeRequest {
  job_id: string
  user_id: string
}

export interface TailorResumeResponse {
  tailored_text: string
  doc_url: string | null
  keywords_matched: string[]
}

export interface DailyDigest {
  jobs: Job[]
  signals: Signal[]
  date: string
}
