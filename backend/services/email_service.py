"""Daily digest emails via Resend."""
import resend
from config import settings

resend.api_key = settings.resend_api_key

def send_daily_digest(to_email: str, jobs: list[dict], signals: list[dict]):
    if not jobs and not signals:
        return

    signals_html = "".join([
        f"""<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
            <strong>{s['company']}</strong>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;">
            {s['signal_type'].replace('_',' ').title()}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
            <span style="background:#f3f0ff;color:#7c3aed;padding:2px 8px;border-radius:999px;font-size:12px;">
              Score {s['signal_score']}
            </span>
          </td>
        </tr>"""
        for s in signals[:5]
    ])

    jobs_html = "".join([
        f"""<div style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <a href="{j['url']}" style="color:#7c3aed;font-weight:600;text-decoration:none;">
            {j['title']}
          </a>
          <div style="color:#6b7280;font-size:14px;margin-top:2px;">
            {j['company']} · {j.get('location','Remote')}
          </div>
        </div>"""
        for j in jobs[:5]
    ])

    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h1 style="font-size:20px;font-weight:600;margin-bottom:4px;">
        Your daily Specters briefing
      </h1>
      <p style="color:#6b7280;margin-top:0;">
        {len(signals)} hiring signals · {len(jobs)} fresh listings
      </p>

      {"<h2 style='font-size:16px;margin-top:24px;'>🔭 Hiring signals</h2><table style='width:100%;border-collapse:collapse;'>" + signals_html + "</table>" if signals else ""}

      <h2 style="font-size:16px;margin-top:24px;">💼 Fresh jobs (last 24h)</h2>
      {jobs_html}

      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
        <a href="https://specters.works/dashboard"
           style="background:#7c3aed;color:#fff;padding:10px 20px;border-radius:8px;
                  text-decoration:none;font-weight:500;">
          Open Specters →
        </a>
      </div>
    </div>
    """

    resend.Emails.send({
        "from":    "Specters <digest@specters.works>",
        "to":      [to_email],
        "subject": f"Specters: {len(signals)} signals · {len(jobs)} new jobs today",
        "html":    html,
    })
