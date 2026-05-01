from fastapi import APIRouter, UploadFile, File, HTTPException, Request
import uuid

from backend.services.extractor import extract_text_from_bytes, chunk_text
from backend.services.cloudflare import get_embeddings, insert_vectors

router = APIRouter()

@router.post("/upload")
async def upload_document(request: Request, file: UploadFile = File(...)):
    """
    Receives a file upload, extracts text in memory, 
    and inserts it directly into Cloudflare Vectorize.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    try:
        # 1. Read file into memory
        file_bytes = await file.read()
        
        # 2. Extract text (no local disk saving!)
        text = extract_text_from_bytes(file_bytes, file.filename)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the file.")
            
        # 3. Chunk text
        chunks = chunk_text(text, source_name=file.filename)
        
        # 4. Process in batches for Cloudflare Vectorize
        batch_size = 20
        total_inserted = 0
        
        for i in range(0, len(chunks), batch_size):
            if await request.is_disconnected():
                print("Client disconnected, stopping embedding generation.")
                break
                
            batch = chunks[i:i+batch_size]
            batch_texts = [c["text"] for c in batch]
            
            # Get embeddings from Cloudflare
            embeddings = get_embeddings(batch_texts)
            
            # Format vectors for Vectorize insert
            vectors = []
            for j, (chunk_data, embedding) in enumerate(zip(batch, embeddings)):
                # Vectorize IDs must be alphanumeric, underscores, or hyphens only
                import re
                safe_filename = re.sub(r'[^a-zA-Z0-9_\-]', '_', file.filename)
                
                vectors.append({
                    "id": f"{safe_filename}_{uuid.uuid4().hex[:8]}",
                    "values": embedding,
                    "metadata": {
                        "text": chunk_data["text"],
                        "source": chunk_data["source"]
                    }
                })
                
            # Insert into Vectorize
            insert_vectors(vectors)
            total_inserted += len(vectors)
            
        return {
            "status": "success", 
            "message": f"Successfully indexed {total_inserted} chunks from {file.filename}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
