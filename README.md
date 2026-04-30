# StudyGenie

StudyGenie is a full-stack study assistant that lets you upload learning materials and use AI-powered tools to chat, summarize, generate quizzes, flashcards, and study plans.

## Features

- Upload documents and index them for retrieval
- Chat Q&A over your materials
- Summaries, quizzes, flashcards, and study plan generation
- Progress and weak-topic support endpoints

## Tech Stack

- Frontend: React, Vite, Axios, Radix UI, Framer Motion
- Backend: FastAPI, LangChain, SQLAlchemy
- Vector store: Cloudflare Vectorize (default), optional ChromaDB
- Utilities: PDF/Doc/PPT ingestion, OCR, embeddings

## RAG Architecture (Modular RAG)

1. Ingestion: extract text in memory from uploads
2. Chunking: recursive splitter with overlap
3. Embeddings: generate vectors per chunk
4. Indexing: insert into Cloudflare Vectorize
5. Retrieval: top-k vector search
6. Generation: build context-augmented prompt and stream response

## Models

- LLM (Cloudflare Workers AI): `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`
- Embeddings: `@cf/baai/bge-base-en-v1.5`

These defaults can be changed via environment variables in `.env`.

## Project Structure

```
backend/        FastAPI app and AI features
frontend/       React UI (Vite)
data/           Local data (ignored by git)
tests/          Backend tests
```

## Prerequisites

- Node.js 18+
- Python 3.10+

## Environment Variables

Copy the example file and fill in values:

```
copy .env.example .env
```

Key variables:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VECTORIZE_INDEX_NAME`
- `WORKERS_AI_MODEL`
- `EMBEDDINGS_MODEL`
- `CHROMA_DB_PATH`
- `SQLITE_DB_PATH`
- `UPLOAD_DIR`

## Setup

### Backend

```
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```

### Frontend

```
cd frontend
npm install
```

### Run Development Servers

From the repo root:

```
npm install
npm run dev
```

This runs the frontend on Vite and the backend on FastAPI (default `http://localhost:8000`).

## Tests

```
python -m pytest
```

## Notes

- The frontend API base URL is set in `frontend/src/services/api.js`.
- The `data/` folder is local-only and ignored by git.

## License

MIT
