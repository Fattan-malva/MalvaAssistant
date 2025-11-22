# 🚀 AI Market Pattern Detector

[![Status](https://img.shields.io/badge/status-alpha-orange)](https://github.com/your-repo)
[![No API Needed](https://img.shields.io/badge/API-Not%20Required-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Contributors](https://img.shields.io/badge/contributors-You%20%F0%9F%91%8D-yellowgreen)]()

> **AI Market Detective** — scanner pintar untuk mendeteksi akumulasi bandar, potensi corporate action, dan catalyst market tanpa perlu API eksternal.  
> Ringan, confidence-scored, dan siap bantu kamu ambil keputusan trading lebih awal.

---

## 📋 Table of Contents
- [Fitur Utama](#-fitur-utama)
- [Bagaimana Cara Kerja](#-bagaimana-cara-kerja)
- [Quickstart](#-quickstart)
- [Konfigurasi Contoh](#-konfigurasi-contoh)
- [Contoh Output](#-contoh-output)
- [Integrasi & Output Data](#-integrasi--output-data)
- [Tips Penggunaan](#-tips-penggunaan)
- [Contributing](#-contributing)
- [License](#-license)
- [Kontak](#-kontak)

---

## 🎯 Fitur Utama
- ✅ **NO API NEEDED** — Memanfaatkan data existing (price & volume) tanpa panggil API eksternal.  
- ✅ **SMART PATTERN RECOGNITION**  
  - Dividend plays (yield + volume accumulation)  
  - Stock split anticipation (harga tinggi + institutional interest)  
  - Bonus share detection pada small caps  
  - Earnings momentum plays  
  - Pure bandar accumulation patterns  
- ✅ **MULTI-LAYER CONFIRMATION**  
  - Volume spike (1.3×–3×) + price change minimal → Bandar accumulation  
  - Corporate action detection (dividend, split, bonus, earnings)  
  - Pattern confidence scoring  
  - Market sentiment (price action + volume)  
- ✅ **HIGH ACCURACY**  
  - Gabungan teknikal + fundamental  
  - Risk/reward automation & dynamic price targets  
- ✅ **AUTOMATIC CATALYST DETECTION** — AI mengidentifikasi potential drivers & catalyst berbasis pola.

---

## 🧠 Bagaimana Cara Kerja (Brief)
1. Sistem ingest data historical price & volume dari sumber internal kamu.  
2. Preprocessing → normalisasi & deteksi outlier.  
3. Pattern engines (rule-based + ML scoring) jalankan deteksi: accumulation, dividend signal, split pattern, dsb.  
4. Multi-layer confirmation menggabungkan sinyal untuk naikkan precision.  
5. Output: sinyal trading dengan confidence score, entry/exit, stop-loss suggestion, target dinamis.

---

## ⚡ Quickstart
1. Clone repo:
```bash
git clone https://github.com/Fattan-malva/MalvaAssistant.git
cd malvaassitant
npm install
npm start
