# AI-Powered Disaster Intelligence & Response System

## Project Purpose
A college hackathon project to build an intelligent disaster management system that helps users report disasters, receive alerts, and coordinate emergency response. Focused on **India** with **Sikkim** as the initial pilot region.

Frontend is called **Disastell Dashboard**. Backend is **Disaster Intelligence API** (`v0.6.0` in `backend/app/main.py`).

## Current Phase
**Phase 6A Complete** - Landslide Risk Model Foundation + API Integration

### Completed Phases
- **Phase 1** - Project Foundation (React + Vite frontend, FastAPI backend)
- **Phase 2A** - Frontend Application Shell (6 pages, responsive layout, navigation)
- **Phase 2B** - UI Polish & Consistency (dashboard, theming, SOS page, alerts, safety info)
- **Phase 3A** - Functional Disaster Reporting (localStorage, offline queue, global state)
- **Phase 3B** - Emergency SOS (hold-to-activate, GPS, offline queue, 112 integration)
- **Phase 4A** - Firebase Firestore Foundation (incident sync, real-time updates, offline fallback)
- **Phase 4B** - Firebase Storage + Disaster Report Images (image upload, validation, offline handling)
- **Phase 5A** - Incident AI Foundation (schemas, provider interface, demo provider, validation)
- **Phase 5B** - Incident AI API Integration (`POST /api/ai/analyze-incident`, `GET /api/ai/providers`, `GET /api/ai/health`)
- **Phase 6A** - Landslide Risk Foundation + API (`app/ai/landslide/` + `/api/ai/landslide/*`: single/batch predict, health, model-info, RF + demo models, preprocessor, trainer, predictor, validator)

## Technology Stack
- **Frontend**: React 19.2 + Vite 8 + React Router 6.26 + Bootstrap 5.3 (`frontend/package.json`)
- **State**: React Context (`IncidentContext`, `ThemeContext`) + localStorage
- **Backend**: Python + FastAPI 0.141.1 + Uvicorn 0.52.4 + Pydantic 2.13.5
- **Database**: Firebase Firestore (real-time) + localStorage fallback
- **Storage**: Firebase Storage (images) + localStorage fallback
- **ML/AI**: scikit-learn >=1.5, numpy >=1.26, scipy >=1.13, joblib >=1.4, pandas (used by `app/ai/landslide/data/loader.py`, `preprocessing/processor.py`, `training/trainer.py`)
- **Image preprocessing**: interface + mock only (`app/ai/preprocessing/image.py`)
- **Linting**: Oxlint (`npm run lint`)
- **Build**: Vite 8
- **Testing**: pytest + pytest-asyncio + pytest-cov (backend)

