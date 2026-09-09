# Intelligent Land Record Digitization and Validation System
### Smart India Hackathon (SIH) Demo-Ready Prototype • Team ASCENDX

> **“The system does not just digitize land records. It identifies which digitized records may not be trustworthy yet — and explains why with transparent evidence.”**

---

## 1. Project Overview

Land title disputes and registry fraudulent claims account for over **66% of all civil litigation in India** (NITI Aayog / Centre for Policy Research). Millions of historical land deeds (*Jamabandi*, *Record of Rights*, *Khasra-Khatauni*, *Bainama*) remain in physical paper format or degraded PDF archives. When citizens submit photocopies or scanned deeds for revenue mutation or agricultural credit, officers have historically relied on manual visual inspection, leading to human error, missed encumbrances, and area inflation fraud.

The **Intelligent Land Record Digitization and Validation System** is an AI-assisted decision-support prototype built specifically for government revenue officers (Tehsildars, Revenue Inspectors, Patwaris). It automates the end-to-end workflow:
1. **Ingests** scanned or photographed land records (JPG, PNG, PDF).
2. **Preprocesses** scans with OpenCV (bilateral filtering, Otsu adaptive binarization, moment-based deskewing).
3. **Extracts text & bounding boxes** using Tesseract OCR v5.5 (`eng + hin` bilingual support).
4. **Parses structured revenue entities** (Khasra No, Khata No, Landholder Name, Parentage, Area in hectares, Village, Tehsil, District, Mutation Remarks).
5. **Cross-references** against the state reference cadastre database (SQLite mirror).
6. **Detects discrepancies & calculates confidence scores** across exact checks, numeric area tolerances, and RapidFuzz orthographic matching.
7. **Produces transparent Explainable AI cards** explaining *why* a record was flagged, showing numeric deltas, and prescribing actionable next steps (e.g., ordering ground survey or withholding approval).
8. **Visualizes parcels** on an interactive cadastral GIS map (*Shajra* grid).

---

## 2. System Architecture

```text
                                 ┌─────────────────────────────────────────┐
                                 │     React 18 + Tailwind Public Portal    │
                                 │  (Dashboard, Upload, Review, Cadastre)  │
                                 └────────────────────┬────────────────────┘
                                                      │ REST JSON API
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │          FastAPI Backend Server         │
                                 │              (Port: 8000)               │
                                 └───────┬────────────┬────────────┬───────┘
                                         │            │            │
                     ┌───────────────────┘            │            └───────────────────┐
                     ▼                                ▼                                ▼
       ┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
       │     OCR & Vision Engine   │    │  Validation & AI Reasoner │    │  Authoritative Reference  │
       ├───────────────────────────┤    ├───────────────────────────┤    ├───────────────────────────┤
       │ • OpenCV Bilateral Filter │    │ • Exact Match (Khasra)    │    │ • SQLite Database         │
       │ • Otsu Adaptive Threshold │    │ • Numeric Tolerance (Area)│    │ • 30 Seeded Land Records  │
       │ • Moment-based Deskewing  │    │ • RapidFuzz (Owner/Father)│    │ • Cadastral Coordinate Map│
       │ • Tesseract v5.5          │    │ • Court Stay / Encumbrance│    │ • Audit Logs              │
       │ • Bounding Box Overlay    │    │ • Explainable AI Cards    │    │                           │
       └───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS v3 (public-sector government design language: `#0f2942` deep navy, `#059669` emerald green, `#d97706` amber, `#dc2626` crimson)
- **Icons**: Lucide React
- **Visualization**: Interactive SVG Cadastral Map & Custom SVG Metric Gauges

### Backend
- **Framework**: Python 3.13 + FastAPI
- **Server**: Uvicorn
- **Image Processing**: OpenCV (`cv2`), Pillow (`PIL`), NumPy
- **OCR Engine**: Tesseract OCR v5.5 via `pytesseract` with `eng` and `hin` traineddata
- **String Similarity**: RapidFuzz (token sort ratio & partial ratio)
- **Database**: SQLite 3 with SQLAlchemy ORM

