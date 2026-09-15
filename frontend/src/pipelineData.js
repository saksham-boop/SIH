/**
 * pipelineData.js
 * Central definition of the 8-stage validation pipeline.
 * Used by Dashboard (interactive step explorer), ProcessingPage (animation),
 * and ResultPage ("Behind the scenes" panel).
 */
import {
  Upload, Wand2, Eye, ListChecks, Database, MapPin, ShieldAlert, CheckCircle2
} from 'lucide-react';

export const STEP_ICONS = {
  upload:    Upload,
  preprocess: Wand2,
  ocr:       Eye,
  extract:   ListChecks,
  crossref:  Database,
  spatial:   MapPin,
  risk:      ShieldAlert,
  decision:  CheckCircle2,
};

export const PIPELINE_STEPS = [
  {
    id: 'upload',
    title: 'Upload',
    subtitle: 'Original scan received',
    description: 'The document is received, format-validated, and buffered for processing.',
    input: 'Scanned land record — JPG, PNG, or PDF',
    processing: [
      'File format validation (JPEG / PNG / PDF)',
      'Image buffer loading into memory',
      'RGB channel verification',
      'Resolution and bit-depth assessment',
    ],
    output: 'Raw document image ready for OpenCV preprocessing',
  },
  {
    id: 'preprocess',
    title: 'Preprocess',
    subtitle: 'Deskewing · denoising · binarization',
    description: 'OpenCV applies noise reduction, adaptive binarization, and skew correction to clean the scan.',
    input: 'Raw scanned image (often degraded, skewed, or noisy)',
    processing: [
      'Bilateral filter — edge-preserving noise reduction',
      'Otsu adaptive binarization — black/white conversion',
      'Moment-based skew angle detection',
      'Affine rotation correction (warpAffine)',
    ],
    output: 'Clean, binarized, deskewed image optimised for OCR',
  },
  {
    id: 'ocr',
    title: 'OCR',
    subtitle: 'Hindi · English · bilingual script detection',
    description: 'Tesseract v5.5 LSTM engine reads character-level text from the cleaned image with per-word confidence scores.',
    input: 'Preprocessed binarized document image',
    processing: [
      'Tesseract v5.5 LSTM engine (--psm 6)',
      'Bilingual traineddata: eng + hin (Devanagari)',
      'Word-level bounding box extraction',
      'Character confidence scoring (0–100 per word)',
    ],
    output: 'Raw text with per-word confidence + spatial bounding boxes',
  },
  {
    id: 'extract',
    title: 'Extract',
    subtitle: 'Owner · Khata · Khasra · Area · Village',
    description: 'NLP regex patterns identify and normalise all key revenue field values from the OCR text.',
    input: 'Raw OCR text with word-level confidence metadata',
    processing: [
      'Regex pattern matching (Khasra, Khata, Area, Doc ID)',
      'Bilingual keyword detection (English + Hindi headers)',
      'Name normalisation and OCR error correction',
      'Per-field confidence assignment',
    ],
    output: 'Structured fields: Owner, Father, Khasra, Khata, Area (ha), Village, District',
  },
  {
    id: 'crossref',
    title: 'Cross-Reference',
    subtitle: 'Compare against state revenue registry',
    description: 'Extracted fields are matched against the authoritative SQLite land registry using exact and fuzzy comparisons.',
    input: 'Structured fields (Khasra, Owner, Area, Village)',
    processing: [
      'SQLite registry lookup by Khasra No. + Village',
      'Exact match check (Khasra number)',
      'RapidFuzz token-sort ratio for Owner name',
      'Numeric tolerance check for Area (hectares)',
    ],
    output: 'Match scores per field + full reference record values',
  },
  {
    id: 'spatial',
    title: 'Spatial Check',
    subtitle: 'Cadastral geometry · area · boundary',
    description: 'The declared parcel boundaries are compared against the village Shajra cadastral map for spatial conflicts.',
    input: 'Khasra number, declared area, village identifier',
    processing: [
      'Cadastral parcel lookup from Shajra registry',
      'Survey polygon geometry area comparison',
      'Boundary adjacency and conflict detection',
      'Mutation status and survey year verification',
    ],
    output: 'Parcel boundary match status + dispute flag',
  },
  {
    id: 'risk',
    title: 'Risk Engine',
    subtitle: 'Anomaly scoring · weighted confidence',
    description: 'A weighted rule engine assigns anomaly severity and computes the overall validation confidence score.',
    input: 'Cross-reference scores, spatial results, legal status flags',
    processing: [
      'Weighted scoring: Khasra 30%, Owner 25%, Area 20%',
      'OCR quality penalty: 15% weight',
      'Legal status: court stay / pending mutation: 10%',
      'Severity classification: LOW / MEDIUM / HIGH',
    ],
    output: 'Score (0–100%), anomaly list, explainability cards',
  },
  {
    id: 'decision',
    title: 'Decision',
    subtitle: 'Auto-validated or sent for officer review',
    description: 'The final validation state is determined by score + anomaly severity and recorded in the audit trail.',
    input: 'Overall confidence score + anomaly severity list',
    processing: [
      'Score ≥ 90% + zero HIGH anomalies → VALID',
      'Any MEDIUM anomaly or 75–89% score → REVIEW REQUIRED',
      'Any HIGH anomaly or score < 75% → HIGH RISK',
      'Audit log entry created with officer ID + timestamp',
    ],
    output: 'VALID / REVIEW REQUIRED / HIGH RISK + recommended action',
  },
];

