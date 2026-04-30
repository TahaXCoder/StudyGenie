import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.cloudflare import get_embeddings, search_vectors, stream_chat
import os
import requests
import time

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

RAG_SYSTEM_PROMPT = """You are StudyGenie, an intelligent AI study assistant designed to help students master their course materials.

GENERAL GUIDELINES:
1. If the user greets you (e.g., "Hi", "Hello"), greet them back warmly and explain how you can help (uploading docs, summarizing, quizzes, etc.).
2. You can talk about your own features: You can summarize PDFs, generate quizzes, create flashcards, and explain complex topics from study materials.
3. For study-related questions, prioritize the provided context documents.

CONTEXT-BASED RULES:
Context information is provided below between the dashed lines.
---------------------
{context}
---------------------

If the user's question is about study material and the answer is NOT in the context, politely explain that you don't have that specific information in the uploaded documents yet, but offer to help with other topics or general knowledge if appropriate.
Always maintain a helpful, encouraging, and educational tone.
"""

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Handles chat queries using RAG. Streams the response back to the client.
    """
    try:
        # 1. Embed query and search Vectorize
        query_embedding = get_embeddings([request.query])[0]
        matches = search_vectors(query_embedding, top_k=3)
        
        # 2. Extract sources and build context
        sources = set()
        context_parts = []
        
        for match in matches:
            meta = match.get("metadata", {})
            source_name = meta.get("source", "Unknown Document")
            text = meta.get("text", "")
            
            sources.add(source_name)
            context_parts.append(f"[Source: {source_name}]\n{text}\n")
            
        formatted_context = "\n".join(context_parts)
        
        # 3. Build prompt messages
        system_content = RAG_SYSTEM_PROMPT.replace("{context}", formatted_context)
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": request.query}
        ]
        
        print(f"DEBUG: Sending to Cloudflare: {messages}")
        
        # 4. Stream response from Cloudflare
        cf_response = stream_chat(messages)
        print(f"DEBUG: Cloudflare Response Status: {cf_response.status_code}")
        
        async def event_generator():
            # First, send the sources so the frontend can display them instantly
            sources_event = {
                "type": "sources",
                "sources": list(sources)
            }
            yield f"data: {json.dumps(sources_event)}\n\n"
            
            # Then, stream the DeepSeek text chunks
            for line in cf_response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    # Pass the Cloudflare SSE format directly to the client
                    yield f"{decoded_line}\n\n"
                    
        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/reset-index")
async def reset_index():
    """
    Deletes and recreates the Vectorize index to clear all sources.
    """
    CF_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
    CF_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    INDEX_NAME = os.getenv("VECTORIZE_INDEX_NAME", "studygenie-index")
    
    headers = {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        # 1. Delete index
        delete_url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/vectorize/v2/indexes/{INDEX_NAME}"
        requests.delete(delete_url, headers=headers)
        
        # 2. Wait
        time.sleep(2)
        
        # 3. Recreate index
        create_url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/vectorize/v2/indexes"
        payload = {
            "name": INDEX_NAME,
            "config": {
                "dimensions": 768,
                "metric": "cosine"
            }
        }
        requests.post(create_url, headers=headers, json=payload)
        
        return {"status": "success", "message": "Index reset successfully. All sources cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset index: {str(e)}")
