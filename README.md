# AI-Powered Disaster Intelligence & Response System

## Project Purpose
A college hackathon project to build an intelligent disaster management system that helps users report disasters, receive alerts, and coordinate emergency response. Focused on **India** with **Sikkim** as the initial pilot region.

## Current Phase
**Phase 4B Complete** - Firebase Storage + Disaster Report Images

### Completed Phases
- **Phase 1** - Project Foundation (React + Vite frontend, FastAPI backend)
- **Phase 2A** - Frontend Application Shell (6 pages, responsive layout, navigation)
- **Phase 2B** - UI Polish & Consistency (dashboard, theming, SOS page, alerts, safety info)
- **Phase 3A** - Functional Disaster Reporting (localStorage, offline queue, global state)
- **Phase 3B** - Emergency SOS (hold-to-activate, GPS, offline queue, 112 integration)
- **Phase 4A** - Firebase Firestore Foundation (incident sync, real-time updates, offline fallback)
- **Phase 4B** - Firebase Storage + Disaster Report Images (image upload, validation, offline handling)

## Technology Stack
- **Frontend**: React 19 + Vite 8 + React Router 6 + Bootstrap 5.3
- **State**: React Context (IncidentContext, ThemeContext) + localStorage
- **Backend**: Python + FastAPI + Uvicorn
- **Database**: Firebase Firestore (real-time) + localStorage fallback
- **Storage**: Firebase Storage (images) + localStorage fallback
- **Linting**: Oxlint
- **Build**: Vite 8 (Rolldown)

## Project Structure
```
disaster-management/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Reusable UI components (Button, Card, Badge, etc.)
│   │   ├── context/          # React Context providers (IncidentContext, ThemeContext)
│   │   ├── pages/            # Page components (Home, Report, Map, Alerts, Safety, SOS)
│   │   ├── services/         # Firebase services (firebase.js, firestore.js, storage.js)
│   │   ├── App.jsx           # App routes
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles (Bootstrap + custom CSS variables)
│   ├── public/
│   ├── .env.example          # Firebase config template
│   ├── storage.rules         # Firebase Storage rules (DEVELOPMENT ONLY)
│   ├── package.json
│   └── vite.config.js
├── backend/                  # FastAPI application
│   ├── app/
│   │   └── main.py           # FastAPI app with /api/health endpoint
│   ├── requirements.txt
│   └── .venv/                # Python virtual environment (ignored by git)
├── .gitignore
├── .env.example              # Root env template
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

## Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database** (Native mode) and **Storage**
3. Add a Web App to get config values
4. Copy `frontend/.env.example` to `frontend/.env` and fill in:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. Deploy Firestore rules (see `firestore.rules`) and Storage rules (`storage.rules`)

## Frontend Pages & Features
| Page | Route | Key Features |
|------|-------|--------------|
| **Dashboard** | `/` | Active incidents, risk forecasts, priority zones, stats cards |
| **Report Incident** | `/report` | 5-step wizard, GPS coords, image upload (5MB, JPEG/PNG/WebP/HEIC), offline queue |
| **Incident Map** | `/map` | Filter sidebar (type/severity/time), legend, placeholder for Phase 3 map |
| **Alerts** | `/alerts` | Official + citizen reports, severity filter, expandable details, channel status |
| **Safety Info** | `/safety` | Category nav, hazard guides (Before/During/After), emergency contacts |
| **Emergency SOS** | `/sos` | Hold-to-activate, 3s countdown, GPS capture, CRITICAL incident, 112 call button |

## Key Features Implemented
- **Theme Toggle**: Light/Dark mode with `localStorage` persistence, respects system preference
- **Incident Context**: Global state with Firestore real-time sync + localStorage fallback
- **Offline Support**: Incident queue, pending sync on reconnect, no false delivery claims
- **SOS System**: Hold 0.5s → 3s countdown → auto GPS → CRITICAL incident → 112 call button
- **Image Upload**: 5 MB limit, JPEG/PNG/WebP/HEIC, preview, `incidents/{incidentId}/` path
- **India/Sikkim Focus**: Emergency number **112**, Sikkim locations, demo incidents in Sikkim

## Current API Endpoints
- `GET /api/health` - Returns `{"status": "ok"}`

## Verification
```bash
# Frontend
cd frontend
npm run lint      # Passes (only pre-existing warnings)
npm run build     # Passes (~622 kB JS, ~278 kB CSS gzipped)

# Backend
cd backend
uvicorn app.main:app --reload
# /api/health returns {"status": "ok"}
```

## Current Limitations (Not Yet Implemented)
- AI analysis / Machine learning (Phase 5+)
- Landslide / risk prediction
- Resource optimization
- Interactive map with clustering (Phase 3)
- Push notifications / SMS / Email alerts
- Firebase Authentication
- Weather APIs integration
- Admin/authority dashboard
- Production deployment
- Satellite communication (future scope note in SOS)

## Firebase Rules (Development Only)
### Firestore (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /incidents/{document} {
      allow read, write: if true; // DEVELOPMENT ONLY
    }
  }
}
```

### Storage (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /incidents/{incidentId}/{fileName} {
      allow read: if true;
      allow write: if request.resource.contentType.matches('image/(jpeg|png|webp|heic|heif)')
        && request.resource.size <= 5 * 1024 * 1024
        && request.resource.name.matches('^img_[0-9]+_[a-z0-9]+\\.(jpg|jpeg|png|webp|heic|heif)$');
    }
  }
}
```

> ⚠️ **WARNING**: These rules are **DEVELOPMENT ONLY**. Production rules must require authentication, validate ownership, implement quotas, and restrict access by user/role.