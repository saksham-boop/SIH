from typing import Dict, Any, List, Optional
from rapidfuzz import fuzz
from backend.database import ReferenceRecord

def validate_record(
    extracted_fields: Dict[str, Any],
    reference_record: Optional[ReferenceRecord],
    ocr_confidence: float = 85.0
) -> Dict[str, Any]:
    """
    Transparent, explainable rule-based validation engine.
    Compares extracted fields against authoritative reference registry,
    identifies discrepancies, evaluates fuzzy and numeric metrics,
    computes component confidence scores, and produces explainable officer reports.
    """
    issues: List[Dict[str, Any]] = []
    explainability: List[Dict[str, Any]] = []
    score_breakdown: Dict[str, float] = {}

    if not reference_record:
        return {
            "validation_status": "HIGH_RISK",
            "overall_score": 35.0,
            "score_breakdown": {
                "owner_match": 0.0,
                "khasra_match": 0.0,
                "area_match": 0.0,
                "ocr_quality": round(ocr_confidence, 1),
                "historical_consistency": 0.0
            },
            "issues": [{
                "field": "reference_record",
                "severity": "HIGH",
                "title": "Unregistered Parcel / No Match Found",
                "message": "No matching land record found in the state reference registry for this Khasra number and village."
            }],
            "explainability": [{
                "field": "khasra_number",
                "title": "Unregistered / Invalid Plot Identifier",
                "digitized_value": extracted_fields.get("khasra_number") or "Not Identified",
                "reference_value": "No Record Exists",
                "difference": "N/A",
                "confidence": 30.0,
                "recommended_action": "Verify if the parcel is under consolidation (चकबंदी), Gram Sabha communal land, or an illegal encroachment claim."
            }],
            "recommended_actions": [
                "Issue summon to claimant to present original stamped registry deed.",
                "Cross-check physical village map (शजरा) at Tehsil records room."
            ]
        }

    # 1. Khasra Number Comparison (Exact Check - 30% weight)
    khasra_score = 0.0
    ocr_khasra = str(extracted_fields.get("khasra_number") or "").strip()
    ref_khasra = str(reference_record.khasra_no).strip()

    if not ocr_khasra:
        issues.append({
            "field": "khasra_number",
            "severity": "HIGH",
            "title": "Khasra Number Missing",
            "message": "Khasra number could not be confidently detected from document scan."
        })
        explainability.append({
            "field": "khasra_number",
            "title": "Plot Number Extraction Failure",
            "digitized_value": "Missing / Unreadable",
            "reference_value": ref_khasra,
            "difference": "Incomplete scan",
            "confidence": 40.0,
            "recommended_action": "Upload a clearer scan or inspect original physical revenue book."
        })
        khasra_score = 40.0
    elif ocr_khasra == ref_khasra:
        khasra_score = 100.0
    else:
        khasra_score = 25.0
        issues.append({
            "field": "khasra_number",
            "severity": "HIGH",
            "title": "Khasra Number Mismatch",
            "message": f"Digitized Khasra '{ocr_khasra}' does not match reference parcel '{ref_khasra}'. Target plot identity conflict."
        })
        explainability.append({
            "field": "khasra_number",
            "title": "Khasra Plot Identification Conflict",
            "digitized_value": ocr_khasra,
            "reference_value": ref_khasra,
            "difference": f"Parcel Mismatch: {ocr_khasra} ≠ {ref_khasra}",
            "confidence": 25.0,
            "recommended_action": "High alert: Potential wrong parcel digitization or forged deed. Cross-check village Shajra (शजरा) cadastral map."
        })

    # 2. Owner Name Comparison (Fuzzy Check - 25% weight)
    owner_score = 0.0
    ocr_owner = str(extracted_fields.get("owner_name") or "").strip()
    ref_owner = str(reference_record.owner_name).strip()

    if not ocr_owner:
        owner_score = 50.0
        issues.append({
            "field": "owner_name",
            "severity": "MEDIUM",
            "title": "Owner Name Missing",
            "message": "Owner name could not be reliably extracted from the document."
        })
    else:
        # RapidFuzz token sort ratio & partial ratio
        ratio = fuzz.token_sort_ratio(ocr_owner.lower(), ref_owner.lower())
        partial = fuzz.partial_ratio(ocr_owner.lower(), ref_owner.lower())
        fuzz_val = max(ratio, partial)
        owner_score = round(float(fuzz_val), 1)

        if fuzz_val >= 90:
            pass # Valid match (e.g. Ramesh Kumar vs Ramesh Kr. -> 94%)
        elif fuzz_val >= 70:
            issues.append({
                "field": "owner_name",
                "severity": "MEDIUM",
                "title": "Owner Name Variation (Likely Match)",
                "message": f"Digitized name '{ocr_owner}' matches reference '{ref_owner}' with {fuzz_val:.0f}% similarity."
            })
            explainability.append({
                "field": "owner_name",
                "title": "Owner Name Orthographic Variation",
                "digitized_value": ocr_owner,
                "reference_value": ref_owner,
                "difference": f"{100 - fuzz_val:.0f}% lexical deviation",
                "confidence": fuzz_val,
                "recommended_action": "Confirm identity through Aadhaar / Voter ID or Patwari verification report before title endorsement."
            })
        else:
            issues.append({
                "field": "owner_name",
                "severity": "HIGH",
                "title": "Owner Name Mismatch",
                "message": f"Digitized owner '{ocr_owner}' diverges significantly from registered owner '{ref_owner}'."
            })
            explainability.append({
                "field": "owner_name",
                "title": "Severe Title Holder Divergence",
                "digitized_value": ocr_owner,
                "reference_value": ref_owner,
                "difference": f"Low match confidence ({fuzz_val:.0f}%)",
                "confidence": fuzz_val,
                "recommended_action": "Cross-examine mutation register to check if an unregistered sale deed or inheritance dispute exists."
            })

    # 3. Area Comparison (Numeric Tolerance Check - 20% weight)
    area_score = 0.0
    ocr_area = extracted_fields.get("area")
    ref_area = float(reference_record.area_hectares)

    if ocr_area is None:
        area_score = 50.0
        issues.append({
            "field": "area",
            "severity": "MEDIUM",
            "title": "Area Field Missing",
            "message": "Numeric parcel area was not identified in OCR."
        })
    else:
        ocr_area = float(ocr_area)
        diff = abs(ocr_area - ref_area)
        pct_diff = (diff / ref_area) * 100 if ref_area > 0 else 0

        if diff <= 0.01: # Within 0.01 hectare (exact or rounding tolerance)
            area_score = 100.0
        elif pct_diff <= 5.0: # Minor survey deviation within 5%
            area_score = 88.0
            issues.append({
                "field": "area",
                "severity": "LOW",
                "title": "Minor Area Tolerance Variance",
                "message": f"Digitized area ({ocr_area:.2f} ha) differs by {diff:.2f} ha ({pct_diff:.1f}%) from reference ({ref_area:.2f} ha)."
            })
        elif pct_diff <= 25.0: # Moderate mismatch e.g. 1.20 ha vs 1.05 ha (diff 0.15 ha, ~14.3%)
            area_score = max(50.0, round(100.0 - (pct_diff * 2.5), 1))
            issues.append({
                "field": "area",
                "severity": "MEDIUM",
                "title": "Area Mismatch Detected",
                "message": f"Digitized area ({ocr_area:.2f} ha) exceeds/lags reference record ({ref_area:.2f} ha) by {diff:.2f} ha."
            })
            explainability.append({
                "field": "area",
                "title": "Area Discrepancy Flag",
                "digitized_value": f"{ocr_area:.2f} ha",
                "reference_value": f"{ref_area:.2f} ha",
                "difference": f"{'+' if ocr_area > ref_area else '-'}{diff:.2f} ha ({pct_diff:.1f}%)",
                "confidence": area_score,
                "recommended_action": "Verify current survey / mutation record. Order field measurement (पैमाइश) by Revenue Inspector."
            })
        else: # Severe area inflation / deflation
            area_score = max(20.0, round(100.0 - pct_diff, 1))
            issues.append({
                "field": "area",
                "severity": "HIGH",
                "title": "Severe Area Inflation / Deflation",
                "message": f"Major area discrepancy: Document shows {ocr_area:.2f} ha, while official registry has {ref_area:.2f} ha (Delta: {diff:.2f} ha)."
            })
            explainability.append({
                "field": "area",
                "title": "Substantial Area Inflation Risk",
                "digitized_value": f"{ocr_area:.2f} ha",
                "reference_value": f"{ref_area:.2f} ha",
                "difference": f"Major Delta: {diff:.2f} ha ({pct_diff:.1f}%)",
                "confidence": area_score,
                "recommended_action": "Flag for anti-encroachment review. Prevent any registration until ground physical survey is completed."
            })

    # 4. OCR Quality & Completeness (15% weight)
    ocr_quality_score = max(40.0, min(100.0, float(ocr_confidence)))
    if ocr_quality_score < 70.0:
        issues.append({
            "field": "ocr_quality",
            "severity": "LOW",
            "title": "Low Scan Confidence",
            "message": f"Average OCR character confidence is {ocr_quality_score:.1f}%. Some characters may be degraded or smudged."
        })

    # 5. Historical Consistency & Legal Status Checks (10% weight)
    status_score = 100.0

    # Dispute status check
    if reference_record.dispute_status and reference_record.dispute_status != "CLEAR":
        status_score -= 50.0
        dispute_type = reference_record.dispute_status.replace("_", " ").title()
        issues.append({
            "field": "dispute_status",
            "severity": "HIGH",
            "title": f"Active Legal Encumbrance: {dispute_type}",
            "message": f"This parcel is subject to an active {dispute_type} according to the district registry."
        })
        explainability.append({
            "field": "dispute_status",
            "title": "Active Civil Litigation / Lien",
            "digitized_value": "Clean Document Presented",
            "reference_value": dispute_type,
            "difference": "Unreported Legal Stay / Encumbrance",
            "confidence": 45.0,
            "recommended_action": "Do not approve transactions. Parcel is under legal hold pending court decree."
        })

    # Mutation status check
    if reference_record.mutation_status and "PENDING" in reference_record.mutation_status:
        status_score -= 35.0
        issues.append({
            "field": "mutation_status",
            "severity": "MEDIUM",
            "title": "Mutation Pending / Succession Objection",
            "message": "A mutation case or succession objection is currently pending before the Tehsildar court."
        })
        explainability.append({
            "field": "mutation_status",
            "title": "Unfinalized Mutation Proceedings",
            "digitized_value": "Purports Clear Title",
            "reference_value": "Pending Heir Objection (दाखिल-खारिज लंबित)",
            "difference": "Title not finalized",
            "confidence": 60.0,
            "recommended_action": "Withhold digitization approval until Tehsildar issues final mutation certificate."
        })

    status_score = max(20.0, min(100.0, status_score))

    # Calculate Weighted Overall Confidence Score
    # Khasra: 30%, Owner: 25%, Area: 20%, OCR: 15%, Status: 10%
    overall_score = (
        (khasra_score * 0.30) +
        (owner_score * 0.25) +
        (area_score * 0.20) +
        (ocr_quality_score * 0.15) +
        (status_score * 0.10)
    )
    overall_score = round(overall_score, 1)

    # Classify overall validation status
    # 90 - 100 with NO issues: VALID
    # Any MEDIUM issue or score 75 - 89: REVIEW_REQUIRED
    # Any HIGH issue or score < 75: HIGH_RISK
    has_high = any(issue["severity"] == "HIGH" for issue in issues)
    has_medium = any(issue["severity"] == "MEDIUM" for issue in issues)

    if has_high or overall_score < 75.0:
        validation_status = "HIGH_RISK"
    elif has_medium or overall_score < 90.0:
        validation_status = "REVIEW_REQUIRED"
    else:
        validation_status = "VALID"

    # Default explainability entry if all clean
    if not explainability:
        explainability.append({
            "field": "overall",
            "title": "Fully Verified & Consistent Record",
            "digitized_value": f"Khasra {ocr_khasra}, {ocr_owner}, {ocr_area} ha",
            "reference_value": f"Khasra {ref_khasra}, {ref_owner}, {ref_area} ha",
            "difference": "Zero Discrepancies Found (100% Concordance)",
            "confidence": overall_score,
            "recommended_action": "Record is ready for automated revenue seal and officer approval."
        })

    return {
        "validation_status": validation_status,
        "overall_score": overall_score,
        "score_breakdown": {
            "khasra_match": round(khasra_score, 1),
            "owner_match": round(owner_score, 1),
            "area_match": round(area_score, 1),
            "ocr_quality": round(ocr_quality_score, 1),
            "historical_consistency": round(status_score, 1)
        },
        "issues": issues,
        "explainability": explainability,
        "recommended_actions": [
            exp["recommended_action"] for exp in explainability if "recommended_action" in exp
        ]
    }
