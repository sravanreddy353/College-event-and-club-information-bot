# College Event and Club Information Bot

The existing React website is in `frontend/`. The FastAPI backend reads official
college `.txt` and text-based `.pdf` records from `backend/documents/`, indexes
them in persistent ChromaDB with its local MiniLM sentence embedding model, and
searches KARE's official site and indexed web results for every question. Local
records and retrieved web-page text/snippets are combined before Gemini answers.
Answers show clickable web links and local document citations. Official KARE
sources are prioritized and labeled separately from third-party sources. The
Gemini and optional Brave Search keys are only read by the backend.

## 1. Add your college records

Put official, current college documents in `backend/documents/`. Supported
formats are UTF-8 `.txt` and text-based `.pdf`. Scanned PDFs need OCR before
they can be searched. The five current event, club, workshop, seminar, and
competition TXT files are explicitly labeled fictional demo data, not real
college announcements. Replace them with verified records when ready.

The backend checks this folder when it starts. To process additions, changes, or
removals while it is running, call `POST /ingest`. Unchanged documents are
skipped; only new or changed chunks are embedded. Numbered activity records are
kept together in chunks, and fictional demo records are labeled as such in
answers. Empty or invalid UTF-8 text files are reported instead of silently
being indexed. The same local MiniLM
embedding function is used for indexing and search. Its first use downloads the
model (about 80 MB), so it needs an internet connection and may take longer than
later starts. ChromaDB persists its index in `backend/.chromadb/`.

## 2. Configure and run the backend

From the project root in PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `backend/.env` and replace `GEMINI_API_KEY` with your key from Google AI
Studio. KARE's official WordPress search runs without an API key. To add
third-party indexed web results, set `BRAVE_SEARCH_API_KEY` to your Brave Search
API subscription token; without it, the backend tries public Yahoo and Bing
search results. Search results are read from public HTTP(S) pages; inaccessible
pages may still contribute indexed snippets. Search engine access/rate limits
vary by network. Keep all keys in the backend only; do not put them in React or
commit the `.env` file.

Start the API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Check `http://127.0.0.1:8000/health` for API status, whether Gemini is
configured, and how many document chunks are indexed.

After adding or updating files while the API is running, process the folder with
this PowerShell command:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8000/ingest | ConvertTo-Json -Depth 4
```

The response reports processed and unchanged files, chunk changes, and any
document extraction failures. `/chat` searches the web and local index for each
question, returns clickable source URLs, and explains when the requested
information could not be verified.

## 3. Run the website

In a second PowerShell window, from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The
homepage's **Chat with Student Friendly Bot** button opens the live chat window.
The frontend uses `http://127.0.0.1:8000` by default. To change it, copy
`frontend/.env.example` to `frontend/.env.local`, set `VITE_API_BASE_URL`, and
restart Vite.

## 4. Deploy the chatbot

The Vercel website sends production `/api/*` requests through a rewrite to the
backend at `https://kare-student-information-api.vercel.app`. Deploy the API as
a separate Vercel project from this same GitHub repository, with the project
name `kare-student-information-api` and root directory `backend/`. Vercel
detects the FastAPI application in `main.py`; `backend/vercel.json` includes
the college documents and allows up to 60 seconds for web search.

The API uses the in-memory document collection on Vercel because serverless
filesystems are not persistent. Keep `GEMINI_API_KEY` and optional
`BRAVE_SEARCH_API_KEY` in the API project's environment variables only; without
a Gemini key, the API still returns labeled extracts from verified local and
web sources.

## What the main files do

- `frontend/src/components/ChatAssistant.jsx`: chat dialog, suggestions,
  conversation history, loading state, and requests to the backend.
- `frontend/src/pages/HomePage.jsx`: opens the chat from the existing homepage
  button.
- `frontend/src/pages/WorkshopsPage.jsx` and
  `frontend/src/pages/CompetitionsPage.jsx`: category pages for campus activities.
- `frontend/src/pages/AssistantPage.jsx`: dedicated full-page chat experience.
- `backend/main.py`: `/ingest`, document extraction and page-aware chunking,
  incremental ChromaDB indexing/retrieval, live web search and page extraction,
  `/chat`, and Gemini generation.
- `backend/requirements.txt`: Python packages used by the API and RAG pipeline.
- `backend/.env.example`: backend configuration template (copy to `.env`).
- `backend/documents/`: add the college records the assistant is allowed to use.

If a question cannot be verified from local records or web search, the API says
so and points students to the official KARE website rather than inventing an
answer. Without a Gemini key, the backend returns clearly labeled excerpts from
the retrieved sources.
