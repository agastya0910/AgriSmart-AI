# AgriSmart AI

AI-assisted smart-agriculture monitoring and crop recommendation. React + Vite + Tailwind frontend, FastAPI + SQLAlchemy + SQLite backend, Random Forest (scikit-learn) crop model, JWT authentication.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

## Quick start (Windows PowerShell)

Requirements: **Python 3.10+** and **Node.js 18+** (`python --version`, `node --version`).
Keep the project outside OneDrive if possible (OneDrive can lock `node_modules` / `.venv`).

```powershell
cd path\to\AgriSmart-AI
Set-ExecutionPolicy -Scope Process Bypass
.\setup.ps1      # venv + dependencies + .env (random SECRET_KEY) + trains model + runs tests + npm install
.\start.ps1      # opens backend and frontend windows, then the browser
```

## Manual steps

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"   # paste into SECRET_KEY= in .env
python -m app.ml.train                                          # train + save the model
pytest -q                                                       # backend tests
uvicorn app.main:app --reload --port 8000                       # DB tables are created automatically

# Frontend (new terminal)
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

## First use
1. Open http://localhost:5173 → **Create an account** (password: 8+ chars, a letter and a number).
2. Sign in → you land on the Dashboard.
3. **Farm Monitoring** → "Generate simulated reading" → Save. Charts, alerts and dashboard fill in.
4. **Crop Recommendation** → enter values (or "Use latest monitoring reading") → *Recommend Crop*.

## Important honesty notes
- **Dataset.** The real Kaggle "Crop Recommendation Dataset" could not be bundled. Without it, `app/ml/generate_dataset.py` creates a **synthetic** dataset from approximate per-crop value ranges. A model trained on it scores ~99% because the classes are generated to be separable; that number says nothing about real farms. **Not validated for real agricultural decisions.**
  To use real data: download the CSV (columns `N,P,K,temperature,humidity,ph,rainfall,label`), save it as `backend/app/ml/data/Crop_recommendation.csv`, then run `python -m app.ml.train`. The app detects it automatically and the Settings page shows which dataset is in use.
- **Sensors / weather are simulated** unless you configure otherwise, and are labelled SIMULATED in the UI. For live weather set `OPENWEATHER_API_KEY` in `backend/.env` and a city in your Profile (this path needs internet and was not testable offline). Provider code: `backend/app/services/weather.py`. IoT hook: `backend/app/services/simulator.py`.
- **Confidence** = share of Random Forest tree votes, not a calibrated probability.
- **Alert thresholds** are user-configurable (Settings) generic defaults, not crop-specific advice.
- **Forgot password:** SMTP is not configured, so the page explains this instead of sending email. Signed-in users can change their password in Settings.

## Security
- Passwords hashed with bcrypt; password hashes and `SECRET_KEY` are never returned by the API.
- JWT (HS256), 60 min by default; "Remember me" issues a 7-day token stored in `localStorage` (otherwise `sessionStorage`). Web-storage tokens are exposed to XSS; for higher security move to httpOnly cookies.
- Every private query filters by the authenticated user's id (tests verify cross-user isolation).
- Basic brute-force throttle (5 failed logins / 5 min per email, in memory). Use a real rate limiter in production.
- CORS limited to `CORS_ORIGINS`. Never commit `.env`.

## API overview (see /docs)
Auth: `POST /api/auth/register|login|change-password|forgot-password`, `GET /api/auth/me` ·
Monitoring: `POST|GET /api/monitoring`, `GET /api/monitoring/latest`, `GET /api/monitoring/simulate`, `DELETE /api/monitoring/{id}` ·
Recommendations: `POST /api/recommendations/predict`, `GET /api/recommendations/history?search=&date_from=&date_to=`, `GET /api/recommendations/model-info`, `DELETE /api/recommendations/{id}` ·
Crops: `GET /api/crops`, `GET /api/crops/{name}` ·
Notifications: `GET /api/notifications`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`, `DELETE /api/notifications/{id}` ·
Dashboard: `GET /api/dashboard/stats|charts` · Profile: `GET|PUT /api/profile` · Weather: `GET /api/weather`

## Structure
```
AgriSmart-AI/
  setup.ps1  start.ps1  README.md  .gitignore
  backend/  requirements.txt  .env.example  tests/test_api.py
    app/  main.py  database.py  auth.py
      models/  schemas/  routes/  services/ (alerts, weather, simulator)
      ml/  crops_data.py  generate_dataset.py  train.py  predict.py  data/  model/
  frontend/ package.json  vite.config.js  tailwind.config.js  .env.example
    src/  App.jsx  main.jsx  index.css  context/  services/  components/  pages/
```

## Troubleshooting
- *Script execution disabled*: `Set-ExecutionPolicy -Scope Process Bypass`.
- *"Cannot reach the server"*: backend not running or `VITE_API_URL` wrong.
- *CORS error*: add your frontend origin to `CORS_ORIGINS` in `backend/.env`.
- *Logged out after backend restart*: `SECRET_KEY` is empty in `.env`.
- *Port 5173 in use*: Vite is configured with `strictPort`; stop the other process.
