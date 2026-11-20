"""Simulated sensor readings. Replace `read_sensors()` with a real IoT integration later
(e.g. MQTT/HTTP gateway) and save with source='iot', is_simulated=False."""
import random


def read_sensors() -> dict:
    r = random
    return {
        "nitrogen": round(r.uniform(20, 120), 1), "phosphorus": round(r.uniform(15, 90), 1),
        "potassium": round(r.uniform(15, 120), 1), "ph": round(r.uniform(5.2, 7.8), 1),
        "soil_moisture": round(r.uniform(12, 70), 1), "temperature": round(r.uniform(20, 40), 1),
        "humidity": round(r.uniform(40, 90), 1), "rainfall": round(r.uniform(0, 220), 1),
        "is_simulated": True,
    }
