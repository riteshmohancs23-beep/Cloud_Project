# DataFlow v2.0

> Intelligent Data Analytics Platform — FastAPI backend + Three.js landing page + React dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Feature List](#feature-list)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Application Flow](#application-flow)
- [Dataset Status Machine](#dataset-status-machine)
- [API Endpoint Reference](#api-endpoint-reference)
- [Engine Specifications](#engine-specifications)
- [Frontend Pages](#frontend-pages)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Error Handling](#error-handling)
- [Known Limitations](#known-limitations)

---

## Overview

DataFlow is a full-stack data analytics platform. Users upload structured datasets (CSV, XLSX, Parquet), run them through a 5-stage pipeline (Profile → Clean → Analyze → Train), and interact with the trained ML model via a live prediction playground. The landing page features a real-time 3D particle vortex built with Three.js that visualizes the pipeline stages.

---

## Feature List

### Backend
- JWT-based authentication (register, login, protected routes)
- Dataset upload supporting CSV, XLSX, and Parquet formats
- 5-stage gated pipeline — each stage only runs if the previous one completed
- **Profiling** — row/column counts, missing values, duplicates, per-column stats
- **Cleaning** — median imputation for numerics, "Unknown" fill for categoricals, duplicate removal, IsolationForest outlier detection (5% contamination)
- **Analytics** — correlation matrix, skewness, numeric summary (describe), high-cardinality column detection
- **ML Training** — Logistic Regression, Linear Regression, Random Forest (classification + regression), automatic LabelEncoding for categorical features, joblib model serialization
- **Live Prediction** — POST feature values, get decoded prediction back from the trained model
- **Analytics comparison endpoint** — raw vs cleaned dataset stats, per-column missing comparison, outlier estimates, value counts, histogram bins
- All results persisted to PostgreSQL with JSON columns for flexible engine output storage
- Auto-creates DB tables and storage directories on startup

### Frontend
- Animated 3D Data Vortex landing page (Three.js InstancedMesh, 2000 particles, 5 stage rings)
- Mouse parallax, scroll-speed ramp (GSAP ScrollTrigger), idle auto-rotation
- Glassmorphic UI with tilt-on-hover cards (12° perspective shift)
- Auth page — register and login with inline validation
- Dashboard — dataset list with status badges, drag-or-click upload zone
- Pipeline page — step-by-step runner with gated Run buttons, inline result display
- Analytics Dashboard (4 tabs):
  - Overview — raw + cleaned stat cards, cleaning log, column details table
  - Missing & Outliers — before/after comparison bars, outlier analysis
  - Distributions — numeric histograms, categorical value count bars, skewness chart
  - Correlations — color-coded correlation matrix, numeric summary table
- Model Playground — model info, metric cards, feature input form, live prediction result
- 3D charts library (Three.js): correlation terrain map, skewness histogram bars, ML metrics radar chart

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| FastAPI | Web framework, OpenAPI/Swagger auto-generation |
| SQLAlchemy >= 2.0 | ORM — models, sessions, queries |
| PostgreSQL 15+ | Relational database (UUID native, JSONB) |
| psycopg2-binary | PostgreSQL driver |
| Pydantic v2 | Request/response validation + settings |
| python-jose[cryptography] | JWT sign and verify (HS256) |
| passlib[bcrypt] | Password hashing |
| pandas | DataFrame operations in engines |
| scikit-learn | IsolationForest + ML models |
| joblib | Model serialization to .pkl |
| openpyxl | Excel file reading |
| pyarrow | Parquet file reading |
| python-multipart | File upload parsing |
| uvicorn[standard] | ASGI server |

### Frontend
| Package | Purpose |
|---|---|
| React 18 | Component shell, state management |
| Three.js | 3D scene — vortex, terrain, radar, histogram bars |
| GSAP 3 | ScrollTrigger speed ramp, ring pulse animations |
| Tailwind CSS 3 | Utility-first styling |
| Vite | Build tool, HMR dev server |

---

## Project Structure

```
DataFlow/
├── app/
│   ├── main.py                  # App factory, lifespan, CORS, router registration
│   ├── config.py                # Pydantic settings loaded from .env
│   ├── database.py              # SQLAlchemy engine, SessionLocal, Base, get_db()
│   │
│   ├── models/
│   │   ├── __init__.py          # Re-exports all models (ensures Base registration)
│   │   ├── user.py              # User — id, email, hashed_password, is_active
│   │   ├── dataset.py           # Dataset — id, owner_id, filename, file_path, status, file_type
│   │   ├── profiling.py         # ProfilingReport — row/col counts, missing, column_details JSON
│   │   ├── cleaning.py          # CleaningResult — cleaned_file_path, nulls_filled, cleaning_log JSON
│   │   ├── analytics.py         # AnalyticsResult — correlation_matrix, skewness, numeric_summary JSON
│   │   └── ml_model.py          # MLModel + ModelResult — task_type, model_type, metrics
│   │
│   ├── schemas/
│   │   ├── auth.py              # RegisterRequest, LoginRequest, TokenResponse, UserResponse
│   │   ├── dataset.py           # DatasetResponse, DatasetListResponse
│   │   ├── profiling.py         # ProfilingResponse
│   │   ├── analytics.py         # AnalyticsResponse
│   │   └── ml_model.py          # MLTrainRequest, MLTrainResponse
│   │
│   ├── engines/                 # Pure functions — no DB, no HTTP, no side effects
│   │   ├── profiling_engine.py  # run_profiling(df) -> dict
│   │   ├── cleaning_engine.py   # run_cleaning(df) -> dict
│   │   ├── analytics_engine.py  # run_analytics(df) -> dict
│   │   └── ml_engine.py         # run_ml(df, target, task, model) -> dict
│   │
│   ├── services/                # Orchestrate engines + DB transactions
│   │   ├── auth_service.py      # register_user, login_user
│   │   ├── dataset_service.py   # upload_dataset, list_datasets, get_dataset_by_id
│   │   ├── profiling_service.py # profile_dataset
│   │   ├── cleaning_service.py  # clean_dataset
│   │   ├── analytics_service.py # analyze_dataset
│   │   └── ml_service.py        # train_model
│   │
│   ├── routers/                 # HTTP layer — parse request, call service, return response
│   │   ├── auth.py              # POST /auth/register, POST /auth/login
│   │   ├── datasets.py          # POST /datasets/upload, GET /datasets/, GET /datasets/{id}
│   │   ├── profiling.py         # POST /datasets/{id}/profile
│   │   ├── cleaning.py          # POST /datasets/{id}/clean
│   │   ├── analytics.py         # POST /datasets/{id}/analyze, GET /datasets/{id}/analytics
│   │   └── ml.py                # POST /datasets/{id}/ml/train, GET /datasets/{id}/ml/model,
│   │                            # POST /datasets/{id}/ml/predict
│   │
│   └── utils/
│       ├── jwt_utils.py         # create_access_token, verify_token
│       ├── file_handler.py      # save_upload_file, load_dataframe, save_cleaned_df
│       └── deps.py              # get_current_user (FastAPI dependency)
│
├── storage/
│   ├── uploads/                 # Raw uploaded files — {uuid}_{original_filename}
│   ├── cleaned/                 # Cleaned CSVs — {uuid}_{original_filename}_cleaned.csv
│   └── models/                  # Trained models — {model_uuid}.pkl
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx             # App root — page router (hero → auth → dashboard)
│       ├── index.css            # Global styles, glassmorphic utilities, tilt-card
│       ├── components/
│       │   ├── VortexScene.jsx  # Three.js canvas wrapper + animation loop
│       │   ├── HeroOverlay.jsx  # Landing page text, CTA, floating badge
│       │   ├── PipelineLabels.jsx # Stage badges at bottom of hero
│       │   ├── Auth.jsx         # Register / Login forms
│       │   ├── Dashboard.jsx    # Dataset list + upload zone
│       │   ├── Pipeline.jsx     # Step-by-step pipeline runner
│       │   ├── AnalyticsDashboard.jsx # 4-tab analytics view
│       │   └── ModelPlayground.jsx    # Model info + live prediction form
│       └── lib/
│           ├── api.js           # All fetch calls to backend (token management)
│           ├── vortex.js        # Three.js vortex scene builder + particle updater
│           └── charts3d.js      # 3D correlation terrain, skewness bars, radar chart
│
├── requirements.txt
├── .env.example
├── .env                         # Not committed — copy from .env.example
└── README.md
```

---

## Database Schema

```
users
  id            UUID PK
  email         VARCHAR UNIQUE
  hashed_password VARCHAR
  is_active     BOOLEAN

datasets
  id            UUID PK
  owner_id      UUID FK → users.id (CASCADE)
  filename      VARCHAR
  file_path     VARCHAR UNIQUE
  file_type     ENUM (csv | xlsx | parquet)
  status        ENUM (UPLOADED | PROFILED | CLEANED | ANALYZED | TRAINED)

profiling_reports
  id            UUID PK
  dataset_id    UUID FK → datasets.id (CASCADE, UNIQUE)
  row_count     INTEGER
  col_count     INTEGER
  missing_cells INTEGER
  missing_cells_pct FLOAT
  duplicate_rows INTEGER
  duplicate_rows_pct FLOAT
  numeric_cols  INTEGER
  categorical_cols INTEGER
  datetime_cols INTEGER
  column_details JSON

cleaning_results
  id            UUID PK
  dataset_id    UUID FK → datasets.id (CASCADE, UNIQUE)
  cleaned_file_path VARCHAR
  nulls_filled  INTEGER
  duplicates_removed INTEGER
  outliers_removed INTEGER
  cleaning_log  JSON

analytics_results
  id            UUID PK
  dataset_id    UUID FK → datasets.id (CASCADE, UNIQUE)
  numeric_summary    JSON
  correlation_matrix JSON
  skewness           JSON
  high_cardinality_cols JSON

ml_models
  id            UUID PK
  dataset_id    UUID FK → datasets.id (CASCADE)
  target_column VARCHAR
  task_type     ENUM (classification | regression)
  model_type    ENUM (logistic_regression | linear_regression | random_forest)
  model_file_path VARCHAR

model_results
  id            UUID PK
  model_id      UUID FK → ml_models.id (CASCADE)
  accuracy      FLOAT nullable
  precision     FLOAT nullable
  recall        FLOAT nullable
  f1            FLOAT nullable
  mae           FLOAT nullable
  mse           FLOAT nullable
  r2            FLOAT nullable
```

---

## Application Flow

```
1. User visits http://localhost:5173
   └── Three.js Data Vortex landing page loads
       └── 2000 particles spiral through 5 glowing stage rings
       └── Mouse parallax + scroll speed ramp active

2. User clicks "Get Started →"
   └── Auth page — register or login
       └── On success: JWT stored in localStorage
       └── Redirect to Dashboard

3. Dashboard
   └── Lists all user's datasets with status badges
   └── Upload zone — click or drag CSV/XLSX/Parquet
       └── File saved to storage/uploads/
       └── Dataset record created with status = UPLOADED
       └── Auto-navigates to Pipeline page

4. Pipeline page — 4 sequential steps

   Step 1: Profile  (requires status = UPLOADED)
   └── Loads raw file into DataFrame
   └── run_profiling(df) → row/col counts, missing %, per-column stats
   └── Saves ProfilingReport to DB
   └── Dataset status → PROFILED

   Step 2: Clean  (requires status = PROFILED)
   └── Loads raw file into DataFrame
   └── run_cleaning(df):
       ├── Fill numeric nulls with column median
       ├── Fill categorical nulls with "Unknown"
       ├── Drop exact duplicate rows
       └── IsolationForest(contamination=0.05) outlier removal
   └── Saves cleaned CSV to storage/cleaned/
   └── Saves CleaningResult to DB
   └── Dataset status → CLEANED

   Step 3: Analyze  (requires status = CLEANED)
   └── Loads cleaned CSV (never raw)
   └── run_analytics(df) → correlation matrix, skewness, describe(), high-cardinality cols
   └── Saves AnalyticsResult to DB
   └── Dataset status → ANALYZED

   Step 4: Train  (requires status = ANALYZED)
   └── User selects: target column, task type, model type
   └── Loads cleaned CSV
   └── run_ml(df, target, task, model):
       ├── LabelEncode all object columns
       ├── 80/20 train/test split (random_state=42)
       ├── Train selected model
       └── Compute metrics (accuracy/precision/recall/f1 or MAE/MSE/R²)
   └── Saves model to storage/models/{uuid}.pkl
   └── Saves MLModel + ModelResult to DB
   └── Dataset status → TRAINED

5. After TRAINED — two dashboards unlock:

   📊 Analytics Dashboard (4 tabs)
   └── Overview: raw stats, cleaned stats, cleaning log, column table
   └── Missing & Outliers: before/after comparison bars, outlier analysis
   └── Distributions: histograms, value counts, skewness bars
   └── Correlations: 3D terrain map, numeric summary table

   🤖 Model Playground
   └── Shows model type, task, target column
   └── Shows metric cards (accuracy/f1 or MAE/R²)
   └── Input form — one field per feature column
   └── "Run Prediction →" → POST to /ml/predict → decoded prediction displayed
```

---

## Dataset Status Machine

```
UPLOADED → PROFILED → CLEANED → ANALYZED → TRAINED
```

Each stage is gated — calling an endpoint out of order returns `HTTP 400` with a clear message. Services enforce this via status checks before running any engine.

---

## API Endpoint Reference

### Authentication

| Method | Path | Auth | Request Body | Response | Status Codes |
|---|---|---|---|---|---|
| POST | `/auth/register` | None | `{ email, password (min 8) }` | `UserResponse` | 201, 400 |
| POST | `/auth/login` | None | `{ email, password }` | `{ access_token, token_type }` | 200, 401 |

### Datasets

| Method | Path | Auth | Request | Response | Status Codes |
|---|---|---|---|---|---|
| POST | `/datasets/upload` | Bearer | `multipart/form-data: file` | `DatasetResponse` | 201, 422 |
| GET | `/datasets/` | Bearer | — | `{ datasets: DatasetResponse[] }` | 200 |
| GET | `/datasets/{id}` | Bearer | — | `DatasetResponse` | 200, 404 |

### Pipeline

| Method | Path | Required Status | Engine | Response | Status Codes |
|---|---|---|---|---|---|
| POST | `/datasets/{id}/profile` | UPLOADED | `run_profiling(raw_df)` | `ProfilingResponse` | 200, 400, 404 |
| POST | `/datasets/{id}/clean` | PROFILED | `run_cleaning(raw_df)` | Cleaning summary | 200, 400, 404 |
| POST | `/datasets/{id}/analyze` | CLEANED | `run_analytics(clean_df)` | `AnalyticsResponse` | 200, 400, 404 |
| POST | `/datasets/{id}/ml/train` | ANALYZED | `run_ml(clean_df, ...)` | `MLTrainResponse` | 200, 400, 404 |

### Analytics & ML (Read + Predict)

| Method | Path | Auth | Description | Response |
|---|---|---|---|---|
| GET | `/datasets/{id}/analytics` | Bearer | Full analytics data — raw stats, cleaned stats, outlier details, value counts, distributions, correlation matrix | Combined analytics object |
| GET | `/datasets/{id}/ml/model` | Bearer | Trained model info + all metrics | Model info + metrics dict |
| POST | `/datasets/{id}/ml/predict` | Bearer | `{ feature_col: value, ... }` — run live prediction | `{ prediction: string }` |

### Request / Response Shapes

**POST /auth/register**
```json
{ "email": "user@example.com", "password": "mypassword" }
```

**POST /auth/login → TokenResponse**
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

**POST /datasets/{id}/ml/train**
```json
{ "target_column": "species", "task_type": "classification", "model_type": "random_forest" }
```

**POST /datasets/{id}/ml/predict**
```json
{ "sepal_length": "5.1", "sepal_width": "3.5", "petal_length": "1.4" }
```
```json
{ "prediction": "Iris-setosa" }
```

### HTTP Error Codes

| Code | When |
|---|---|
| 400 | Status gate violation, no numeric features, wrong target column |
| 401 | Missing, invalid, or expired JWT token |
| 404 | Dataset not found or belongs to another user |
| 422 | Pydantic validation failure (e.g. password < 8 chars, unsupported file type) |
| 500 | DB commit failure or engine exception (rollback triggered) |

---

## Engine Specifications

### Profiling Engine — `run_profiling(df)`
- Input: raw DataFrame (pre-cleaning)
- Output: `row_count`, `col_count`, `missing_cells`, `missing_cells_pct`, `duplicate_rows`, `duplicate_rows_pct`, `numeric_cols`, `categorical_cols`, `datetime_cols`, `column_details` (per-column dtype, missing %, unique count, mean/std/min/max for numerics)

### Cleaning Engine — `run_cleaning(df)`
1. Fill numeric nulls → column median
2. Fill categorical nulls → `"Unknown"`
3. Drop exact duplicate rows
4. `IsolationForest(contamination=0.05, random_state=42)` on numeric columns — remove outlier rows
- Output: `cleaned_df`, `log`, `nulls_filled`, `duplicates_removed`, `outliers_removed`

### Analytics Engine — `run_analytics(df)`
- Input: **cleaned** DataFrame only
- Output: `numeric_summary` (describe()), `correlation_matrix` (corr()), `skewness` (skew()), `high_cardinality_cols` (nunique > 50)
- Guard: returns empty dicts if no numeric columns present

### ML Engine — `run_ml(df, target_column, task_type, model_type)`
- LabelEncodes all object columns before training
- 80/20 train/test split, `random_state=42`
- Models: `LogisticRegression`, `LinearRegression`, `RandomForestClassifier`, `RandomForestRegressor`
- Classification metrics: accuracy, precision, recall, f1 (weighted average)
- Regression metrics: MAE, MSE, R²
- Guard: raises HTTP 400 if target column missing or no feature columns remain

---

## Frontend Pages

| Page | Route (internal state) | Description |
|---|---|---|
| Hero | `page = 'hero'` | 3D Data Vortex landing page with Get Started CTA |
| Auth | `page = 'auth'` | Register / Login — JWT stored in localStorage on success |
| Dashboard | `page = 'dashboard'` | Dataset list + upload zone |
| Pipeline | `selected != null` | 4-step pipeline runner per dataset |
| Analytics Dashboard | `view = 'analytics'` | 4-tab analytics view (unlocked after TRAINED) |
| Model Playground | `view = 'playground'` | Live prediction form (unlocked after TRAINED) |

---

## Quick Start

### Prerequisites
- Python 3.12+
- PostgreSQL 15+ running locally
- Node.js 18+

### Backend

```bash
# 1. Clone and enter project
cd DataFlow

# 2. Create and activate virtualenv
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET_KEY

# 5. Create the database
createdb dataflow_db

# 6. Generate a secure JWT secret key
python -c "import secrets; print(secrets.token_hex(32))"
# Paste output into .env as JWT_SECRET_KEY

# 7. Run (tables auto-created on startup)
uvicorn app.main:app --reload

# Swagger UI → http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Environment Variables

| Variable | Example | Required | Default |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost/dataflow_db` | Yes | — |
| `JWT_SECRET_KEY` | `245dd73d...` | Yes | — |
| `JWT_ALGORITHM` | `HS256` | No | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | No | `30` |
| `UPLOAD_DIR` | `storage/uploads` | No | `storage/uploads` |
| `CLEANED_DIR` | `storage/cleaned` | No | `storage/cleaned` |
| `MODELS_DIR` | `storage/models` | No | `storage/models` |

---

## Error Handling

- Services wrap all DB writes in `try/except` with `db.rollback()` on failure
- Status gates in every service — wrong order returns HTTP 400 with current status in message
- Analytics and ML always read from `cleaned_file_path` — never from raw upload path
- ML engine guards: missing target column → 400, no feature columns → 400
- Analytics engine guard: empty numeric DataFrame → returns empty dicts instead of crashing

---

## Known Limitations

- Non-numeric columns are LabelEncoded for ML (no advanced feature engineering)
- Only one profiling report, one cleaning result, and one analytics result per dataset (unique FK — re-running overwrites)
- No pagination on dataset list endpoint
- CORS allows all origins — restrict before any production deployment
- ML training is synchronous — large datasets will block the request thread
- No model versioning — only the latest trained model per dataset is used for predictions
- Local disk storage only — no S3/GCS support in v2.0

---

*DataFlow v2.0 — Built by Ritesh Mohan · March 2026*
