"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Maximize2,
  Navigation,
  DollarSign,
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

// Rentang validasi model v5 dari dataset Olist
const VALID_RANGES = {
  weight_kg: { min: 0.05, max: 30.0, label: "Berat" },
  distance_km: { min: 1.5, max: 3135.8, label: "Jarak" },
  volume_cm3: { min: 352.0, max: 244608.0, label: "Volume" },
  price: { min: 4.99, max: 2110.0, label: "Harga" },
  actual_freight: { min: 1.0, max: 1500.0, label: "Ongkir" },
};

const THRESHOLD = 1.102309;
const BASELINE_MEDIAN_RESIDUAL = -0.011977;

// Preset Skenario Demo
const PRESET_SCENARIOS = [
  {
    id: "normal",
    name: "Normal",
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
    name: "Bocor 5x",
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
    name: "Kargo Berat",
    badge: "Wajar",
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
    name: "Markup",
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

  // Validasi input
  const validationWarnings = useMemo(() => {
    const list: string[] = [];
    if (weightKg < VALID_RANGES.weight_kg.min || weightKg > VALID_RANGES.weight_kg.max) {
      list.push(`Berat (${weightKg} kg) di luar rentang latih 0.05 - 30 kg`);
    }
    if (distanceKm < VALID_RANGES.distance_km.min || distanceKm > VALID_RANGES.distance_km.max) {
      list.push(`Jarak (${distanceKm} km) di luar rentang latih 1.5 - 3.135 km`);
    }
    if (volumeCm3 < VALID_RANGES.volume_cm3.min || volumeCm3 > VALID_RANGES.volume_cm3.max) {
      list.push(`Volume (${volumeCm3.toLocaleString()} cm³) di luar rentang data`);
    }
    if (price < VALID_RANGES.price.min || price > VALID_RANGES.price.max) {
      list.push(`Harga (R$ ${price}) di luar rentang data`);
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
        message = "Kebocoran profit kritis. Tarif ongkir ditagihkan kurir jauh melebihi tarif wajar.";
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
      currency: "BRL",
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
          currency: data.currency || "BRL",
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

  // Data Chart
  const chartData = useMemo(() => {
    if (!result) return [];
    return [
      {
        name: "Tarif Wajar (AI)",
        amount: result.predictedRate,
        fill: "hsl(var(--foreground))",
      },
      {
        name: "Ongkir Ditagihkan",
        amount: result.actualRate,
        fill: result.isLeak ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
      },
    ];
  }, [result]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Minimalis shadcn */}
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-xs">
              PL
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight">ProfitLeak AI</span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-mono">
                  v5.0
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:block">
                Deteksi Anomali Tarif Pengiriman & Kebocoran Profit Logistik
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[11px] font-normal">
              R²: 72.3% • FPR: 0.17%
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl flex-1 w-full px-4 py-6 sm:px-6 flex flex-col gap-6">
        {/* Preset Selector menggunakan Tabs shadcn */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            <span>Preset Skenario Pengujian:</span>
          </div>

          <Tabs value={selectedPreset} onValueChange={handleSelectPreset} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto h-8 p-1">
              {PRESET_SCENARIOS.map((p) => (
                <TabsTrigger key={p.id} value={p.id} className="text-xs px-3 h-6">
                  {p.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* 2-Column Balanced Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: Form Input dengan Card shadcn */}
          <Card className="lg:col-span-5 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Parameter Transaksi
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Input Fitur
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Masukkan spesifikasi fisik paket, rute pengiriman, dan biaya invoice.
              </CardDescription>
            </CardHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAnalysis();
              }}
            >
              <CardContent className="flex flex-col gap-4">
                {/* Row 1: Berat & Jarak */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weight" className="text-xs flex items-center gap-1">
                        <Scale className="size-3 text-muted-foreground" />
                        Berat (kg)
                      </Label>
                      <span className="text-[10px] text-muted-foreground">0.05-30</span>
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
                        className="h-8 text-xs font-mono pr-7"
                        required
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">
                        kg
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="distance" className="text-xs flex items-center gap-1">
                        <Navigation className="size-3 text-muted-foreground" />
                        Jarak (km)
                      </Label>
                      <span className="text-[10px] text-muted-foreground">1.5-3.135</span>
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
                        className="h-8 text-xs font-mono pr-7"
                        required
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">
                        km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Dimensi & Volume */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <Maximize2 className="size-3 text-muted-foreground" />
                      Dimensi (P × L × T cm)
                    </Label>
                    <span className="font-mono text-[10px] text-muted-foreground">
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
                        className="h-8 text-xs font-mono text-center pr-4"
                        placeholder="P"
                      />
                      <span className="absolute right-1.5 top-2 text-[9px] text-muted-foreground">
                        P
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        value={widthCm}
                        onChange={(e) => setWidthCm(parseFloat(e.target.value) || 1)}
                        className="h-8 text-xs font-mono text-center pr-4"
                        placeholder="L"
                      />
                      <span className="absolute right-1.5 top-2 text-[9px] text-muted-foreground">
                        L
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        value={heightCm}
                        onChange={(e) => setHeightCm(parseFloat(e.target.value) || 1)}
                        className="h-8 text-xs font-mono text-center pr-4"
                        placeholder="T"
                      />
                      <span className="absolute right-1.5 top-2 text-[9px] text-muted-foreground">
                        T
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Row 3: Nilai Barang & Ongkir Ditagih */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="price" className="text-xs flex items-center gap-1">
                        <DollarSign className="size-3 text-muted-foreground" />
                        Nilai Barang
                      </Label>
                      <span className="text-[10px] text-muted-foreground">BRL</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[10px] text-muted-foreground font-mono">
                        R$
                      </span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-mono pl-7"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="freight" className="text-xs flex items-center gap-1 font-medium">
                        <AlertTriangle className="size-3 text-muted-foreground" />
                        Ongkir Ditagih
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Kurir</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[10px] text-muted-foreground font-mono">
                        R$
                      </span>
                      <Input
                        id="freight"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={actualFreight}
                        onChange={(e) => setActualFreight(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-mono font-semibold pl-7"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Validasi Warning Alert shadcn */}
                {validationWarnings.length > 0 && (
                  <Alert variant="destructive" className="py-2 px-3 text-xs">
                    <AlertTitle className="text-xs font-semibold">Perhatian Batas Data:</AlertTitle>
                    <AlertDescription className="text-[11px] mt-1 space-y-0.5">
                      {validationWarnings.map((w, idx) => (
                        <div key={idx}>• {w}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="pt-2">
                <Button type="submit" disabled={loading} className="w-full h-9 text-xs">
                  {loading ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin mr-2" />
                      Memproses Residual...
                    </>
                  ) : (
                    <>
                      <span>Analisis Kebocoran Ongkir</span>
                      <ArrowRight className="size-3.5 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* KOLOM KANAN: Hasil Evaluasi & Grafik */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {result ? (
              <>
                {/* Status Evaluasi Card */}
                <Card className={result.isLeak ? "border-destructive/50 bg-destructive/5" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-9 items-center justify-center rounded-lg border ${
                            result.isLeak
                              ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : "border-border bg-muted text-foreground"
                          }`}
                        >
                          {result.isLeak ? (
                            <ShieldAlert className="size-5" />
                          ) : (
                            <ShieldCheck className="size-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                              Hasil Evaluasi
                            </span>
                            <Badge variant={result.isLeak ? "destructive" : "secondary"}>
                              {result.isLeak ? "TERINDIKASI BOCOR" : "TARIF NORMAL"}
                            </Badge>
                          </div>
                          <CardTitle className="text-base mt-0.5">
                            {result.isLeak
                              ? "Terdeteksi Kebocoran Biaya Logistik"
                              : "Tarif Logistik Sesuai Estimasi Wajar"}
                          </CardTitle>
                        </div>
                      </div>

                      <Badge variant="outline" className="font-mono text-[10px]">
                        {result.source === "api" ? "FastAPI Live" : "Engine v5"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 text-xs text-muted-foreground leading-relaxed">
                    <p>{result.message}</p>

                    {result.isLeak && (
                      <div className="mt-3 flex items-center justify-between rounded-md bg-destructive/10 border border-destructive/20 p-2.5">
                        <span className="text-xs text-foreground flex items-center gap-1.5 font-medium">
                          <TrendingUp className="size-4 text-destructive" />
                          Estimasi Selisih Kerugian:
                        </span>
                        <span className="text-sm font-bold font-mono text-destructive">
                          R$ {result.potentialLoss.toFixed(2)} BRL
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4 Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="p-3">
                    <span className="text-[10px] text-muted-foreground block">
                      Ongkir Wajar (AI)
                    </span>
                    <p className="text-base font-bold font-mono mt-1 text-foreground">
                      R$ {result.predictedRate.toFixed(2)}
                    </p>
                    <span className="text-[9px] text-muted-foreground">Baseline Model</span>
                  </Card>

                  <Card className="p-3">
                    <span className="text-[10px] text-muted-foreground block">
                      Ongkir Ditagihkan
                    </span>
                    <p
                      className={`text-base font-bold font-mono mt-1 ${
                        result.isLeak ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      R$ {result.actualRate.toFixed(2)}
                    </p>
                    <span className="text-[9px] text-muted-foreground">Invoice Kurir</span>
                  </Card>

                  <Card className="p-3">
                    <span className="text-[10px] text-muted-foreground block">
                      Rasio Tagihan/Wajar
                    </span>
                    <p
                      className={`text-base font-bold font-mono mt-1 ${
                        result.ratio > 2.0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {result.ratio}x
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      {result.ratio > 1 ? "Lebih mahal" : "Wajar"}
                    </span>
                  </Card>

                  <Card className="p-3">
                    <span className="text-[10px] text-muted-foreground block">
                      Residual vs Ambang
                    </span>
                    <p
                      className={`text-base font-bold font-mono mt-1 ${
                        result.residual > result.threshold ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {result.residual}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      Ambang: {result.threshold.toFixed(2)}
                    </span>
                  </Card>
                </div>

                {/* Komparasi Nilai Bar Chart Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <BarChart3 className="size-3.5" />
                      Komparasi Nilai Ongkir (BRL)
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Perbandingan tarif wajar rekomendasi model vs ongkir aktual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            tickLine={false}
                            unit=" R$"
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(var(--muted) / 0.5)", radius: 6 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0];
                                const isActual = item.payload.name === "Ongkir Ditagihkan";
                                return (
                                  <div className="rounded-lg border bg-popover text-popover-foreground px-3 py-2 text-xs shadow-md font-sans">
                                    <div className="font-semibold">{item.payload.name}</div>
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className="text-muted-foreground">Nilai:</span>
                                      <span
                                        className={`font-mono font-bold ${
                                          isActual && result.isLeak
                                            ? "text-destructive"
                                            : "text-foreground"
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
                            stroke="hsl(var(--foreground))"
                            strokeDasharray="3 3"
                            label={{
                              value: "Batas Wajar",
                              fill: "hsl(var(--muted-foreground))",
                              position: "insideTopRight",
                              fontSize: 10,
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

                {/* Rekomendasi Audit Logistik */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 text-xs text-muted-foreground flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block mb-0.5">
                        Rekomendasi Tindak Lanjut:
                      </span>
                      {result.isLeak ? (
                        <p>
                          Lakukan audit terhadap tagihan vendor kurir untuk rute pengiriman {distanceKm} km.
                          Potensi penghematan biaya logistik sebesar{" "}
                          <strong className="text-foreground font-mono">
                            R$ {result.potentialLoss.toFixed(2)} BRL
                          </strong>{" "}
                          dapat diajukan sebagai klaim penyesuaian tarif.
                        </p>
                      ) : (
                        <p>
                          Nilai residual berada pada rentang wajar di bawah ambang batas toleransi model.
                          Transaksi ini efisien dan tidak memerlukan audit manual.
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

      {/* Footer Tim */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        ProfitLeak AI © 2026 • Dikembangkan oleh Tim KOMEM • Hackathon 2026
      </footer>
    </div>
  );
}