## Project Structure
```
disaster-management/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Layout, Header, Footer + ui/ (Button, Card, Badge, FormField, StatsCard, EmptyState)
│   │   ├── context/          # IncidentContext.jsx, ThemeContext.jsx
│   │   ├── pages/            # Home.jsx, ReportDisaster.jsx, DisasterMap.jsx (preview), Alerts.jsx, SafetyInfo.jsx, EmergencySOS.jsx (+ .css)
│   │   ├── services/         # firebase.js, firestore.js, storage.js
│   │   ├── App.jsx           # 5 routes under <Layout /> (see below)
│   │   ├── App.css
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles (Bootstrap + custom CSS variables)
│   ├── index.html
│   ├── .env.example          # VITE_FIREBASE_* template
│   ├── storage.rules         # Firebase Storage rules (DEVELOPMENT ONLY)
│   ├── package.json
│   └── vite.config.js        # @vitejs/plugin-react
├── backend/                  # FastAPI application (version 0.6.0)
│   ├── app/
│   │   ├── main.py           # FastAPI app + CORS (5173) + ai_router + landslide_router + GET /api/health
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── ai.py                 # Phase 5B: POST /api/ai/analyze-incident, GET /api/ai/providers, GET /api/ai/health
│   │   │   ├── landslide.py          # Phase 6A: POST /api/ai/landslide/predict-risk, POST /predict-risk-batch, GET /health, GET /model-info
│   │   │   └── landslide_schemas.py  # LandslideRiskRequest/Response, Batch Request/Response wrappers
│   │   ├── ai/               # Incident AI + Landslide modules
│   │   │   ├── __init__.py   # Re-exports Phase 5A + 6A APIs
│   │   │   ├── config.py     # AIConfig (AI_DEFAULT_PROVIDER, AI_DEMO_ENABLED, AI_MIN_CONFIDENCE, etc.)
│   │   │   ├── schemas.py    # IncidentInput, IncidentAIResult, DisasterType, SeverityLevel
│   │   │   ├── models/
│   │   │   │   ├── base.py           # IncidentAIProvider abstract base
│   │   │   │   └── demo_provider.py  # DemoIncidentAIProvider (keyword-based, fixed 0.65 confidence, is_demo=True)
│   │   │   ├── preprocessing/
│   │   │   │   ├── text.py   # clean_text, extract_keywords, location extraction
│   │   │   │   └── image.py  # ImagePreprocessor interface + MockImagePreprocessor
│   │   │   ├── validation/
│   │   │   │   ├── input.py, severity.py, disaster_type.py, schema.py, confidence.py
│   │   │   ├── providers/
│   │   │   │   └── registry.py  # ProviderRegistry + get_registry() / get_provider() (demo default)
│   │   │   └── landslide/    # Phase 6A
│   │   │       ├── schemas.py      # LandslideInputFeatures, LandslideRiskResult, RiskCategory, SoilType, LandCover, Geology, batch/training schemas
│   │   │       ├── config.py       # LandslideConfig (LANDSLIDE_* env vars, RF params, thresholds, paths)
│   │   │       ├── data/loader.py  # LandslideDataLoader + create_synthetic_landslide_data() + split_data()
│   │   │       ├── preprocessing/processor.py  # LandslidePreprocessor (impute + scale + one-hot), derived features
│   │   │       ├── models/__init__.py  # RandomForestLandslideModel, DemoLandslideModel, GradientBoosting placeholder, Factory
│   │   │       ├── training/trainer.py # train_landslide_model(), evaluate_model(), cross_validate_model(), hyperparameter_tuning()
│   │   │       ├── inference/predictor.py  # LandslideRiskPredictor (single/batch, auto demo), create_predictor(), async wrappers
│   │   │       └── validation/validator.py # validate_landslide_input(), validate_risk_result(), get_risk_category_from_score(), sanitize_input_features()
│   ├── requirements.txt
│   ├── get-pip.py
│   └── .venv/                # Python virtual environment (ignored by git)
├── .gitignore
├── .env.example              # Root placeholder (VITE_API_URL, DATABASE_URL, FIREBASE_API_KEY, OPENWEATHER_API_KEY commented out)
└── README.md
```
> Note: repo root has no `firestore.rules` file — Firestore rules are documented below only. `frontend/storage.rules` is the only checked-in rules file. Old README references to `storage.rules` / `firestore.rules` at root are outdated.

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`

Backend CORS in `backend/app/main.py` allows `http://localhost:5173` and `http://127.0.0.1:5173`.

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

> `requirements.txt` currently pins FastAPI/uvicorn/pydantic/starlette and requires `scikit-learn`, `numpy`, `scipy`, `joblib`, `pytest*`. Landslide code also imports `pandas` — install it if missing: `pip install pandas`.

## Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database** (Native mode) and **Storage**
3. Add a Web App to get config values
4. Copy `frontend/.env.example` to `frontend/.env` and fill in:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. Deploy Storage rules (see `frontend/storage.rules`). Firestore rules are not checked in — create them in console (development example below).
6. App works without Firebase: `src/services/firebase.js` disables Firebase when env is incomplete and `IncidentContext.jsx` falls back to localStorage + 3 Sikkim demo incidents.

## Frontend Pages & Features
Actual routes in `frontend/src/App.jsx` (all under `Layout`):

| Page | Route | Key Features |
|------|-------|--------------|
| **Disastell Dashboard (Home)** | `/` | Active incidents, risk forecasts (static list), priority zones, stats cards, capabilities, coming-soon placeholders |
| **Report Incident** | `/report` | 6-step wizard (type → severity → location → details → AI analysis → contact), GPS coords, image upload (5MB, JPEG/PNG/WebP/HEIC), offline queue |
| **Disaster Map (Preview)** | `/map` | Simplified CSS preview plotting live incidents by severity; full interactive map (clustering, heat layers, live tracking) under **Future Updates** |
| **Alerts** | `/alerts` | Official + citizen reports, severity filter, expandable details, channel status |
| **Safety Info** | `/safety` | Category nav, hazard guides (Before/During/After), emergency contacts |
| **Emergency SOS** | `/sos` | Hold-to-activate, 3s countdown, GPS capture, CRITICAL incident, 112 call button |

