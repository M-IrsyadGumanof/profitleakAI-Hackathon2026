"""ProfitLeak AI - Backend API (stub setup).

Tahap ini HANYA menyiapkan kerangka FastAPI agar frontend dan backend
bisa berjalan dan saling terhubung. Belum ada logika model/prediksi.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ProfitLeak AI API",
    version="0.1.0",
    description="Kerangka backend (setup). Endpoint model belum aktif.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    """Cek koneksi dasar frontend <-> backend."""
    return {"status": "ok", "service": "profitleak-api", "version": "0.1.0"}
