"""
Provider-agnostic AI pipeline. Uses the user's own API key.
Supports OpenAI, Anthropic Claude, and Google Gemini.
"""
from typing import Literal

LLMProvider = Literal["openai", "anthropic", "gemini"]

TAILOR_PROMPT = """You are a professional resume writer and ATS optimization expert.

Rewrite the candidate's resume to closely match the job description language.

RULES (follow every one):
1. Mirror terminology exactly — if JD says "program management" use that, not "project management"
2. Reorder bullet points so most relevant achievements appear first
3. Trim irrelevant experience to one line, never delete it
4. Maintain 100% factual accuracy — never invent skills or experience
5. Use strong action verbs from the job description
6. Match the seniority level and tone of the JD
7. Output clean plain text with standard resume sections, no markdown symbols

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME:
{base_resume}

TAILORED RESUME:"""

OUTREACH_PROMPT = """You are an expert at writing concise, personable LinkedIn direct messages
to hiring managers. Write a message that:
- Is 3-4 sentences max, no more
- References something specific about the role or company
- Mentions ONE key achievement from the resume relevant to the role
- Has a clear, low-friction call to action
- Does NOT start with "I hope this message finds you well"
- Does NOT use any buzzwords or generic phrases

Job title: {job_title}
Company: {company}
Hiring manager name (use first name only): {manager_name}
Candidate's most relevant achievement: {key_achievement}

LINKEDIN DM:"""

SCORE_PROMPT = """Rate the probability (0-100) that this candidate will get a response
to their application, based on how well their resume matches this job description.
Consider: skills match, experience level, location, and ATS keyword alignment.
Respond with ONLY a number between 0 and 100.

JOB DESCRIPTION:
{job_description}

RESUME:
{resume}

PROBABILITY:"""

async def call_llm(prompt: str, provider: LLMProvider, api_key: str, max_tokens: int = 2000) -> str:
    if provider == "openai":
        import openai
        client = openai.AsyncOpenAI(api_key=api_key)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content.strip()

    elif provider == "anthropic":
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)
        resp = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text.strip()

    elif provider == "gemini":
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        resp = await model.generate_content_async(prompt)
        return resp.text.strip()

    raise ValueError(f"Unknown provider: {provider}")

async def tailor_resume(
    job_description: str,
    base_resume: str,
    provider: LLMProvider,
    api_key: str,
) -> tuple[str, list[str]]:
    """Returns (tailored_resume_text, keywords_matched)."""
    prompt = TAILOR_PROMPT.format(
        job_description=job_description, base_resume=base_resume
    )
    tailored = await call_llm(prompt, provider, api_key, max_tokens=2500)

    # Extract matched keywords (simple overlap check)
    jd_words = set(job_description.lower().split())
    resume_words = set(tailored.lower().split())
    common = jd_words & resume_words
    keywords = [w for w in common if len(w) > 5 and w.isalpha()][:15]

    return tailored, keywords

async def draft_outreach(
    job_title: str,
    company: str,
    manager_name: str,
    key_achievement: str,
    provider: LLMProvider,
    api_key: str,
) -> str:
    prompt = OUTREACH_PROMPT.format(
        job_title=job_title,
        company=company,
        manager_name=manager_name or "there",
        key_achievement=key_achievement,
    )
    return await call_llm(prompt, provider, api_key, max_tokens=300)

async def score_application(
    job_description: str,
    resume: str,
    provider: LLMProvider,
    api_key: str,
) -> int:
    prompt = SCORE_PROMPT.format(job_description=job_description, resume=resume)
    raw = await call_llm(prompt, provider, api_key, max_tokens=10)
    try:
        return max(0, min(100, int("".join(filter(str.isdigit, raw)))))
    except ValueError:
        return 50
