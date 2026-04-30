import os
import requests
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
logger = logging.getLogger(__name__)

CF_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CF_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
VECTORIZE_INDEX = os.getenv("VECTORIZE_INDEX_NAME", "studygenie-index")

EMBED_MODEL = "@cf/baai/bge-base-en-v1.5"
CHAT_MODEL = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b"

def get_headers():
    return {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json"
    }

def get_embeddings(texts: list) -> list:
    """Get embeddings from Cloudflare Workers AI"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/{EMBED_MODEL}"
    response = requests.post(url, headers=get_headers(), json={"text": texts})
    response.raise_for_status()
    return response.json()["result"]["data"]

import json

def insert_vectors(vectors: list):
    """Insert vectors into Cloudflare Vectorize"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/vectorize/v2/indexes/{VECTORIZE_INDEX}/insert"
    
    # Cloudflare NDJSON requires a trailing newline
    ndjson_data = "\n".join([json.dumps(v) for v in vectors]) + "\n"
    
    headers = {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/x-ndjson"
    }
    
    response = requests.post(url, headers=headers, data=ndjson_data)
    if response.status_code != 200:
        logger.error(f"Vectorize Insert Error: {response.text}")
    response.raise_for_status()
    return response.json()

def search_vectors(query_vector: list, top_k: int = 5):
    """Search Cloudflare Vectorize"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/vectorize/v2/indexes/{VECTORIZE_INDEX}/query"
    payload = {
        "vector": query_vector,
        "topK": top_k,
        "returnMetadata": "all"
    }
    response = requests.post(url, headers=get_headers(), json=payload)
    if response.status_code != 200:
        logger.error(f"Vectorize Query Error: {response.text}")
    response.raise_for_status()
    return response.json().get("result", {}).get("matches", [])

def stream_chat(messages: list):
    """Stream chat response from Cloudflare Workers AI"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/{CHAT_MODEL}"
    payload = {
        "messages": messages,
        "max_tokens": 1024,
        "stream": True
    }
    response = requests.post(url, headers=get_headers(), json=payload, stream=True)
    response.raise_for_status()
    return response
