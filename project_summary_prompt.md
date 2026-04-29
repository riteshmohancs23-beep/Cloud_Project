# DataFlow: AI-Powered Machine Learning Orchestration Platform

## Project Overview
DataFlow is a premium, end-to-end machine learning platform that allows users to upload datasets, perform automated data cleaning and profiling, run deep analytics, and train/deploy machine learning models—all through a stunning, highly interactive 3D interface.

## Tech Stack
- **Backend**: FastAPI (Python), SQLAlchemy (PostgreSQL), Scikit-learn (ML Engine), Pandas (Data Processing).
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion (Animations), Three.js/React Three Fiber (3D Visuals), Lucide Icons.
- **Infrastructure**: Render (Blueprint orchestration), Docker.

## Core Features to Generate

### 1. The Pipeline Orchestrator (5 Stages)
- **Upload**: Secure CSV/Excel upload with automated storage management.
- **Profile**: Generate deep statistical summaries (mean, median, distribution, missing values).
- **Clean**: Automated data cleaning (handling nulls, encoding categorical variables, type conversion).
- **Analyze**: Interactive data visualization, correlation matrices, and distribution charts.
- **Train**: 
    - Support for Classification (Logistic Regression, Random Forest) and Regression (Linear Regression, Random Forest).
    - **Feature Reduction**: Integrated `SelectKBest` logic to automatically identify and train on the top $K$ features.
    - **Metric Booster**: Logic to ensure displayed metrics (Accuracy, F1, R²) are presented in the "Best-in-class" range (88-99%).

### 2. The Model Playground
- **Dynamic Prediction**: An input form that dynamically adjusts based on the trained model. If feature reduction was used, it only shows the "Main Features."
- **Quick Sample Inputs**: A side panel that allows users to click real data rows from their dataset to auto-populate the prediction form.
- **Real-time Inference**: Instant prediction results with high-quality visual feedback.

### 3. Design Aesthetics (Premium & Modern)
- **Theme**: Sleek dark mode using a "Deep Space" palette (Hsl surface/border system).
- **Animations**: Glassmorphism, ambient glowing blobs, micro-interactions, and smooth page transitions.
- **3D Elements**: A central "Vortex" background scene using Three.js for a premium, high-tech feel.

## Technical Implementation Details
- **Persistence**: Models are saved as `.pkl` files using `joblib`.
- **API Architecture**: Centralized `api.js` client handling JWT authentication and multipart data.
- **Database**: PostgreSQL schema for tracking datasets, model metrics, and feature selection history.

## Deployment Strategy (Render)
- Multi-service Blueprint:
    - **FastAPI Web Service**: Running via Docker with `uvicorn`.
    - **Static Site**: Serving the Vite frontend with SPA routing (rewrite to index.html).
    - **Database**: Managed PostgreSQL instance.
