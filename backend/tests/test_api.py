"""Run from backend/:  pytest -q"""
import os, tempfile
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["SECRET_KEY"] = "test-secret-key-test-secret-key-123456"

from fastapi.testclient import TestClient
from app.main import app

PW = "Farmer123"


def auth(c, email="a@example.com"):
    c.post("/api/auth/register", json={"full_name": "Alice Farmer", "email": email, "password": PW, "confirm_password": PW})
    t = c.post("/api/auth/login", json={"email": email, "password": PW}).json()["access_token"]
    return {"Authorization": f"Bearer {t}"}


def test_full_flow():
    with TestClient(app) as c:
        # registration rules
        assert c.post("/api/auth/register", json={"full_name": "A", "email": "bad", "password": "x", "confirm_password": "y"}).status_code == 422
        h = auth(c)
        assert c.post("/api/auth/register", json={"full_name": "Alice Farmer", "email": "A@example.com", "password": PW, "confirm_password": PW}).status_code == 409
        assert c.post("/api/auth/login", json={"email": "a@example.com", "password": "wrong"}).status_code == 401
        assert c.get("/api/auth/me").status_code == 401
        me = c.get("/api/auth/me", headers=h).json()
        assert "hashed_password" not in me and me["email"] == "a@example.com"

        # recommendation + history isolation
        r = c.post("/api/recommendations/predict", headers=h, json=dict(nitrogen=90, phosphorus=42, potassium=43, temperature=21, humidity=82, ph=6.5, rainfall=200))
        assert r.status_code == 201 and r.json()["predicted_crop"] == "rice" and len(r.json()["top_predictions"]) == 3
        rid = r.json()["id"]
        assert len(c.get("/api/recommendations/history", headers=h).json()) == 1
        h2 = auth(c, "b@example.com")
        assert c.get("/api/recommendations/history", headers=h2).json() == []
        assert c.delete(f"/api/recommendations/{rid}", headers=h2).status_code == 404
        assert c.post("/api/recommendations/predict", headers=h, json=dict(nitrogen=-1, phosphorus=1, potassium=1, temperature=1, humidity=1, ph=6, rainfall=1)).status_code == 422

        # monitoring + alerts
        m = dict(farm_name="North", nitrogen=50, phosphorus=40, potassium=40, ph=8.5, soil_moisture=10, temperature=41, humidity=50, rainfall=10, is_simulated=True)
        assert c.post("/api/monitoring", headers=h, json=m).status_code == 201
        notes = c.get("/api/notifications", headers=h).json()
        assert {n["category"] for n in notes} == {"moisture", "temperature", "ph"}
        nid = notes[0]["id"]
        assert c.patch(f"/api/notifications/{nid}/read", headers=h).json()["is_read"] is True
        assert c.delete(f"/api/notifications/{nid}", headers=h2).status_code == 404
        assert c.delete(f"/api/notifications/{nid}", headers=h).status_code == 204
        assert c.get("/api/monitoring/latest", headers=h).json()["farm_name"] == "North"

        # dashboard, crops, weather, profile, password
        s = c.get("/api/dashboard/stats", headers=h).json()
        assert s["total_farms"] >= 1 and s["latest_recommendation"]["crop"] == "Rice"
        assert len(c.get("/api/dashboard/charts", headers=h).json()["trends"]) == 1
        assert len(c.get("/api/crops", headers=h).json()) == 22
        assert c.get("/api/crops/Kidney beans", headers=h).status_code == 200
        w = c.get("/api/weather", headers=h).json()
        assert w["is_simulated"] is True and len(w["forecast"]) == 7
        p = c.get("/api/profile", headers=h).json()
        p["farm_name"] = "Green Acres"
        assert c.put("/api/profile", headers=h, json=p).json()["farm_name"] == "Green Acres"
        assert c.post("/api/auth/change-password", headers=h, json={"current_password": "nope", "new_password": "NewPass123", "confirm_password": "NewPass123"}).status_code == 400
        assert c.post("/api/auth/change-password", headers=h, json={"current_password": PW, "new_password": "NewPass123", "confirm_password": "NewPass123"}).status_code == 200
        assert c.post("/api/auth/login", json={"email": "a@example.com", "password": "NewPass123"}).status_code == 200