/**
 * Build "behind the scenes" step data from a real API record response.
 * Each step gets actual values from the processing run.
 */
export function buildBehindTheScenesSteps(record) {
  const {
    filename = '—',
    preprocessing_meta = {},
    ocr_confidence = '—',
    word_count = '—',
    extracted_fields = {},
    score_breakdown = {},
    issues = [],
    validation_status = '—',
    overall_score = '—',
  } = record || {};

  const ef = extracted_fields;
  const sb = score_breakdown;

  return [
    {
      title: 'Upload',
      input: filename,
      processing: ['Format validated', 'Image buffer loaded', 'Resolution verified'],
      output: 'Raw document image ready for enhancement',
    },
    {
      title: 'Preprocess (OpenCV)',
      input: 'Raw scanned image',
      processing: [
        'Bilateral filter applied (9, 75, 75)',
        'Otsu binarization (THRESH_BINARY)',
        preprocessing_meta.skew_angle != null
          ? `Skew corrected: ${preprocessing_meta.skew_angle}°`
          : 'No significant skew detected',
      ],
      output: preprocessing_meta.width
        ? `Enhanced ${preprocessing_meta.width} × ${preprocessing_meta.height} px image`
        : 'Binarized, deskewed image ready for OCR',
    },
    {
      title: 'OCR (Tesseract v5.5)',
      input: 'Preprocessed binarized image',
      processing: [
        'LSTM engine — PSM mode 6',
        'eng + hin traineddata (Devanagari + Latin)',
        'Word bounding box extraction',
      ],
      output: `${word_count} words detected · ${ocr_confidence}% average confidence`,
    },
    {
      title: 'Field Extraction (NLP + Regex)',
      input: 'Raw OCR text',
      processing: [
        'Khasra / Khata regex pattern match',
        'Area decimal extraction (hectares)',
        'Owner + Father name parsing and normalisation',
      ],
      output: [ef.owner_name, ef.khasra_number, ef.area && `${ef.area} ha`, ef.village]
        .filter(Boolean).join(' · ') || 'Fields extracted',
    },
    {
      title: 'Registry Cross-Reference',
      input: `Khasra ${ef.khasra_number || '—'}, Village ${ef.village || '—'}`,
      processing: [
        'SQLite revenue registry lookup',
        'RapidFuzz token-sort ratio (Owner name)',
        'Numeric area delta comparison',
      ],
      output: sb.khasra_match != null
        ? `Khasra ${Math.round(sb.khasra_match)}% · Owner ${Math.round(sb.owner_match)}% · Area ${Math.round(sb.area_match)}%`
        : 'Match scores computed',
    },
    {
      title: 'Spatial / Cadastral Check',
      input: `Khasra ${ef.khasra_number || '—'}, Cadastral Shajra`,
      processing: [
        'Parcel polygon lookup',
        'Boundary adjacency conflict detection',
        'Mutation status and survey year check',
      ],
      output: sb.historical_consistency != null
        ? `Historical consistency: ${Math.round(sb.historical_consistency)}%`
        : 'Spatial status assessed',
    },
    {
      title: 'Risk Engine',
      input: 'All sub-scores + legal status flags',
      processing: [
        'Weighted scoring (Khasra 30%, Owner 25%, Area 20%, OCR 15%, Status 10%)',
        `${issues.length} anomal${issues.length === 1 ? 'y' : 'ies'} detected`,
        issues.length > 0
          ? issues.map(i => `${i.severity}: ${i.title}`).slice(0, 2).join(' · ')
          : 'No anomalies found',
      ],
      output: `Overall score: ${overall_score}%`,
    },
    {
      title: 'Final Decision',
      input: `Score: ${overall_score}%, HIGH issues: ${issues.filter(i => i.severity === 'HIGH').length}`,
      processing: [
        'Threshold classification applied',
        'Explainability cards generated',
        'Audit log entry created',
      ],
      output: String(validation_status).replace(/_/g, ' '),
    },
  ];
}
