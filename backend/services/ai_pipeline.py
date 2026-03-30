"""
Provider-agnostic AI pipeline. Uses the user's own API key.
Supports OpenAI, Anthropic Claude, and Google Gemini.
"""
import os
from typing import Literal

LLMProvider = Literal["openai", "anthropic", "gemini"]

LATEX_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "latex_template.tex")
with open(LATEX_TEMPLATE_PATH, "r") as f:
    LATEX_TEMPLATE_TEXT = f.read()

TAILOR_PROMPT_TEMPLATE = """You are a professional resume writer and ATS optimization expert.

Rewrite the candidate's resume to closely match the job description language.
You MUST output your response strictly as valid LaTeX code, using the exact document structure and formatting provided in the template below.

RULES (follow every one):
1. Mirror terminology exactly — if JD says "program management" use that, not "project management".
2. Match the fields exactly to the candidate's actual identity, education, and URLs from the CANDIDATE RESUME. Do not fabricate any information.
3. Reorder or revise bullet points so the most relevant achievements for this specific role appear first.
4. Keep the resume strictly to ONE page. Project descriptions should be CRISP, using no more than 2-3 highly impactful bullet points per project. Experience bullets must be equally brief and punchy.
5. Maintain 100% factual accuracy — never invent skills or experience.
6. ALL OUTPUT MUST BE VALID LATEX text starting with \\documentclass and ending with \\end{document}. It MUST compile perfectly in Overleaf.
7. DO NOT wrap your output in markdown code blocks (e.g. ```latex). Output only the raw LaTeX string.
8. CRITICAL: NEVER leave unescaped special LaTeX characters (like &, %, $, #, or _) in the standard text. Always escape them (e.g., \\&, \\%, \\$).
9. Ensure there are no unbalanced braces or environments. Check the LaTeX syntax carefully before outputting.

===== TARGET LATEX TEMPLATE TO FILL =====
[TEMPLATE_PLACEHOLDER]
=========================================

JOB DESCRIPTION:
[JD_PLACEHOLDER]

CANDIDATE RESUME:
[RESUME_PLACEHOLDER]

YOUR TAILORED RAW LATEX CODE:"""

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
    prompt = TAILOR_PROMPT_TEMPLATE.replace(
        "[TEMPLATE_PLACEHOLDER]", LATEX_TEMPLATE_TEXT
    ).replace(
        "[JD_PLACEHOLDER]", job_description
    ).replace(
        "[RESUME_PLACEHOLDER]", base_resume
    )
    tailored = await call_llm(prompt, provider, api_key, max_tokens=3000)

    # Clean up any potential markdown code blocks the AI might still add
    if tailored.startswith("```latex"):
        tailored = tailored[len("```latex"):].strip()
    if tailored.startswith("```"):
        tailored = tailored[3:].strip()
    if tailored.endswith("```"):
        tailored = tailored[:-3].strip()

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
