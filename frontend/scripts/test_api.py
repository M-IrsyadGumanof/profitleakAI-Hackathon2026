"""
PROFITLEAK AI - QA TEST SUITE v6 + GEMINI ADVICE (Python Standalone)
Pemilik: Febri (QA + Docs + FE Support)
Lokasi : frontend/scripts/test_api.py
"""

import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
FIXTURE_PATH = BASE_DIR / "fixtures.json"

with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
    fixtures = json.load(f)

is_mock = "--mock" in sys.argv
base_url = "http://127.0.0.1:8000"
for arg in sys.argv[1:]:
    if arg.startswith("http"):
        base_url = arg

threshold = fixtures.get("contract_threshold", 3.09779)

print("=" * 72)
print(" PROFITLEAK AI - AUTOMATED QA TEST RUNNER (PYTHON v6 + ADVICE)")
print(f" Mode: {'MOCK SIMULATION' if is_mock else f'LIVE SERVER ({base_url})'}")
print(f" Threshold Kontrak: {threshold}")
print("=" * 72 + "\n")

results = []

def run_test(test_id, name, test_func):
    sys.stdout.write(f"[TEST] {test_id:<22}: {name:<48} ... ")
    sys.stdout.flush()
    try:
        test_func()
        print("\033[92mPASS\033[0m")
        results.append((test_id, name, "PASS", None))
    except Exception as e:
        print("\033[91mFAIL\033[0m")
        print(f"       \033[93mDetail:\033[0m {e}")
        results.append((test_id, name, "FAIL", str(e)))

def mock_request(endpoint, method="GET", payload=None):
    if endpoint == "/api/health":
        return 200, {"status": "ok", "service": "profitleak-api"}
    if endpoint == "/api/model-info":
        return 200, {"threshold": threshold, "detectors": ["rate", "margin"]}
    if endpoint == "/api/advice":
        if not payload or not isinstance(payload, dict) or "summary" not in payload:
            return 400, {"detail": "Payload tidak valid"}
        leaks = payload.get("summary", {}).get("leaks", 0)
        return 200, {
            "source": "rule_based" if leaks == 0 else "gemini",
            "headline": "Ringkasan Hasil Evaluasi Ongkir",
            "ringkasan": "Analisis tarif pengiriman selesai.",
            "prioritas": [],
            "per_baris": [],
            "catatan": "Saran AI, bukan nasihat keuangan."
        }

    weight = payload.get("weight_kg", 0)
    dist = payload.get("distance_km", 0)
    vol = payload.get("volume_cm3", 0)
    price = payload.get("price", 0)
    actual_rate = payload.get("actual_rate", price)

    if not (0.05 <= weight <= 30.0 and 1.4896 <= dist <= 3135.7885 and 352.0 <= vol <= 244608.0 and 4.99 <= price <= 2110.0):
        return 400, {"detail": "Input out of valid range"}

    predicted = round(15.0 + (weight * 1.5) + (dist * 0.015) + (vol * 0.0001), 2)
    ratio = round(actual_rate / predicted, 4)
    is_leak = (ratio > threshold) or ((actual_rate / price) > 0.5)

    if endpoint == "/api/predict":
        return 200, {"predicted_rate": predicted, "currency": "BRL"}
    if endpoint == "/api/detect-leak":
        return 200, {
            "predicted_rate": predicted,
            "actual_rate": actual_rate,
            "ratio": ratio,
            "is_leak": is_leak,
            "threshold": threshold,
            "currency": "BRL",
            "message": "Terindikasi bocor" if is_leak else "Aman"
        }
    return 404, {"detail": "Not found"}

def request(endpoint, method="GET", payload=None):
    if is_mock:
        return mock_request(endpoint, method, payload)

    url = f"{base_url}{endpoint}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            body = json.loads(response.read().decode("utf-8"))
            return status, body
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"detail": str(e)}
        return e.code, body
    except urllib.error.URLError as e:
        raise ConnectionError(f"Gagal menghubungi server {url}: {e.reason}")

# Test Cases
def test_health():
    status, body = request("/api/health")
    assert status == 200 and body.get("status") == "ok"

def test_model_info():
    status, body = request("/api/model-info")
    assert status == 200 and "detectors" in body

def test_predict():
    tc = fixtures["test_cases"]["normal_sample"]
    status, body = request("/api/predict", "POST", tc["input"])
    assert status == 200 and body.get("predicted_rate", 0) > 0

def test_leak_normal():
    tc = fixtures["test_cases"]["normal_sample"]
    status, body = request("/api/detect-leak", "POST", tc["input"])
    assert status == 200 and body.get("is_leak") is False

def test_leak_rate():
    tc = fixtures["test_cases"]["rate_leak_sample"]
    status, body = request("/api/detect-leak", "POST", tc["input"])
    assert status == 200 and body.get("is_leak") is True

def test_invalid_weight():
    tc = fixtures["test_cases"]["invalid_weight_low"]
    status, body = request("/api/detect-leak", "POST", tc["input"])
    assert status == 400 and isinstance(body.get("detail"), str)

def test_advice():
    payload = {
        "filename": "demo_ongkir_mahal.csv",
        "threshold": threshold,
        "summary": {"total_rows": 5, "analysed": 5, "leaks": 2, "estimated_loss": 150.0},
        "rows": [{"line": 2, "actual_rate": 60.0, "predicted_rate": 15.0, "is_leak": True}]
    }
    status, body = request("/api/advice", "POST", payload)
    assert status == 200, f"Expected 200, got {status}"
    assert "headline" in body and "ringkasan" in body, "Response advice missing required fields"

def test_advice_zero():
    payload = {
        "filename": "demo_normal.csv",
        "threshold": threshold,
        "summary": {"total_rows": 5, "analysed": 5, "leaks": 0, "estimated_loss": 0.0},
        "rows": []
    }
    status, body = request("/api/advice", "POST", payload)
    assert status == 200 and body.get("source") == "rule_based"

run_test("TC-01-HEALTH", "Health check endpoint", test_health)
run_test("TC-02-MODEL-INFO", "Model info & scope metadata", test_model_info)
run_test("TC-03-PREDICT", "Predict rate endpoint", test_predict)
run_test("TC-04-LEAK-NORMAL", "Detect normal transaction (is_leak: false)", test_leak_normal)
run_test("TC-05-LEAK-RATE", "Detect rate leak (is_leak: true)", test_leak_rate)
run_test("TC-06-INVALID-400", "Boundary check returns HTTP 400", test_invalid_weight)
run_test("TC-07-ADVICE-POST", "Saran AI endpoint (POST /api/advice)", test_advice)
run_test("TC-08-ADVICE-ZERO", "Saran AI 0 leak (hemat token)", test_advice_zero)

print("\n" + "=" * 72)
passed = sum(1 for r in results if r[2] == "PASS")
failed = sum(1 for r in results if r[2] == "FAIL")
print(f" TOTAL TEST : {len(results)} | PASS: {passed} | FAIL: {failed}")
print("=" * 72)
if failed > 0:
    sys.exit(1)
