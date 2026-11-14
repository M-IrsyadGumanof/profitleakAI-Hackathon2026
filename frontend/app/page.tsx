"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Maximize2,
  Navigation,
  Coins,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Rentang validasi model v5 dari dataset Olist E-Commerce Brasil
const VALID_RANGES = {
  weight_kg: { min: 0.05, max: 30.0, label: "Berat" },
  distance_km: { min: 1.5, max: 3135.8, label: "Jarak" },
  volume_cm3: { min: 352.0, max: 244608.0, label: "Volume" },
  price: { min: 4.99, max: 2110.0, label: "Harga Barang" },
  actual_freight: { min: 1.0, max: 1500.0, label: "Ongkir" },
};

const THRESHOLD = 1.102309;
const BASELINE_MEDIAN_RESIDUAL = -0.011977;

// Preset Skenario Demo
const PRESET_SCENARIOS = [
  {
    id: "normal",
    name: "Transaksi Normal",
    badge: "Tarif Wajar",
    weight: 0.8,
    distance: 120,
    length: 20,
    width: 15,
    height: 8,
    price: 49.9,
    actualFreight: 14.5,
  },
  {
    id: "leak-high",
    name: "Bocor 5x (Ekstrem)",
    badge: "Anomali",
    weight: 0.5,
    distance: 85,
    length: 15,
    width: 10,
    height: 10,
    price: 39.0,
    actualFreight: 78.5,
  },
  {
    id: "heavy-valid",
    name: "Kargo Berat Jauh",
    badge: "Tarif Wajar",
    weight: 15.0,
    distance: 1820,
    length: 50,
    width: 40,
    height: 25,
    price: 450.0,
    actualFreight: 115.0,
  },
  {
    id: "leak-mild",
    name: "Markup Logistik",
    badge: "Bocor Samar",
    weight: 2.2,
    distance: 280,
    length: 30,
    width: 20,
    height: 15,
    price: 95.0,
    actualFreight: 48.0,
  },
];

interface AnalysisResult {
  predictedRate: number;
  actualRate: number;
  residual: number;
  ratio: number;
  isLeak: boolean;
  threshold: number;
  currency: string;
  source: "api" | "simulation";
  potentialLoss: number;
  message: string;
}

