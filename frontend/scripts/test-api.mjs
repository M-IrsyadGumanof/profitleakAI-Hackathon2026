/**
 * PROFITLEAK AI - AUTOMATED QA TEST RUNNER v6 (Node.js ES Module)
 * Pemilik: Febri (QA + Docs + FE Support)
 * Lokasi : frontend/scripts/test-api.mjs
 * 
 * Penggunaan:
 *   node frontend/scripts/test-api.mjs             (Uji ke server live http://localhost:8000)
 *   node frontend/scripts/test-api.mjs --mock      (Uji simulasi logika kontrak internal)
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturePath = resolve(__dirname, "fixtures.json");
const fixtures = JSON.parse(readFileSync(fixturePath, "utf-8"));
const sampleCsvPath = resolve(__dirname, "sample_transactions.csv");

const args = process.argv.slice(2);
const isMockMode = args.includes("--mock");
const baseUrl = args.find(a => a.startsWith("http")) || process.env.API_URL || "http://127.0.0.1:8000";

const THRESHOLD = fixtures.contract_threshold || 3.09779;
const MARGIN_PROBA_THRESHOLD = fixtures.margin_threshold || 0.46;

console.log("========================================================================");
console.log(" PROFITLEAK AI - AUTOMATED QA TEST RUNNER (v6 DUAL-DETECTOR)");
console.log(` Mode: ${isMockMode ? "MOCK SIMULATION (Logika Internal)" : `LIVE SERVER (${baseUrl})`}`);
console.log(` Threshold Rasio Tarif: ${THRESHOLD} | Threshold Margin: ${MARGIN_PROBA_THRESHOLD}`);
console.log("========================================================================\n");

const results = [];

async function runTest(testId, name, runnerFn) {
  process.stdout.write(`[TEST] ${testId.padEnd(23)}: ${name.padEnd(52)} ... `);
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

function mockServer(endpoint, method, body, isMultipart = false) {
  if (endpoint === "/api/health") {
    return { status: 200, data: { status: "ok", service: "profitleak-api", version: "0.2.0" } };
  }

  if (endpoint === "/api/model-info") {
    return {
      status: 200,
      data: {
        threshold: THRESHOLD,
        margin_threshold: 0.5,
        margin_proba_threshold: MARGIN_PROBA_THRESHOLD,
        detectors: ["rate", "margin"],
        scope: { covered: ["tarif ongkir", "margin"], not_covered: ["COGS", "diskon"] },
      }
    };
  }

  if (endpoint === "/api/upload-csv") {
    return {
      status: 200,
      data: {
        filename: "sample_transactions.csv",
        currency: "BRL",
        summary: {
          total_rows: 5,
          analysed: 4,
          skipped: 1,
          leaks: 2,
          estimated_loss: 320.50,
          leak_rate: 50.0
        },
        recommendations: [
          { code: "freight_eats_margin", count: 1, recommendation: "Naikkan harga jual atau terapkan minimum order" }
        ],
        rows: [{ line: 2, is_leak: false }, { line: 3, is_leak: true }],
        skipped: [{ line: 6, reason: "weight_kg=99 di luar rentang" }]
      }
    };
  }

  const { weight_kg, distance_km, volume_cm3, price, actual_rate } = body || {};

  // Boundary checks from model v6
  if (
    weight_kg < 0.05 || weight_kg > 30.0 ||
    distance_km < 1.4896 || distance_km > 3135.7885 ||
    volume_cm3 < 352.0 || volume_cm3 > 244608.0 ||
    price < 4.99 || price > 2110.0
  ) {
    return { status: 400, data: { detail: "Input di luar batas valid_ranges model." } };
  }

  const predicted = 15.0 + (weight_kg * 1.5) + (distance_km * 0.015) + (volume_cm3 * 0.0001);
  const effectiveActual = actual_rate !== undefined ? actual_rate : price;
  const ratio = effectiveActual / predicted;
  const freight_ratio = effectiveActual / price;

  const is_rate_leak = ratio > THRESHOLD;
  const is_margin_risk = freight_ratio > 0.5;
  const is_leak = is_rate_leak || is_margin_risk;

  const reasons = [];
  if (is_rate_leak) {
    reasons.append?.({ code: "rate_exceeds_fair", severity: "high", detail: "Tarif mahal", remedy: "Negosiasi" }) ||
    reasons.push({ code: "rate_exceeds_fair", severity: "high", detail: "Tarif mahal", remedy: "Negosiasi" });
  }
  if (is_margin_risk) {
    reasons.push({ code: "freight_eats_margin", severity: "medium", detail: "Margin tergerus", remedy: "Naikkan harga" });
  }

  if (endpoint === "/api/predict") {
    return { status: 200, data: { predicted_rate: Number(predicted.toFixed(2)), currency: "BRL" } };
  }

  if (endpoint === "/api/detect-leak") {
    return {
      status: 200,
      data: {
        predicted_rate: Number(predicted.toFixed(2)),
        actual_rate: effectiveActual,
        ratio: Number(ratio.toFixed(4)),
        is_leak,
        threshold: THRESHOLD,
        currency: "BRL",
        message: is_leak ? "Terindikasi kebocoran profit" : "Tarif dalam batas wajar",
        risk_score: is_leak ? 0.75 : 0.15,
        detectors: { rate: is_rate_leak, margin: is_margin_risk },
        reasons
      }
    };
  }

  return { status: 404, data: { detail: "Not found" } };
}

async function request(endpoint, method = "GET", body = null, isFile = false) {
  if (isMockMode) {
    return mockServer(endpoint, method, body, isFile);
  }

  const url = `${baseUrl}${endpoint}`;
  let options = { method };

  if (isFile) {
    // Multipart form data
    const formData = new FormData();
    const csvBuffer = readFileSync(sampleCsvPath);
    const blob = new Blob([csvBuffer], { type: "text/csv" });
    formData.append("file", blob, "sample_transactions.csv");
    options.body = formData;
  } else if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }
  return { status: res.status, data };
}

// --------------------- TEST SUITES ---------------------

async function main() {
  // TC-01: Health Check
  await runTest("TC-01-HEALTH", "Pemeriksaan kesehatan server (GET /api/health)", async () => {
    const res = await request("/api/health", "GET");
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (res.data.status !== "ok") throw new Error(`Expected status: 'ok', got: ${res.data.status}`);
  });

  // TC-02: Model Info
  await runTest("TC-02-MODEL-INFO", "Pemeriksaan metadata & batas model (GET /api/model-info)", async () => {
    const res = await request("/api/model-info", "GET");
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (!res.data.detectors || !Array.isArray(res.data.detectors)) {
      throw new Error("Field detectors harus berupa list");
    }
  });

  // TC-03: Predict Single
  await runTest("TC-03-PREDICT", "Prediksi tarif wajar (POST /api/predict)", async () => {
    const tc = fixtures.test_cases.normal_sample;
    const res = await request("/api/predict", "POST", tc.input);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (typeof res.data.predicted_rate !== "number" || res.data.predicted_rate <= 0) {
      throw new Error(`predicted_rate tidak valid: ${res.data.predicted_rate}`);
    }
    if (res.data.currency !== "BRL") throw new Error("Currency harus BRL");
  });

  // TC-04: Detect Leak - Normal (Aman)
  await runTest("TC-04-LEAK-NORMAL", "Deteksi tarif wajar & margin aman (is_leak: false)", async () => {
    const tc = fixtures.test_cases.normal_sample;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (res.data.is_leak !== false) {
      throw new Error(`Harusnya is_leak: false, didapat: ${res.data.is_leak}`);
    }
  });

  // TC-05: Detect Leak - Rate Exceeds Fair
  await runTest("TC-05-LEAK-RATE", "Deteksi lonjakan tarif ongkir > 3.09x (is_leak: true)", async () => {
    const tc = fixtures.test_cases.rate_leak_sample;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (res.data.is_leak !== true) {
      throw new Error(`Harusnya is_leak: true, didapat: ${res.data.is_leak}`);
    }
    if (res.data.ratio <= THRESHOLD) {
      throw new Error(`Rasio (${res.data.ratio}) seharusnya melebihi threshold (${THRESHOLD})`);
    }
  });

  // TC-06: Detect Leak - Margin Risk
  await runTest("TC-06-LEAK-MARGIN", "Deteksi ongkir menggerus margin jual (freight > 50% price)", async () => {
    const tc = fixtures.test_cases.margin_leak_sample;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (res.data.is_leak !== true) {
      throw new Error(`Harusnya is_leak: true, didapat: ${res.data.is_leak}`);
    }
  });

  // TC-07: Upload CSV Batch Analysis
  await runTest("TC-07-UPLOAD-CSV", "Analisis transaksi batch CSV (POST /api/upload-csv)", async () => {
    const res = await request("/api/upload-csv", "POST", null, true);
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
    if (!res.data.summary || typeof res.data.summary.total_rows !== "number") {
      throw new Error("Respons upload-csv harus memuat object summary valid");
    }
    if (res.data.summary.total_rows < 1) {
      throw new Error("total_rows harus > 0");
    }
  });

  // TC-08: Boundary Minimum Valid
  await runTest("TC-08-BOUNDARY-MIN", "Batas bawah valid (weight=0.05, dist=1.5, vol=352, price=5)", async () => {
    const tc = fixtures.test_cases.boundary_min_valid;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) throw new Error(`Batas bawah valid harus diterima 200, got: ${res.status}`);
  });

  // TC-09: Boundary Maximum Valid
  await runTest("TC-09-BOUNDARY-MAX", "Batas atas valid (weight=30.0, dist=3135, vol=244600, price=2110)", async () => {
    const tc = fixtures.test_cases.boundary_max_valid;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 200) throw new Error(`Batas atas valid harus diterima 200, got: ${res.status}`);
  });

  // TC-10: Error Boundary Rejection (HTTP 400 with detail string)
  await runTest("TC-10-INVALID-400", "Penolakan input di luar batas (HTTP 400 + pesan detail)", async () => {
    const tc = fixtures.test_cases.invalid_weight_low;
    const res = await request("/api/detect-leak", "POST", tc.input);
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 untuk input invalid, got: ${res.status}`);
    }
    if (!res.data.detail || typeof res.data.detail !== "string") {
      throw new Error("Respons error harus berupa objek dengan key 'detail' bertipe string");
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

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error("Test runner fatal error:", err);
  process.exit(1);
});
