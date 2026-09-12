# AI-Powered Disaster Intelligence & Response System

## Project Purpose
A college hackathon project to build an intelligent disaster management system that helps users report disasters, receive alerts, and coordinate emergency response.

## Current Phase
**Phase 1** - Project Foundation (this phase only sets up the development environment)

## Technology Stack
- **Frontend**: React + Vite (JavaScript)
- **Backend**: Python + FastAPI + Uvicorn
- **Version Control**: Git

## Project Structure
```
disaster-management/
├── frontend/          # React + Vite application
├── backend/           # FastAPI application
│   ├── app/
│   │   └── main.py    # FastAPI app with /api/health endpoint
│   ├── requirements.txt
│   └── .venv/         # Python virtual environment (ignored by git)
├── .gitignore
├── .env.example
└── README.md
```

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`

## Backend Setup
```bash
cd backend
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend will be available at `http://127.0.0.1:8000`
API documentation at `http://127.0.0.1:8000/docs`

## Current API Endpoints
- `GET /api/health` - Returns `{"status": "ok"}`

## Current Limitations
This is **Phase 1 only** - the project foundation. The following are **NOT yet implemented** and will be added in later phases:
- Disaster reporting
- Emergency SOS
- AI analysis / Machine learning
- Landslide / risk prediction
- Resource optimization
- Disaster map / heatmap
- Alerts & notifications
- Firebase authentication
- Weather APIs
- Admin/authority dashboard
- Production deployment

## Verification
- Frontend: `npm run build` completes successfully
- Backend: `uvicorn app.main:app` starts and `/api/health` returns `{"status": "ok"}`