---

## 4. Key Features

1. **Government Dashboard**:
   - 4 Primary Metric Cards: Total Processed (1,250), Validated (1,072), Needs Review (144), High Risk (34).
   - Validation Status Distribution chart.
   - Common Anomaly Categories breakdown (Area mismatch, Owner variation, Boundary conflict, Mutation pending).
   - OCR Confidence histogram (Tesseract character reliability).
   - Recent Processing Activity audit log with 1-click inspection.

2. **Upload & Ingestion Pipeline**:
   - Drag-and-drop file upload (JPG, PNG, PDF).
   - Document classification & language selector (English, Hindi, Bilingual).
   - Realistic 6-stage animated progress flow.
   - Quick-load tray of 7 demo land records.

3. **3-Column Officer Review Workspace ("Review Record")**:
   - **Left Column**: Multi-mode document viewer (OCR Bounding Box Overlay, OpenCV Binarized/Enhanced, Raw Scan) with zoom controls.
   - **Center Column**: Extracted revenue fields with per-attribute confidence badges and live field-editing.
   - **Right Column**: Reference registry comparison, Aggregate Validation Score (0-100%), Anomaly badges, **Explainability Card** ("Why was this record flagged?"), and Officer Decision Actions ([Approve & Issue Seal], [Order Patwari Field Survey], [Flag for Dispute Tribunal]).

4. **Cadastral GIS Map (*Shajra* View)**:
   - Interactive SVG parcel layout of Village Rampur.
   - Color-coded parcels (Green = Valid, Amber = Review Required, Red = Dispute/Risk).
   - Click parcel to view owner, area, and jump to document review.

5. **SIH Judge Presentation Mode**:
   - 7 pre-configured judging scenarios for 1-click deterministic demonstration.

6. **Global Search Modal**:
   - Instant search across the registry by Khasra (e.g. `245/2`), Owner Name (`Ramesh Kumar`), Khata (`104`), or Village (`Rampur`).

---

## 5. Pre-Configured SIH Judging Scenarios

| # | Demo Scenario | Sample File | Khasra | Declared vs Ref Area | Expected Status | Score | Key Highlight |
|---|---|---|---|---|---|---|---|
| **1** | **Clean Record** | `demo_1_clean_record.png` | 245/2 | 1.05 ha vs 1.05 ha | **VALID** | 98% | 100% concordance across all fields. Zero discrepancies. |
| **2** | **Area Mismatch** | `demo_2_area_mismatch.png` | 245/2 | 1.20 ha vs 1.05 ha | **REVIEW REQUIRED** | 78% | +0.15 ha (+14.3%) variance detected. Recommends ground resurvey. |
| **3** | **Owner Variation** | `demo_3_owner_variation.png` | 246/1 | 0.88 ha vs 0.88 ha | **REVIEW REQUIRED** | 86% | "Ramesh Kumar" vs "Ramesh Kr." (94% RapidFuzz match). |
| **4** | **Khasra Mismatch** | `demo_4_khasra_mismatch.png` | 245/7 | 1.05 ha vs 1.05 ha | **HIGH RISK** | 48% | Applicant presents 245/7 claiming target parcel 245/2. |
| **5** | **Mutation Issue** | `demo_5_mutation_issue.png` | 312/1 | 2.10 ha vs 2.10 ha | **HIGH RISK** | 52% | Active civil court stay and contested succession notice. |
| **6** | **Degraded Scan** | `demo_6_degraded_scan.png` | 245/2 | 1.05 ha vs 1.05 ha | **REVIEW REQUIRED** | 74% | Weathered archive scan triggering adaptive thresholding alert. |
| **7** | **Multiple Anomalies** | `demo_7_multiple_anomalies.png` | 245/7 | 1.45 ha vs 0.65 ha | **HIGH RISK** | 34% | Inflated area (+123%), owner divergence, and boundary dispute. |

