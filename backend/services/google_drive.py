"""
Creates a Google Doc for each tailored resume and returns a shareable URL.
Uses the user's stored OAuth tokens.
"""
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from config import settings
import json

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
    """Creates a Google Doc, writes content, makes it publicly readable. Returns share URL."""
    creds = _build_creds(tokens)
    docs  = build("docs",  "v1", credentials=creds)
    drive = build("drive", "v3", credentials=creds)

    # Create blank doc
    doc = docs.documents().create(body={"title": title}).execute()
    doc_id = doc["documentId"]

    # Insert text
    docs.documents().batchUpdate(
        documentId=doc_id,
        body={"requests": [{
            "insertText": {"location": {"index": 1}, "text": content}
        }]}
    ).execute()

    # Set anyone-with-link can read
    drive.permissions().create(
        fileId=doc_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return f"https://docs.google.com/document/d/{doc_id}/edit"
