import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_upload():
    print("Testing /api/upload...")
    with open("sample_study_doc.txt", "rb") as f:
        files = {"file": ("sample_study_doc.txt", f, "text/plain")}
        response = requests.post(f"{BASE_URL}/upload", files=files)
        
    print(f"Upload Status Code: {response.status_code}")
    try:
        print(f"Upload Response: {response.json()}")
    except:
        print(f"Upload Raw Text: {response.text}")
        
    return response.status_code == 200

def test_chat():
    print("\nTesting /api/chat...")
    payload = {"query": "What is StudyGenie?"}
    
    # We use stream=True to handle the SSE streaming response
    response = requests.post(f"{BASE_URL}/chat", json=payload, stream=True)
    print(f"Chat Status Code: {response.status_code}")
    
    print("\n--- Streaming Response ---")
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            if decoded_line.startswith("data: "):
                try:
                    data = json.loads(decoded_line[6:])
                    if "sources" in data:
                        print(f"[METADATA] Sources found: {data['sources']}")
                except:
                    print(decoded_line)
            else:
                print(decoded_line)
    print("\n--------------------------")

if __name__ == "__main__":
    if test_upload():
        test_chat()
