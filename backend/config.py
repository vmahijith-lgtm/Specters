from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    resend_api_key: str
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    firebase_service_account_path: str = "./firebase-service-account.json"
    cron_secret: str = "change_me"
    github_token: str = ""

    class Config:
        env_file = "../.env"
        extra = "ignore"

settings = Settings()
