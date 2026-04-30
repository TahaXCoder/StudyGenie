import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Cloudflare / Workers AI settings
CF_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
CF_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()
CF_API_BASE = os.getenv("CF_API_BASE", "").strip() or (
	f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}"
)

# Default models
WORKERS_AI_MODEL = os.getenv("WORKERS_AI_MODEL", "gpt-4o-mini")
EMBEDDINGS_MODEL = os.getenv("EMBEDDINGS_MODEL", "text-embedding-3-small")

# Vector namespace (optional)
VECTOR_NAMESPACE = os.getenv("VECTOR_NAMESPACE", "studygenie")

# Timeout for HTTP calls (seconds)
HTTP_TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "30"))


def cf_headers():
	"""Return authorization headers for Cloudflare API calls."""
	headers = {"Content-Type": "application/json"}
	if CF_API_TOKEN:
		headers["Authorization"] = f"Bearer {CF_API_TOKEN}"
	return headers
