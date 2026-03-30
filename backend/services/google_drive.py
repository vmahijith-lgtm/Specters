"""
Creates a Google Drive .tex file for each tailored resume and returns a direct download URL.
Uses the user's stored OAuth tokens.
"""
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from config import settings
import io

def _build_creds(tokens: dict) -> Credentials:
    creds = Credentials(
        token=tokens.get("access_token"),
        refresh_token=tokens.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds

def create_resume_doc(title: str, content: str, tokens: dict) -> str:
    """Creates a .tex file in Google Drive, makes it publicly readable. Returns a direct download URL."""
    creds = _build_creds(tokens)
    drive = build("drive", "v3", credentials=creds)

    if not title.endswith(".tex"):
        title += ".tex"

    file_metadata = {
        "name": title,
        "mimeType": "application/x-tex"
    }

    media = MediaIoBaseUpload(
        io.BytesIO(content.encode("utf-8")), 
        mimetype="application/x-tex", 
        resumable=True
    )

    file = drive.files().create(
        body=file_metadata, 
        media_body=media, 
        fields="id"
    ).execute()
    file_id = file.get("id")

    # Set anyone-with-link can read
    drive.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return f"https://drive.google.com/uc?export=download&id={file_id}"