export default function ProfitLeakDashboard() {
  // Input State
  const [selectedPreset, setSelectedPreset] = useState<string>("normal");
  const [weightKg, setWeightKg] = useState<number>(0.8);
  const [distanceKm, setDistanceKm] = useState<number>(120);
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [widthCm, setWidthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(8);
  const [price, setPrice] = useState<number>(49.9);
  const [actualFreight, setActualFreight] = useState<number>(14.5);

  // Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Volume terhitung
  const volumeCm3 = useMemo(() => {
    return Math.max(1, Math.round(lengthCm * widthCm * heightCm));
  }, [lengthCm, widthCm, heightCm]);

  // Validasi batas input
  const validationWarnings = useMemo(() => {
    const list: string[] = [];
    if (weightKg < VALID_RANGES.weight_kg.min || weightKg > VALID_RANGES.weight_kg.max) {
      list.push(`Berat (${weightKg} kg) di luar rentang latih 0.05 - 30 kg`);
    }
    if (distanceKm < VALID_RANGES.distance_km.min || distanceKm > VALID_RANGES.distance_km.max) {
      list.push(`Jarak (${distanceKm} km) di luar rentang latih 1.5 - 3.135 km`);
    }
    if (volumeCm3 < VALID_RANGES.volume_cm3.min || volumeCm3 > VALID_RANGES.volume_cm3.max) {
      list.push(`Volume (${volumeCm3.toLocaleString()} cm³) di luar rentang data latih`);
    }
    if (price < VALID_RANGES.price.min || price > VALID_RANGES.price.max) {
      list.push(`Harga (R$ ${price} BRL) di luar rentang data latih`);
    }
    return list;
  }, [weightKg, distanceKm, volumeCm3, price]);

  // Model Engine v5
  const computePrediction = (
    w: number,
    dist: number,
    vol: number,
    p: number,
    actual: number
  ): AnalysisResult => {
    const priceLog = Math.log1p(p);
    const weightLog = Math.log1p(w);
    const distLog = Math.log1p(dist);
    const volLog = Math.log1p(vol / 1000);

    const predLog = 1.35 + 0.32 * weightLog + 0.28 * distLog + 0.12 * volLog + 0.04 * priceLog;
    const predictedRate = Math.max(7.2, Math.expm1(predLog));

    const actualLog = Math.log1p(actual);
    const residual = actualLog - predLog - BASELINE_MEDIAN_RESIDUAL;
    const isLeak = residual > THRESHOLD;
    const ratio = actual / (predictedRate || 1);
    const potentialLoss = isLeak ? Math.max(0, actual - predictedRate) : 0;

    let message = "Biaya pengiriman sesuai dengan estimasi tarif wajar logistik e-commerce.";
    if (isLeak) {
      if (ratio >= 3.5) {
        message = "Kebocoran profit kritis! Tarif ongkir kurir melonjak jauh melebihi batas tarif wajar.";
      } else {
        message = "Terindikasi markup biaya logistik melebihi batas toleransi residual model.";
      }
    }

    return {
      predictedRate: Number(predictedRate.toFixed(2)),
      actualRate: Number(actual.toFixed(2)),
      residual: Number(residual.toFixed(4)),
      ratio: Number(ratio.toFixed(2)),
      isLeak,
      threshold: THRESHOLD,
      currency: "BRL (Real Brasil)",
      source: "simulation",
      potentialLoss: Number(potentialLoss.toFixed(2)),
      message,
    };
  };

  // Jalankan Analisis
  const runAnalysis = async () => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${apiUrl}/api/detect-leak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight_kg: weightKg,
          distance_km: distanceKm,
          volume_cm3: volumeCm3,
          price: price,
          actual_freight: actualFreight,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const pRate = Number(data.predicted_rate ?? 0);
        const aRate = Number(data.actual_rate ?? actualFreight);
        const resVal = Number(data.residual ?? Math.log1p(aRate) - Math.log1p(pRate));
        const leak = Boolean(data.is_leak);

        setResult({
          predictedRate: pRate,
          actualRate: aRate,
          residual: Number(resVal.toFixed(4)),
          ratio: Number((data.ratio ?? aRate / (pRate || 1)).toFixed(2)),
          isLeak: leak,
          threshold: Number(data.threshold ?? THRESHOLD),
          currency: "BRL (Real Brasil)",
          source: "api",
          potentialLoss: Number((leak ? Math.max(0, aRate - pRate) : 0).toFixed(2)),
          message:
            data.message ||
            (leak
              ? "Terdeteksi kebocoran profit pada biaya ongkir."
              : "Tarif ongkir normal sesuai model prediksi."),
        });
        setLoading(false);
        return;
      }
    } catch {
      // Backend offline: fallback ke engine v5 lokal
    }

    const computed = computePrediction(weightKg, distanceKm, volumeCm3, price, actualFreight);
    setResult(computed);
    setLoading(false);
  };

  // Inisialisasi awal
  useEffect(() => {
    const initial = computePrediction(weightKg, distanceKm, volumeCm3, price, actualFreight);
    setResult(initial);
  }, []);

  // Pilih preset
  const handleSelectPreset = (presetId: string) => {
    const p = PRESET_SCENARIOS.find((item) => item.id === presetId);
    if (!p) return;

    setSelectedPreset(p.id);
    setWeightKg(p.weight);
    setDistanceKm(p.distance);
    setLengthCm(p.length);
    setWidthCm(p.width);
    setHeightCm(p.height);
    setPrice(p.price);
    setActualFreight(p.actualFreight);

    const vol = p.length * p.width * p.height;
    const computed = computePrediction(p.weight, p.distance, vol, p.price, p.actualFreight);
    setResult(computed);
  };

  // Data Chart: Terang & Kontras
  const chartData = useMemo(() => {
    if (!result) return [];
    return [
      {
        name: "Tarif Wajar (AI)",
        amount: result.predictedRate,
        fill: "#2563eb", // Royal Blue cerah
      },
      {
        name: "Ongkir Ditagihkan",
        amount: result.actualRate,
        fill: result.isLeak ? "#ef4444" : "#94a3b8", // Merah jika bocor, Slate jika normal
      },
    ];
  }, [result]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Header Terang & Bersih */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40 shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
              PL
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-slate-900">
                  ProfitLeak <span className="text-blue-600 font-bold">AI</span>
                </span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  Model v5.0
                </Badge>
              </div>
              <span className="text-xs text-slate-500 hidden sm:block">
                Deteksi Anomali Tarif Pengiriman & Kebocoran Biaya Logistik E-Commerce
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              R²: 72.3% • FPR: 0.17%
            </Badge>
            <Badge variant="outline" className="text-xs font-medium text-slate-600 bg-white border-slate-200">
              Mata Uang: Real Brasil (BRL)
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl flex-1 w-full px-4 py-6 sm:px-6 flex flex-col gap-6">
        {/* Preset Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 pl-1">
            <SlidersHorizontal className="size-3.5 text-blue-600" />
            <span>Preset Skenario Demo:</span>
          </div>

          <Tabs value={selectedPreset} onValueChange={handleSelectPreset} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto h-8 p-1 bg-slate-100">
              {PRESET_SCENARIOS.map((p) => (
                <TabsTrigger key={p.id} value={p.id} className="text-xs px-3 h-6 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:font-semibold data-[state=active]:shadow-xs">
                  {p.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* 2-Column Balanced Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: Form Input dengan Card Putih Bersih */}
          <Card className="lg:col-span-5 bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight text-slate-900">
                  Parameter Transaksi Pengiriman
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                  Data Input
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Spesifikasi fisik paket, jarak rute, dan invoice tagihan kurir.
              </CardDescription>
            </CardHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAnalysis();
              }}
            >
              <CardContent className="flex flex-col gap-4 pt-4">
                {/* Row 1: Berat & Jarak */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weight" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <Scale className="size-3 text-blue-600" />
                        Berat Paket (kg)
                      </Label>
                      <span className="text-[10px] text-slate-400">0.05-30kg</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="100"
                        value={weightKg}
                        onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                        className="h-8.5 text-xs pr-8 bg-white border-slate-200 text-slate-900 focus-visible:ring-blue-600"
                        required
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] font-medium text-slate-400">
                        kg
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="distance" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <Navigation className="size-3 text-blue-600" />
                        Jarak Rute (km)
                      </Label>
                      <span className="text-[10px] text-slate-400">1.5-3.135km</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="distance"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="6000"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                        className="h-8.5 text-xs pr-8 bg-white border-slate-200 text-slate-900 focus-visible:ring-blue-600"
                        required
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] font-medium text-slate-400">
                        km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Dimensi & Volume */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <Maximize2 className="size-3 text-blue-600" />
                      Dimensi (P × L × T dalam cm)
                    </Label>
                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Vol: {volumeCm3.toLocaleString()} cm³
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        value={lengthCm}
                        onChange={(e) => setLengthCm(parseFloat(e.target.value) || 1)}
                        className="h-8.5 text-xs text-center pr-5 bg-white border-slate-200"
                        placeholder="P"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">
                        P
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        value={widthCm}
                        onChange={(e) => setWidthCm(parseFloat(e.target.value) || 1)}
                        className="h-8.5 text-xs text-center pr-5 bg-white border-slate-200"
                        placeholder="L"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">
                        L
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        value={heightCm}
                        onChange={(e) => setHeightCm(parseFloat(e.target.value) || 1)}
                        className="h-8.5 text-xs text-center pr-5 bg-white border-slate-200"
                        placeholder="T"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">
                        T
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Row 3: Nilai Barang & Ongkir Ditagih (Label Jelas Real Brasil BRL) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="price" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <Coins className="size-3 text-blue-600" />
                        Nilai Barang
                      </Label>
                      <span className="text-[10px] font-medium text-slate-400">BRL</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[11px] font-semibold text-slate-500">
                        R$
                      </span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        className="h-8.5 text-xs pl-8 bg-white border-slate-200 text-slate-900"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Real Brasil</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="freight" className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                        <AlertTriangle className="size-3 text-amber-500" />
                        Ongkir Ditagih
                      </Label>
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1 rounded">Kurir</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-700">
                        R$
                      </span>
                      <Input
                        id="freight"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={actualFreight}
                        onChange={(e) => setActualFreight(parseFloat(e.target.value) || 0)}
                        className="h-8.5 text-xs font-semibold pl-8 bg-white border-slate-300 text-slate-900 focus-visible:ring-blue-600"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Biaya pada invoice</span>
                  </div>
                </div>

                {/* Validasi Warning Alert */}
                {validationWarnings.length > 0 && (
                  <Alert variant="destructive" className="py-2.5 px-3 text-xs bg-red-50 border-red-200 text-red-900">
                    <AlertTitle className="text-xs font-bold text-red-800">Catatan Batas Data Latih:</AlertTitle>
                    <AlertDescription className="text-[11px] mt-1 space-y-0.5 text-red-700">
                      {validationWarnings.map((w, idx) => (
                        <div key={idx}>• {w}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="pt-2 pb-4">
                <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  {loading ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin mr-2" />
                      Memproses Estimasi Model...
                    </>
                  ) : (
                    <>
                      <span>Analisis Kebocoran Tarif Ongkir</span>
                      <ArrowRight className="size-3.5 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* KOLOM KANAN: Hasil Evaluasi & Visualisasi Terang */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {result ? (
              <>
                {/* Status Evaluasi Card Terang */}
                <Card
                  className={`border shadow-xs ${
                    result.isLeak
                      ? "bg-red-50/70 border-red-200 text-red-950"
                      : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-10 items-center justify-center rounded-lg border shadow-xs ${
                            result.isLeak
                              ? "bg-red-100 border-red-200 text-red-600"
                              : "bg-emerald-100 border-emerald-200 text-emerald-600"
                          }`}
                        >
                          {result.isLeak ? (
                            <ShieldAlert className="size-6" />
                          ) : (
                            <ShieldCheck className="size-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                              Status Evaluasi Tarif
                            </span>
                            <Badge
                              className={`text-[10px] font-bold ${
                                result.isLeak
                                  ? "bg-red-600 text-white hover:bg-red-600"
                                  : "bg-emerald-600 text-white hover:bg-emerald-600"
                              }`}
                            >
                              {result.isLeak ? "TERINDIKASI BOCOR" : "TARIF NORMAL (WAJAR)"}
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-bold text-slate-900 mt-1">
                            {result.isLeak
                              ? "Terdeteksi Kebocoran Biaya Logistik"
                              : "Tarif Logistik Sesuai Estimasi Wajar"}
                          </CardTitle>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] font-medium bg-white border-slate-200 text-slate-600">
                        {result.source === "api" ? "FastAPI Live" : "Engine v5"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 text-xs text-slate-700 leading-relaxed">
                    <p>{result.message}</p>

                    {result.isLeak && (
                      <div className="mt-3 flex items-center justify-between rounded-lg bg-red-100/90 border border-red-200 px-3.5 py-2.5">
                        <span className="text-xs text-red-900 flex items-center gap-1.5 font-semibold">
                          <TrendingUp className="size-4 text-red-600" />
                          Potensi Kerugian / Transaksi:
                        </span>
                        <span className="text-sm font-extrabold text-red-700">
                          R$ {result.potentialLoss.toFixed(2)} BRL
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4 Metric Cards Grid Bersih */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="p-3.5 bg-white border-slate-200 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Tarif Wajar (AI)
                    </span>
                    <p className="text-lg font-extrabold mt-1 text-blue-600">
                      R$ {result.predictedRate.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-slate-400">Real Brasil (BRL)</span>
                  </Card>

                  <Card className="p-3.5 bg-white border-slate-200 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Ongkir Ditagihkan
                    </span>
                    <p
                      className={`text-lg font-extrabold mt-1 ${
                        result.isLeak ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      R$ {result.actualRate.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-slate-400">Invoice Kurir</span>
                  </Card>

                  <Card className="p-3.5 bg-white border-slate-200 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Rasio Tagihan vs Wajar
                    </span>
                    <p
                      className={`text-lg font-extrabold mt-1 ${
                        result.ratio > 2.0
                          ? "text-red-600"
                          : result.ratio > 1.2
                          ? "text-amber-600"
                          : "text-slate-900"
                      }`}
                    >
                      {result.ratio}x
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {result.ratio > 1 ? "Lebih mahal" : "Wajar"}
                    </span>
                  </Card>

                  <Card className="p-3.5 bg-white border-slate-200 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Residual vs Ambang
                    </span>
                    <p
                      className={`text-lg font-extrabold mt-1 ${
                        result.residual > result.threshold ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {result.residual}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Ambang Batas: {result.threshold.toFixed(2)}
                    </span>
                  </Card>
                </div>

                {/* Komparasi Nilai Bar Chart Card (Terang & Tajam) */}
                <Card className="bg-white border-slate-200 shadow-xs">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <BarChart3 className="size-3.5 text-blue-600" />
                      Komparasi Nilai Ongkir (Real Brasil - BRL)
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                      Perbandingan estimasi tarif wajar rekomendasi AI (Biru) vs tagihan invoice kurir
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                            unit=" R$"
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(0, 0, 0, 0.04)", radius: 6 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0];
                                const isActual = item.payload.name === "Ongkir Ditagihkan";
                                return (
                                  <div className="rounded-lg border border-slate-200 bg-white text-slate-900 px-3.5 py-2.5 text-xs shadow-lg font-sans">
                                    <div className="font-semibold text-slate-800">{item.payload.name}</div>
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className="text-slate-500">Tarif:</span>
                                      <span
                                        className={`font-bold ${
                                          isActual && result.isLeak
                                            ? "text-red-600"
                                            : isActual
                                            ? "text-slate-700"
                                            : "text-blue-600"
                                        }`}
                                      >
                                        R$ {Number(item.value).toFixed(2)} BRL
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine
                            y={result.predictedRate}
                            stroke="#2563eb"
                            strokeDasharray="4 4"
                            label={{
                              value: "Baseline Wajar",
                              fill: "#2563eb",
                              position: "insideTopRight",
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          />
                          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Rekomendasi Audit Logistik Terang */}
                <Card className="bg-slate-50 border-slate-200 shadow-xs">
                  <CardContent className="pt-3.5 pb-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        Rekomendasi Tindak Lanjut Logistik:
                      </span>
                      {result.isLeak ? (
                        <p className="leading-relaxed text-slate-700">
                          Lakukan evaluasi terhadap tagihan vendor kurir untuk rute pengiriman {distanceKm} km.
                          Potensi penghematan biaya sebesar{" "}
                          <strong className="text-red-600 font-bold">
                            R$ {result.potentialLoss.toFixed(2)} BRL
                          </strong>{" "}
                          dapat diajukan sebagai klaim penyesuaian tarif logistik.
                        </p>
                      ) : (
                        <p className="leading-relaxed text-slate-700">
                          Nilai residual berada pada rentang wajar di bawah ambang batas toleransi ({result.threshold}).
                          Transaksi logistik ini efisien dan tidak memerlukan tinjauan audit manual.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      </main>

      {/* Footer Tim Terang */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        ProfitLeak AI © 2026 • Dikembangkan oleh Tim KOMEM • Hackathon 2026
      </footer>
    </div>
  );
}
