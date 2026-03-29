"""Google OAuth flow for Drive access."""
import json, base64, hashlib, secrets
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from config import settings
from database import supabase

router = APIRouter()
SCOPES = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/documents"]

def _make_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id":     settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uris": [settings.google_redirect_uri],
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )

def _gen_pkce() -> tuple[str, str]:
    """Generate a PKCE code_verifier and code_challenge (S256)."""
    verifier = secrets.token_urlsafe(48)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge

def _encode_state(user_id: str, verifier: str) -> str:
    payload = json.dumps({"u": user_id, "v": verifier})
    return base64.urlsafe_b64encode(payload.encode()).decode()

def _decode_state(state: str) -> tuple[str, str]:
    # Add padding if needed
    payload = json.loads(base64.urlsafe_b64decode(state + "==").decode())
    return payload["u"], payload["v"]

@router.get("/google/login")
def google_login(user_id: str):
    flow = _make_flow()
    verifier, challenge = _gen_pkce()
    encoded_state = _encode_state(user_id, verifier)

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        state=encoded_state,
        code_challenge=challenge,
        code_challenge_method="S256",
    )
    return RedirectResponse(auth_url)

@router.get("/google/callback")
def google_callback(code: str, state: str):
    try:
        user_id, verifier = _decode_state(state)
        flow = _make_flow()
        flow.fetch_token(code=code, code_verifier=verifier)
        creds = flow.credentials
        tokens = {
            "access_token":  creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri":     creds.token_uri,
            "client_id":     creds.client_id,
            "client_secret": creds.client_secret,
        }
        supabase.table("profiles").update({"google_tokens": tokens}).eq("id", user_id).execute()
        return RedirectResponse("http://localhost:3000/settings?google=connected")
    except Exception as e:
        print(f"[google_callback] Error: {e}")
        return RedirectResponse(f"http://localhost:3000/settings?google=error&reason={str(e)[:120]}")
