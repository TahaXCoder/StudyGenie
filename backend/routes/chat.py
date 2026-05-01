import json
import sys
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.cloudflare import get_embeddings, search_vectors, stream_chat
import os
import requests
import time

router = APIRouter()

def _safe_for_console(value: str) -> str:
    encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
    try:
        return value.encode(encoding, errors="backslashreplace").decode(
            encoding, errors="backslashreplace"
        )
    except Exception:
        return value.encode("utf-8", errors="backslashreplace").decode("utf-8")

class ChatRequest(BaseModel):
    query: str

RAG_SYSTEM_PROMPT = """You are StudyGenie, a professional and helpful AI study assistant. Your goal is to provide accurate, educational, and concise answers based on the provided study materials.

STRICT INSTRUCTIONS:
1. ALWAYS check the CONTEXT DOCUMENTS below first. If there is context, use it to answer!
2. If the user asks to "summarize", "explain", or "analyze", use the provided context to do so.
3. If the user greets you ("Hi"), greet them back but remind them you've processed their documents and are ready to help with them.
4. If you absolutely cannot find the answer in the context, then and only then explain that the information is missing.

CONTEXT DOCUMENTS:
---------------------
{context}
---------------------

Based on the above documents, please answer the following student query:"""

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Handles chat queries using RAG. Streams the response back to the client.
    """
    try:
        # 1. Embed query and search Vectorize
        query_embedding = get_embeddings([request.query])[0]
        
        try:
            matches = search_vectors(query_embedding, top_k=5)
        except Exception as vec_err:
            print(f"DEBUG: Vector Search Error: {str(vec_err)}")
            # If index is deleted or missing, we just proceed with empty context
            matches = []
        
        print(f"DEBUG: Vector search found {len(matches)} matches")
        
        # 2. Extract sources and build context
        sources = set()
        context_parts = []
        
        for i, match in enumerate(matches):
            score = match.get("score", 0)
            # Relaxed threshold to 0.2 to ensure context is picked up
            if score < 0.2:
                print(f"DEBUG: Skipping match {i+1} due to very low score: {score:.4f}")
                continue
                
            meta = match.get("metadata", {})
            source_name = meta.get("source", "Unknown Document")
            text = meta.get("text", "")

            safe_source_name = _safe_for_console(str(source_name))
            safe_preview = _safe_for_console(str(text[:50]))
            print(
                f"DEBUG: Match {i+1} [Score: {score:.4f}] from {safe_source_name}: {safe_preview}..."
            )
            
            sources.add(source_name)
            context_parts.append(f"[Source: {source_name}]\n{text}\n")
            
        formatted_context = "\n".join(context_parts)
        
        # 3. Build prompt messages
        system_content = RAG_SYSTEM_PROMPT.replace("{context}", formatted_context)
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": request.query}
        ]
        
        safe_messages = _safe_for_console(str(messages))
        print(f"DEBUG: Sending to Cloudflare: {safe_messages}")
        
        # 4. Async Stream response from Cloudflare
        from backend.services.cloudflare import async_stream_chat, CF_ACCOUNT_ID, CF_API_TOKEN
        
        if not CF_ACCOUNT_ID or not CF_API_TOKEN:
             print("DEBUG: ERROR - Cloudflare credentials missing!")
             raise HTTPException(status_code=500, detail="Cloudflare credentials missing in .env")

        print(f"DEBUG: Preparing messages for Cloudflare...")
        
        async def event_generator():
            # First, send the sources
            sources_event = {"type": "sources", "sources": list(sources)}
            yield f"data: {json.dumps(sources_event)}\n\n"
            
            try:
                import httpx
                from backend.services.cloudflare import async_stream_chat
                
                # We manage the client lifecycle here
                async with httpx.AsyncClient(timeout=60.0) as client:
                    stream_ctx = await async_stream_chat(client, messages)
                    async with stream_ctx as response:
                        if response.status_code != 200:
                            err_text = await response.aread()
                            print(f"DEBUG: Cloudflare API Error: {err_text.decode()}")
                            yield f"data: {json.dumps({'error': f'Cloudflare AI Error: {err_text.decode()}'})}\n\n"
                            return

                        async for line in response.aiter_lines():
                            if line:
                                yield f"{line}\n\n"
            except Exception as stream_err:
                import traceback
                print(f"DEBUG: Streaming Exception: {str(stream_err)}")
                print(traceback.format_exc())
                yield f"data: {json.dumps({'error': str(stream_err)})}\n\n"
                    
        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    except Exception as e:
        import traceback
        print("DEBUG: !!! CRITICAL ENDPOINT ERROR !!!")
        print(traceback.format_exc())
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
        requests.delete(delete_url, headers=headers, timeout=10)
        
        # 2. Wait for propagation
        print(f"DEBUG: Index {INDEX_NAME} deletion requested. Waiting...")
        time.sleep(5) 
        
        # 3. Recreate index
        create_url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/vectorize/v2/indexes"
        payload = {
            "name": INDEX_NAME,
            "config": {
                "dimensions": 768,
                "metric": "cosine"
            }
        }
        requests.post(create_url, headers=headers, json=payload, timeout=10)
        print(f"DEBUG: Index {INDEX_NAME} recreation requested.")
        
        return {"status": "success", "message": "Index reset requested. Please wait a few seconds before uploading."}
    except Exception as e:
        print(f"DEBUG: Reset Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reset index: {str(e)}")