There is no `/map` route despite older docs mentioning one.

## Key Features Implemented
- **Theme Toggle**: Light/Dark mode with `localStorage` persistence, respects system preference (`ThemeContext`)
- **Incident Context**: Global state with Firestore real-time sync + localStorage fallback (`IncidentContext.jsx`, `services/firestore.js`). Seeds 3 Sikkim demo incidents (`INC-DEMO-001/002/003`).
- **Offline Support**: Incident queue, pending sync on reconnect, no false delivery claims
- **SOS System**: Hold 0.5s → 3s countdown → auto GPS → CRITICAL incident → 112 call button (`EmergencySOS.jsx`)
- **Image Upload**: 5 MB limit, JPEG/PNG/WebP/HEIC/HEIF, preview, `incidents/{incidentId}/img_{ts}_{rand}.ext` path (`services/storage.js`, `frontend/storage.rules`)
- **Incident AI API** (Phase 5B): live FastAPI endpoints backed by provider registry (demo by default)
- **Landslide Risk API** (Phase 6A): single + batch prediction, validation, demo + trainable RandomForest, synthetic Sikkim data
- **India/Sikkim Focus**: Emergency number **112**, Sikkim locations, demo incidents in Sikkim, synthetic landslide lat 27–28 / lon 88–89

## Incident AI (Phase 5A Foundation + Phase 5B API)
**Status**: Pipeline + API complete, demo provider only - NO TRAINED MODELS YET

### Architecture
```
backend/app/ai/
├── schemas.py           # IncidentInput, IncidentAIResult, DisasterType, SeverityLevel
├── models/base.py       # IncidentAIProvider abstract base
├── models/demo_provider.py  # DEMO provider (keyword matching, fixed 0.65 confidence)
├── preprocessing/text.py    # clean_text, extract_keywords, location extraction
├── preprocessing/image.py   # ImagePreprocessor interface + mock (Phase 5B+)
├── validation/          # input, severity, disaster_type, schema, confidence (unit-testable)
├── providers/registry.py    # ProviderRegistry, get_registry(), get_provider()
└── config.py            # AIConfig with env var support
backend/app/api/ai.py    # FastAPI router (Phase 5B)
```

### Supported Disaster Types
- `flood`, `landslide`, `earthquake`, `fire`, `cyclone`, `storm`, `infrastructure_damage`, `other`

### Supported Severity Levels
- `critical`, `high`, `moderate`, `low`

### Component Status
| Component | Status |
|-----------|--------|
| Schemas (IncidentInput, IncidentAIResult) | ✅ Complete |
| Provider interface (IncidentAIProvider) | ✅ Complete |
| Demo provider (rule-based) | ✅ Complete |
| Text preprocessing | ✅ Complete |
| Image preprocessing interface | ✅ Interface + mock only |
| Validation utilities | ✅ Complete |
| Provider registry | ✅ Complete |
| Configuration | ✅ Complete |
| REST API (`/api/ai/*`) | ✅ Complete (Phase 5B) |
| **Trained ML models** | ❌ Not yet |
| **Image analysis models** | ❌ Not yet |

### Demo Provider
The `DemoIncidentAIProvider` is a **rule-based mock provider** that:
- Uses keyword matching for disaster type classification (`DISASTER_KEYWORDS`)
- Uses keyword + affected people count for severity (`>100→critical, >50→high, >10→moderate`)
- Returns fixed confidence of 0.65 (NOT from a trained model)
- Generates templated `infrastructure_impact`, `safety_assessment`, `recommended_actions`
- Clearly labeled with `is_demo=True`, `version="demo-v1"`
- **Never present outputs as real AI predictions**

### Incident AI Configuration
Environment variables (see `backend/app/ai/config.py`):
```bash
AI_DEFAULT_PROVIDER=demo
AI_DEMO_ENABLED=true
AI_MIN_CONFIDENCE=0.3
AI_HIGH_CONFIDENCE=0.75
AI_MAX_TEXT_LENGTH=4000
AI_MAX_IMAGE_MB=5
AI_REQUEST_TIMEOUT=30
AI_MODEL_PATH=
AI_MODEL_DEVICE=cpu
AI_ENABLE_IMAGE=false
AI_REALTIME=false
AI_LOG_LEVEL=INFO
AI_LOG_PREDICTIONS=false
```