---

## 6. How to Run Locally

### Prerequisites
- Python 3.10+ installed
- Tesseract OCR installed at `C:\Program Files\Tesseract-OCR\tesseract.exe` (or in PATH)
- Node.js (A portable Node.js v20.18 is already bundled in `.tools/node`)

### Quick Start (Windows)
Double-click `start_all.bat` to launch both backend and frontend servers simultaneously!

Or launch manually:

#### 1. Start Backend Server
```bash
# In the root directory:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at: `http://127.0.0.1:8000/docs`

#### 2. Start Frontend Server
```bash
# In a new terminal:
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 7. Recommended 3–5 Minute SIH Judging Walkthrough

1. **Open Dashboard (`/`)**:
   - Highlight the 4 KPI cards: 1,250 processed, 1,072 validated, 143 review required, 34 high risk.
   - Point out the Anomaly Categories chart showing Area Mismatch as the most prevalent risk.
2. **Switch to Demo Mode (`/demo`)**:
   - Explain to the jury: *"For a reliable presentation, we have pre-configured the 7 core revenue discrepancy scenarios."*
   - Click **Case 2 (Area Mismatch)**: System immediately transitions to the Review view.
3. **Show Explainability in Officer Review (`/review`)**:
   - **Left**: Point to the original scan and toggle **OCR Overlay** to show live bounding boxes.
   - **Center**: Point out the declared area: `1.20 ha` (OCR confidence: 92%).
   - **Right**: Show the authoritative registry area: `1.05 ha`.
   - **Highlight the "Why was this record flagged?" card**:
     > *"Notice the system does not give an opaque black-box response. It reports: Difference: +0.15 ha (+14.3%), and prescribes: 'Order ground truthing by Revenue Inspector / Patwari'."*
4. **Show Case 3 (Fuzzy Owner Name)**:
   - Click **Demo Records** &rarr; **Case 3**: Show how RapidFuzz matched "Ramesh Kumar" against "Ramesh Kr." with 94% lexical similarity.
5. **Open Cadastral GIS Map (`/map`)**:
   - Click parcel **245/2** on the survey grid.
   - Demonstrate how spatial geometry detects parcel boundary conflicts with adjacent common pathway land.
6. **Officer Decision**:
   - Click **"Send for Verification / Patwari Field Survey"** to record the administrative disposition in the audit log.

---

## 8. Prototype Limitations & Legal Disclaimer

This software is an **internal hackathon prototype developed for research, validation, and demonstration purposes**.
- **Decision Support Only**: The system acts strictly as an AI-assisted decision support tool for revenue officers. Final administrative and legal determinations remain solely with authorized revenue officials under the applicable State Revenue Code (e.g., *Uttar Pradesh Revenue Code, 2006*).
- **Not Official Verification**: Digitization outputs do not constitute a certified court-admissible copy of rights unless endorsed with the digital signature of the competent revenue authority.
- **Mock Spatial GIS**: Cadastral map polygons are representative geometric models and do not replace formal physical *Total Station / DGPS* ground surveys.

---

## 9. Future Roadmap

- **Multi-lingual Indic OCR**: Integration with Bhashini API for 22 scheduled Indian languages (Tamil, Telugu, Marathi, Gujarati, Bengali, Odia, etc.).
- **Satellite InSAR & Drone Orthophoto Overlay**: Direct integration with Survey of India *SVAMITVA* drone survey point clouds to cross-verify physical boundary fences against scanned deeds.
- **Blockchain Deed Anchoring**: Generating SHA-256 cryptographic hashes for each verified Jamabandi and anchoring them on a state permissioned blockchain to prevent retrospective tampering.
- **Vision-Language Model (LLM) Document Parser**: Fine-tuned Indian legal VLM for handwritten Urdu/Persian colonial-era revenue terms (*Chakbandi*, *Khasra*, *Shajra*, *Dakhil Kharij*).

---

Developed with ❤️ for **Smart India Hackathon** by **Team ASCENDX**.
