import os
import requests
from dotenv import load_dotenv

load_dotenv()

CF_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CF_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
INDEX_NAME = "studygenie-index"

def create_vectorize_index():
    print(f"Creating Vectorize Index: '{INDEX_NAME}'...")
    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/vectorize/v2/indexes"
    
    headers = {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # We use 768 dimensions for bge-base-en-v1.5
    payload = {
        "name": INDEX_NAME,
        "config": {
            "dimensions": 768,
            "metric": "cosine"
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code in [200, 201]:
        print("✅ Index created successfully!")
        print(response.json())
    elif response.status_code == 400 and "already exists" in response.text.lower():
        print("✅ Index already exists! You're good to go.")
    else:
        print(f"❌ Failed to create index. Status: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    create_vectorize_index()