### Testing the Incident AI API
```bash
# 1. Start backend, then:
curl -X POST http://127.0.0.1:8000/api/ai/analyze-incident \
  -H "Content-Type: application/json" \
  -d '{"description":"Heavy flooding in Rangpo area, water levels rising rapidly, 45 people affected","latitude":27.1767,"longitude":88.5333,"location_text":"Rangpo, East Sikkim","affected_people":45}'

curl http://127.0.0.1:8000/api/ai/providers
curl http://127.0.0.1:8000/api/ai/health
```
Direct provider test (no HTTP):
```bash
cd backend
source .venv/bin/activate
python -c "
from app.ai import get_provider
from app.ai.schemas import IncidentInput
import asyncio

async def test():
    provider = get_provider()
    print(f'Provider: {provider.name} v{provider.version}')
    print(f'Is demo: {provider.is_demo}')
    incident = IncidentInput(
        description='Heavy flooding in Rangpo area, water levels rising rapidly, 45 people affected',
        latitude=27.1767,
        longitude=88.5333,
        location_text='Rangpo, East Sikkim',
        affected_people=45
    )
    result = await provider.analyze(incident)
    print(f'Predicted type: {result.predicted_disaster_type}')
    print(f'Predicted severity: {result.predicted_severity}')
    print(f'Confidence: {result.confidence}')
    print(f'Is demo: {result.is_demo}')

asyncio.run(test())
"
```

### Validation Utilities (Unit-Testable)
```python
from app.ai.validation import (
    validate_incident_input,
    normalize_severity,
    normalize_disaster_type,
    validate_confidence,
    validate_incident_ai_result,
    interpret_confidence,
)
```

### AI Result Schema (compatible with Firestore Incident object)
```json
{
  "predictedDisasterType": "flood",
  "predictedSeverity": "high",
  "confidence": 0.65,
  "infrastructureImpact": "Roads, bridges at risk...",
  "safetyAssessment": "Evacuate immediately...",
  "affectedAreas": ["Rangpo", "Singtam"],
  "recommendedActions": ["Evacuate low-lying areas", "Call 112"],
  "modelVersion": "demo-v1",
  "processingTimeMs": 45,
  "isDemo": true
}
```

## Landslide Risk Model (Phase 6A)
**Status**: Foundation + API complete, demo mode by default - NO REAL TRAINED MODEL CHECKED IN

### Architecture
```
backend/app/ai/landslide/
├── schemas.py                 # LandslideInputFeatures, LandslideRiskResult, RiskCategory, SoilType, LandCover, Geology, batch/training schemas
├── config.py                  # LandslideConfig (all LANDSLIDE_* env vars)
├── data/loader.py             # LandslideDataLoader, create_synthetic_landslide_data(), load_landslide_dataset(), split_data()
├── preprocessing/processor.py # LandslidePreprocessor (median impute + StandardScaler + one-hot), derived features
├── models/__init__.py         # RandomForestLandslideModel (trainable), DemoLandslideModel (rule-based), GradientBoosting placeholder, Factory
├── training/trainer.py        # train_landslide_model(), evaluate_model(), cross_validate_model(), hyperparameter_tuning(), run_training_pipeline()
├── inference/predictor.py     # LandslideRiskPredictor (single/batch, auto-demo), LandslideRiskBatchProcessor, async wrappers
└── validation/validator.py    # validate_landslide_input(), validate_landslide_risk_result(), completeness, sanitize
backend/app/api/
├── landslide.py               # Router prefix /api/ai/landslide
└── landslide_schemas.py       # LandslideRiskRequest/Response + batch wrappers
```

### Input Features (`LandslideInputFeatures`)
Required-ish (see `LandslideConfig.required_features`): `rainfall_24h`, `rainfall_72h`, `rainfall_7d`, `soil_moisture` (0–1, % auto-converted), `slope` (0–90°), `elevation` (m), `vegetation_index` (NDVI −1..1), `soil_type`, `historical_landslides`.

