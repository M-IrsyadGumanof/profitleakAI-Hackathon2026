/**
 * PROFITLEAK AI - QA TEST SUITE (Node.js ES Module)
 * Pemilik: Febri (QA + Docs + FE Support)
 * Lokasi : frontend/scripts/test-api.mjs
 * 
 * Penggunaan:
 *   node frontend/scripts/test-api.mjs             (Uji ke server live http://localhost:8000)
 *   node frontend/scripts/test-api.mjs --mock      (Uji verifikasi logika fixture & test runner)
 *   node frontend/scripts/test-api.mjs http://url  (Uji ke custom URL)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load fixtures
const fixturePath = resolve(__dirname, "fixtures.json");
const fixtures = JSON.parse(readFileSync(fixturePath, "utf-8"));

const args = process.argv.slice(2);
const isMockMode = args.includes("--mock");
const baseUrl = args.find(a => a.startsWith("http")) || process.env.API_URL || "http://127.0.0.1:8000";

const THRESHOLD = fixtures.contract_threshold || 1.102309;

console.log("========================================================================");
console.log(" PROFITLEAK AI - AUTOMATED QA TEST RUNNER");
console.log(` Mode: ${isMockMode ? "MOCK SIMULATION (Logika Internal)" : `LIVE SERVER (${baseUrl})`}`);
console.log(` Threshold Kontrak: ${THRESHOLD}`);
console.log("========================================================================\n");

const results = [];

async function runTest(testId, name, runnerFn) {
  process.stdout.write(`[TEST] ${testId.padEnd(22)}: ${name.padEnd(48)} ... `);
  const startTime = Date.now();
  try {
    await runnerFn();
    const duration = Date.now() - startTime;
    console.log(`\x1b[32mPASS\x1b[0m (${duration}ms)`);
    results.push({ id: testId, name, status: "PASS", duration, error: null });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log(`\x1b[31mFAIL\x1b[0m (${duration}ms)`);
    console.log(`       \x1b[33mDetail Error:\x1b[0m ${err.message}`);
    results.push({ id: testId, name, status: "FAIL", duration, error: err.message });
  }
}

// Mock simulator for internal validation if backend is not yet started
function mockServer(endpoint, method, body) {
  if (endpoint === "/api/health") {
    return { status: 200, data: { status: "healthy", model_loaded: true } };
  }

  const { weight_kg, distance_km, volume_cm3, price } = body || {};

  // Boundary checks from model v5
  if (
    weight_kg < 0.05 || weight_kg > 30.0 ||
    distance_km < 1.4896 || distance_km > 3135.7885 ||
    volume_cm3 < 352.0 || volume_cm3 > 244608.0 ||
    price < 4.99 || price > 2110.0
  ) {
    return { status: 400, data: { detail: "Input di luar batas valid_ranges model v5." } };
  }

  // Linear mock formula for testing
  const predicted = 15.0 + (weight_kg * 1.5) + (distance_km * 0.015) + (volume_cm3 * 0.0001);
  const ratio = price / predicted;
  const is_leak = ratio > THRESHOLD;

  if (endpoint === "/api/predict") {
    return { status: 200, data: { predicted_rate: Number(predicted.toFixed(2)), currency: "BRL" } };
  }

  if (endpoint === "/api/detect-leak") {
    return {
      status: 200,
      data: {
        predicted_rate: Number(predicted.toFixed(2)),
        actual_rate: price,
        ratio: Number(ratio.toFixed(4)),
        is_leak,
        threshold: THRESHOLD,
        currency: "BRL",
        message: is_leak ? "Terindikasi kebocoran profit!" : "Tarif aman dalam batas wajar."
      }
    };
  }

  return { status: 404, data: { detail: "Not found" } };
}

async function request(endpoint, method = "GET", body = null) {
  if (isMockMode) {
    return mockServer(endpoint, method, body);
  }

  const options = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }
  return { status: res.status, data };
}

// --------------------- TEST CASES ---------------------

async function main() {
  // Test 1: Health check
  await runTest("TC-01-HEALTH", "Pemeriksaan kesehatan server (GET /api/health)", async () => {
    const res = await request("/api/health", "GET");
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }
  });

  // Test 2: Predict endpoint
  await runTest("TC-02-PREDICT", "Prediksi tarif ongkir standar (POST /api/predict)", async () => {
    const tc = fixtures.test_cases.normal_sample;
    const res = await request("/api/predict", "POST", tc.input);
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
    if (typeof res.data.predicted_rate !== "number" || res.data.predicted_rate <= 0) {
      throw new Error(`predicted_rate tidak valid: ${res.data.predicted_rate}`);
    }
    if (res.data.currency !== "BRL") {
      throw new Error(`Expected currency 'BRL', got '${res.data.currency}'`);
    }
  });

  // Test 3: Normal Rate (Aman / No Leak)
  await runTest("TC-03-LEAK-NORMAL", "Deteksi tarif wajar / rasio <= threshold (is_leak: false)", async () => {
    const tc = fixtures.test_cases.normal_sample;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }
    if (typeof res.data.ratio !== "number") {
      throw new Error("Field ratio harus bertipe number");
    }
    if (res.data.is_leak !== false) {
      throw new Error(`Harusnya is_leak: false untuk input wajar, didapat: ${res.data.is_leak} (ratio: ${res.data.ratio})`);
    }
  });

  // Test 4: Profit Leak Detection (Markup 2x)
  await runTest("TC-04-LEAK-OVERCHARGE", "Deteksi tarif overcharge markup 2x (is_leak: true)", async () => {
    const tc = fixtures.test_cases.leak_sample_2x;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }
    if (res.data.is_leak !== true) {
      throw new Error(`Harusnya is_leak: true untuk input overcharge, didapat: ${res.data.is_leak} (ratio: ${res.data.ratio})`);
    }
    if (res.data.ratio <= THRESHOLD) {
      throw new Error(`Ratio (${res.data.ratio}) seharusnya > threshold (${THRESHOLD})`);
    }
  });

  // Test 5: Boundary Minimum Valid
  await runTest("TC-05-BOUNDARY-MIN", "Input batas minimum valid (weight=0.05, dist=1.5, vol=352, price=5)", async () => {
    const tc = fixtures.test_cases.boundary_min_valid;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) {
      throw new Error(`Batas bawah valid harus diterima 200, got: ${res.status}`);
    }
  });

  // Test 6: Boundary Maximum Valid
  await runTest("TC-06-BOUNDARY-MAX", "Input batas maksimum valid (weight=30.0, dist=3135, vol=244600, price=2110)", async () => {
    const tc = fixtures.test_cases.boundary_max_valid;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) {
      throw new Error(`Batas atas valid harus diterima 200, got: ${res.status}`);
    }
  });

  // Test 7: Invalid Weight Low (< 0.05) -> Expect 400
  await runTest("TC-07-INVALID-WEIGHT-LO", "Validasi input: berat di bawah 0.05 kg harus ditolak HTTP 400", async () => {
    const tc = fixtures.test_cases.invalid_weight_low;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 untuk input invalid, got: ${res.status}`);
    }
  });

  // Test 8: Invalid Weight High (> 30.0) -> Expect 400
  await runTest("TC-08-INVALID-WEIGHT-HI", "Validasi input: berat di atas 30.0 kg harus ditolak HTTP 400", async () => {
    const tc = fixtures.test_cases.invalid_weight_high;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 untuk input invalid, got: ${res.status}`);
    }
  });

  // Test 9: Invalid Distance High (> 3135.79) -> Expect 400
  await runTest("TC-09-INVALID-DIST-HI", "Validasi input: jarak melebihi 3135.79 km harus ditolak HTTP 400", async () => {
    const tc = fixtures.test_cases.invalid_distance_high;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 untuk input invalid, got: ${res.status}`);
    }
  });

  // Test 10: Invalid Price Low (< 4.99) -> Expect 400
  await runTest("TC-10-INVALID-PRICE-LO", "Validasi input: harga di bawah 4.99 BRL harus ditolak HTTP 400", async () => {
    const tc = fixtures.test_cases.invalid_price_low;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 untuk input invalid, got: ${res.status}`);
    }
  });

  // Summary
  console.log("\n========================================================================");
  const total = results.length;
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;

  console.log(` TOTAL PENGUJIAN : ${total}`);
  console.log(` \x1b[32mLULUS (PASS)\x1b[0m    : ${passed}`);
  console.log(` \x1b[31mGAGAL (FAIL)\x1b[0m    : ${failed}`);
  console.log("========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Test runner fatal error:", err);
  process.exit(1);
});
