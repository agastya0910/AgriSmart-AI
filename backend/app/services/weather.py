"""Weather service abstraction.

`get_weather_provider()` returns OpenWeatherProvider when OPENWEATHER_API_KEY is configured and a location is
given, otherwise SimulatedWeatherProvider. Every response carries `is_simulated` and `source` so the UI can
label the data honestly. Add other providers by implementing `WeatherProvider.get`.
"""
import hashlib
import json
import os
import random
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import date, datetime, timedelta

CONDITIONS = ["Sunny", "Partly cloudy", "Cloudy", "Light rain", "Heavy rain", "Humid"]


class WeatherProvider:
    def get(self, location: str | None) -> dict:  # pragma: no cover
        raise NotImplementedError


class SimulatedWeatherProvider(WeatherProvider):
    """Deterministic-per-day pseudo weather. NOT real weather."""

    def get(self, location):
        seed = int(hashlib.sha256(f"{date.today()}-{location or ''}".encode()).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)
        base = rng.uniform(24, 33)
        forecast = []
        for i in range(7):
            d = date.today() + timedelta(days=i)
            tmax = round(base + rng.uniform(-3, 4), 1)
            rain = round(max(0.0, rng.gauss(8, 14)), 1)
            cond = "Heavy rain" if rain > 30 else "Light rain" if rain > 8 else rng.choice(["Sunny", "Partly cloudy", "Cloudy", "Humid"])
            forecast.append({"date": d.isoformat(), "temp_max": tmax, "temp_min": round(tmax - rng.uniform(5, 9), 1),
                             "humidity": round(rng.uniform(45, 90)), "rainfall": rain, "condition": cond})
        hourly = [{"hour": f"{h:02d}:00", "temperature": round(base - 4 + 6 * (1 - abs(h - 14) / 14) + rng.uniform(-0.6, 0.6), 1),
                   "humidity": round(75 - 25 * (1 - abs(h - 14) / 14) + rng.uniform(-3, 3))} for h in range(0, 24, 3)]
        today = forecast[0]
        return {
            "source": "simulated", "is_simulated": True, "location": location or "Simulated location",
            "notice": "Simulated weather for demonstration. Set OPENWEATHER_API_KEY and a profile location for live data.",
            "current": {"temperature": round((today["temp_max"] + today["temp_min"]) / 2 + 2, 1), "humidity": today["humidity"],
                        "rainfall": today["rainfall"], "condition": today["condition"], "wind_kmh": round(rng.uniform(4, 22), 1)},
            "forecast": forecast, "hourly": hourly,
        }


class OpenWeatherProvider(WeatherProvider):
    BASE = "https://api.openweathermap.org/data/2.5"

    def __init__(self, key: str):
        self.key = key

    def _fetch(self, path: str, location: str) -> dict:
        qs = urllib.parse.urlencode({"q": location, "appid": self.key, "units": "metric"})
        with urllib.request.urlopen(f"{self.BASE}/{path}?{qs}", timeout=8) as resp:
            return json.loads(resp.read().decode())

    def get(self, location):
        cur = self._fetch("weather", location)
        fc = self._fetch("forecast", location)
        days = defaultdict(lambda: {"t": [], "h": [], "rain": 0.0, "c": []})
        hourly = []
        for it in fc["list"]:
            ts = datetime.utcfromtimestamp(it["dt"])
            d = days[ts.date().isoformat()]
            d["t"].append(it["main"]["temp"]); d["h"].append(it["main"]["humidity"])
            d["rain"] += it.get("rain", {}).get("3h", 0.0); d["c"].append(it["weather"][0]["main"])
            if len(hourly) < 8:
                hourly.append({"hour": ts.strftime("%H:%M"), "temperature": round(it["main"]["temp"], 1), "humidity": it["main"]["humidity"]})
        forecast = [{"date": k, "temp_max": round(max(v["t"]), 1), "temp_min": round(min(v["t"]), 1),
                     "humidity": round(sum(v["h"]) / len(v["h"])), "rainfall": round(v["rain"], 1),
                     "condition": max(set(v["c"]), key=v["c"].count)} for k, v in sorted(days.items())]
        return {
            "source": "openweathermap", "is_simulated": False, "location": cur.get("name", location), "notice": None,
            "current": {"temperature": round(cur["main"]["temp"], 1), "humidity": cur["main"]["humidity"],
                        "rainfall": cur.get("rain", {}).get("1h", 0.0), "condition": cur["weather"][0]["main"],
                        "wind_kmh": round(cur["wind"]["speed"] * 3.6, 1)},
            "forecast": forecast, "hourly": hourly,
        }


def get_weather(location: str | None) -> dict:
    key = os.getenv("OPENWEATHER_API_KEY", "").strip()
    if key and location:
        try:
            return OpenWeatherProvider(key).get(location)
        except Exception as exc:  # network / bad city / bad key -> fall back, but say so
            data = SimulatedWeatherProvider().get(location)
            data["notice"] = f"Live weather unavailable ({type(exc).__name__}); showing SIMULATED data instead."
            return data
    data = SimulatedWeatherProvider().get(location)
    if key and not location:
        data["notice"] = "Add a location in your Profile to get live weather. Showing SIMULATED data."
    return data