Optional: `rainfall_1h`, `aspect` (0–360), `curvature`, `land_cover` (`forest/grassland/agriculture/urban/barren/wetland/water/snow_ice/unknown`), `soil_depth/cohesion/friction_angle/permeability`, `geology` (`sedimentary/metamorphic/igneous/volcanic/alluvial/colluvial/unknown`), `distance_to_fault/road/stream` (km), `landslide_frequency`, `last_landslide_date`, `temperature`, `humidity` (0–100), `wind_speed`, `location_name/latitude/longitude/timestamp`.

### Risk Output (`LandslideRiskResult`)
- `risk_category`: `low | moderate | high | critical` (thresholds `0.25 / 0.5 / 0.75` in `LandslideConfig`)
- `risk_score` (0–1), `confidence` (0–1, demo fixed at 0.65), `risk_probabilities` (per-category, sums to ~1)
- `risk_factors` (e.g. heavy rainfall, steep slope), `feature_contributions` (optional), `infrastructure_at_risk`, `recommended_actions`, `model_version`, `processing_time_ms`, `is_demo`, `timestamp`

### Models
| Model | Class | Status |
|-------|-------|--------|
| Demo (rule-based) | `DemoLandslideModel` (`demo-v1`, `is_demo=True`) | ✅ Default; rainfall + moisture + slope + history heuristic |
| Random Forest | `RandomForestLandslideModel` (`1.0.0`, `is_demo=False`) | ✅ Trainable (200 trees, `sqrt`, `balanced`, CV 5-fold); needs real CSV or synthetic data |
| Gradient Boosting | `GradientBoostingLandslideModel` | ❌ Placeholder (`NotImplementedError`) |

`LandslideRiskPredictor` auto-uses demo when `LANDSLIDE_DEMO_MODE=true` (default) or no model path is given. Use `create_predictor(use_demo=True/False)` or `LandslideRiskPredictor(model_path=..., preprocessor_path=...)`.

### Training Pipeline
```bash
cd backend
source .venv/bin/activate
python -c "
from app.ai.landslide.training.trainer import run_training_pipeline
result = run_training_pipeline(use_synthetic=True, n_samples=5000)
print(result.success, result.metrics, result.model_path)
"
```
- Data: `load_landslide_dataset(use_synthetic=True)` generates physics-flavored synthetic data (Sikkim lat/lon); or pass a real CSV with `data_path`.
- Split: stratified train/val/test via `split_data()` (`LANDSLIDE_TEST_SIZE=0.2`, `LANDSLIDE_VALIDATION_SIZE=0.1`).
- Preprocess: `LandslidePreprocessor.fit()` (median impute + scaling + one-hot).
- Train: `RandomForestLandslideModel.train()` + test metrics (accuracy/precision/recall/F1) + `model_meta_{ts}.json`.
- Extras: `evaluate_model()`, `cross_validate_model()`, `hyperparameter_tuning()` (RandomizedSearchCV), `train_demo_model()`.

### Landslide Configuration
Key env vars (see `backend/app/ai/landslide/config.py`):
```bash
LANDSLIDE_MODEL_TYPE=random_forest
LANDSLIDE_DEMO_MODE=true
LANDSLIDE_MODEL_DIR=models/landslide
LANDSLIDE_MODEL_PATH=
LANDSLIDE_DATA_DIR=data/landslide
LANDSLIDE_N_ESTIMATORS=200
LANDSLIDE_MAX_DEPTH=20
LANDSLIDE_TEST_SIZE=0.2
LANDSLIDE_VALIDATION_SIZE=0.1
LANDSLIDE_PREDICTION_THRESHOLD=0.5
LANDSLIDE_CONFIDENCE_THRESHOLD=0.6
LANDSLIDE_LOG_LEVEL=INFO
```

### Testing the Landslide API
```bash
curl -X POST http://127.0.0.1:8000/api/ai/landslide/predict-risk \
  -H "Content-Type: application/json" \
  -d '{"features":{"rainfall_24h":80,"rainfall_72h":150,"rainfall_7d":220,"soil_moisture":0.85,"slope":35,"elevation":1200,"vegetation_index":0.3,"soil_type":"clay","historical_landslides":2,"latitude":27.33,"longitude":88.60},"return_probabilities":true}'

curl -X POST http://127.0.0.1:8000/api/ai/landslide/predict-risk-batch \
  -H "Content-Type: application/json" \
  -d '{"locations":[{"rainfall_24h":80,"rainfall_72h":150,"rainfall_7d":220,"slope":35,"elevation":1200,"historical_landslides":2}]}'

curl http://127.0.0.1:8000/api/ai/landslide/health
curl http://127.0.0.1:8000/api/ai/landslide/model-info
```

