/**
 * PROFITLEAK AI - AUTOMATED QA TEST RUNNER v6 + GEMINI ADVICE
 * Pemilik: Febri (QA + Docs + FE Support)
 * Lokasi : frontend/scripts/test-api.mjs
 * 
 * Penggunaan:
 *   node frontend/scripts/test-api.mjs             (Uji ke server live http://localhost:8000)
 *   node frontend/scripts/test-api.mjs --mock      (Uji simulasi logika kontrak internal)
 */

import { readFileSync } from "fs";
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
console.log(" PROFITLEAK AI - AUTOMATED QA TEST RUNNER (v6 + GEMINI ADVICE)");
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
          rate_leaks: 1,
          margin_risks: 1,
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

  // Endpoint /api/advice
  if (endpoint === "/api/advice") {
    if (!body || typeof body !== "object" || !body.summary) {
      return { status: 400, data: { detail: "Payload tidak valid: field summary wajib disertakan." } };
    }

    const { summary, rows } = body;
    const leaks = summary.leaks ?? 0;

    // Zero leak path (hemat token, tanpa memanggil Gemini)
    if (leaks === 0) {
      return {
        status: 200,
        data: {
          source: "rule_based",
          generated_at: new Date().toISOString(),
          headline: "Seluruh transaksi pengiriman berada dalam batas tarif wajar",
          ringkasan: "Tidak ditemukan anomali ongkir maupun risiko margin pada berkas transaksi ini.",
          prioritas: [],
          per_baris: [],
          catatan: "Saran AI, bukan nasihat keuangan. Model tidak mencakup HPP & diskon."
        }
      };
    }

    // Leaks > 0 path
    return {
      status: 200,
      data: {
        source: "gemini",
        generated_at: new Date().toISOString(),
        headline: "Ongkir rata-rata 4.8x lebih tinggi dari estimasi wajar",
        ringkasan: "Ditemukan transaksi yang menyerap margin keuntungan terlalu besar pada rute pengiriman.",
        prioritas: [
          {
            judul: "Negosiasi tarif pengiriman dengan kurir",
            dampak: `Potensi hemat R$ ${summary.estimated_loss || 320}`,
            aksi: ["Minta daftar tarif resmi", "Bandingkan vendor alternatif"],
            terdampak: [3]
          }
        ],
        per_baris: [
          {
            line: 3,
            masalah: "Ongkir menyerap 87.5% harga jual",
            saran_harga: "Naikkan harga minimal ke R$ 120.00"
          }
        ],
        catatan: "Saran AI, bukan nasihat keuangan. Model tidak mencakup HPP & diskon."
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
    if (res.status !== 400) throw new Error(`Expected HTTP 400 untuk input invalid, got: ${res.status}`);
    if (!res.data.detail || typeof res.data.detail !== "string") {
      throw new Error("Respons error harus berupa objek dengan key 'detail' bertipe string");
    }
  });

  // ------------------ PENGUJIAN FITUR BARU: /api/advice ------------------

  // TC-11: Advice dengan data kebocoran (POST /api/advice) - menggunakan fixture Galang: advice_ekstrem.csv
  await runTest("TC-11-ADVICE-LEAK", "Saran AI untuk transaksi bocor (POST /api/advice via advice_ekstrem.csv)", async () => {
    const payload = {
      filename: "advice_ekstrem.csv",
      threshold: THRESHOLD,
      summary: {
        total_rows: 10,
        analysed: 10,
        skipped: 0,
        leaks: 9,
        rate_leaks: 6,
        margin_risks: 5,
        estimated_loss: 450.0,
        leak_rate: 90.0
      },
      rows: [
        {
          line: 2,
          predicted_rate: 15.0,
          actual_rate: 75.0,
          ratio: 5.0,
          freight_ratio: 0.6,
          is_leak: true,
          risk_score: 0.85,
          detectors: { rate: true, margin: true }
        }
      ]
    };

    const res = await request("/api/advice", "POST", payload);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (!["gemini", "rule_based"].includes(res.data.source)) {
      throw new Error(`Field source harus 'gemini' atau 'rule_based', got: ${res.data.source}`);
    }
    if (!res.data.headline || !res.data.ringkasan) {
      throw new Error("Respons advice harus memuat headline dan ringkasan");
    }
  });

  // TC-12: Advice dengan 0 kebocoran (Zero Token Optimization) - menggunakan fixture Galang: advice_aman.csv
  await runTest("TC-12-ADVICE-ZERO", "Saran AI 0 kebocoran tanpa panggilan LLM (advice_aman.csv)", async () => {
    const payload = {
      filename: "advice_aman.csv",
      threshold: THRESHOLD,
      summary: {
        total_rows: 10,
        analysed: 10,
        skipped: 0,
        leaks: 0,
        rate_leaks: 0,
        margin_risks: 0,
        estimated_loss: 0.0,
        leak_rate: 0.0
      },
      rows: [
        {
          line: 1,
          predicted_rate: 20.0,
          actual_rate: 18.0,
          ratio: 0.9,
          freight_ratio: 0.15,
          is_leak: false,
          risk_score: 0.05,
          detectors: { rate: false, margin: false }
        }
      ]
    };

    const res = await request("/api/advice", "POST", payload);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (res.data.source !== "rule_based") {
      throw new Error("Bila leaks == 0, sistem harus membalas statis (rule_based) tanpa memanggil Gemini");
    }
  });

  // TC-13: Ketahanan Fallback (Tidak boleh pernah 500)
  await runTest("TC-13-ADVICE-FALLBACK", "Ketahanan fallback advice (HTTP 200 tanpa crash 500)", async () => {
    const payload = {
      filename: "test_fallback.csv",
      threshold: THRESHOLD,
      summary: { total_rows: 2, analysed: 2, leaks: 1, estimated_loss: 50.0 },
      rows: [{ line: 2, actual_rate: 60.0, predicted_rate: 12.0, is_leak: true }]
    };

    const res = await request("/api/advice", "POST", payload);
    if (res.status === 500) {
      throw new Error("Gagal: API menghasilkan HTTP 500. Backend wajib memakai fallback rule_based HTTP 200");
    }
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }
  });

  // TC-14: Advice Payload Invalid (Harus HTTP 400 + detail string)
  await runTest("TC-14-ADVICE-INVALID", "Validasi payload advice rusak (Harus HTTP 400)", async () => {
    const invalidPayload = { data_rusak: true };
    const res = await request("/api/advice", "POST", invalidPayload);
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 untuk payload invalid, got: ${res.status}`);
    }
    if (!res.data.detail || typeof res.data.detail !== "string") {
      throw new Error("Respons error 400 harus memuat pesan string 'detail'");
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