## Current API Endpoints
Mounted in `backend/app/main.py`:

| Method | Path | Source | Description |
|--------|------|--------|-------------|
| `GET` | `/api/health` | `app/main.py` | Returns `{"status": "ok"}` |
| `POST` | `/api/ai/analyze-incident` | `app/api/ai.py` | Incident AI analysis (description 10–5000 chars, geo, affected_people, image_url); validates input, runs provider, validates result |
| `GET` | `/api/ai/providers` | `app/api/ai.py` | List registered providers + default |
| `GET` | `/api/ai/health` | `app/api/ai.py` | AI health: provider name/version, is_demo, firestore flag, timestamp |
| `POST` | `/api/ai/landslide/predict-risk` | `app/api/landslide.py` | Single landslide risk prediction (+ probabilities / feature contributions flags) |
| `POST` | `/api/ai/landslide/predict-risk-batch` | `app/api/landslide.py` | Batch prediction for `locations[]` |
| `GET` | `/api/ai/landslide/health` | `app/api/landslide.py` | Landslide health (demo, model_loaded, timestamp) |
| `GET` | `/api/ai/landslide/model-info` | `app/api/landslide.py` | Loaded model metadata via `predictor.get_model_info()` |

Interactive docs: `http://127.0.0.1:8000/docs`

## Verification
```bash
# Frontend
cd frontend
npm run lint      # oxlint
npm run build     # vite build

# Backend
cd backend
source .venv/bin/activate  # .venv\Scripts\activate on Windows
python -c "import sklearn, numpy, scipy, pandas, joblib; print('All imports OK')"
uvicorn app.main:app --reload
# /api/health returns {"status": "ok"}
# /docs lists /api/ai/* and /api/ai/landslide/*
```

## Current Limitations (Not Yet Implemented)
- **No trained production models** — incident + landslide both default to demo/rule-based (`is_demo=True`, fixed 0.65 confidence)
- **No image analysis models** — preprocessor interface + mock only
- **No forecasting / temporal prediction** beyond static `riskForecast` list in `Home.jsx`
- **No full interactive map yet** — `/map` preview plots live incidents; clustering / heat layers / live tracking are future updates
- **No push notifications / SMS / Email alerts**
- **No Firebase Authentication** (rules are open development rules)
- **No weather APIs integration**
- **No admin/authority dashboard**
- **No production deployment**
- **Gradient boosting landslide model** is a placeholder
- Satellite communication (future scope note in SOS)

## Firebase Rules (Development Only)
### Firestore (not checked in — create in console)
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

### Storage (`frontend/storage.rules`)
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
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

> ⚠️ **WARNING**: These rules are **DEVELOPMENT ONLY**. Production rules must require authentication, validate ownership, implement quotas, and restrict access by user/role.

## Limitations & Next Steps
### Phase 6A Limitations
- **NO TRAINED MODELS CHECKED IN** - Only demo providers + trainable RF skeleton
- **SYNTHETIC DATA ONLY** - `create_synthetic_landslide_data()` is DEMO, not real Sikkim survey data
- **NO IMAGE ANALYSIS** - Image preprocessing interface exists but no model
- **NO FORECASTING** - No temporal prediction capabilities
- **NO REAL CONFIDENCE** - Demos return fixed 0.65 confidence
- **RULE-BASED ONLY by default** - Classification uses keyword matching / heuristics, not ML

### Next Phases Will Implement
- Real trained models on verified landslide + incident datasets (replace demo providers)
- Image analysis models (CNN/ViT for disaster image classification)
- Confidence calibration (Platt scaling, isotonic regression)
- Training pipeline with proper dataset management + model versioning / A/B testing
- Firestore attachment of AI results to incidents
- Risk forecasting (temporal), landslide susceptibility / flood progression modeling
- Resource optimization (allocation algorithms)
- Auth, map clustering, notifications, weather APIs, admin dashboard, production deploy
