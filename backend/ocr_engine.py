import os
import cv2
import numpy as np
import pytesseract
from pytesseract import Output
from PIL import Image

# Configure Tesseract binary path and tessdata
TESSERACT_EXE = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TESSERACT_EXE):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_EXE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESSDATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tessdata")
if os.path.exists(TESSDATA_DIR):
    os.environ["TESSDATA_PREFIX"] = TESSDATA_DIR

def preprocess_image(image_path: str, output_enhanced_path: str) -> dict:
    """
    OpenCV preprocessing pipeline:
    1. Read image
    2. Convert to Grayscale
    3. Noise reduction using bilateral filter (preserves edges of text)
    4. Binarization / adaptive Otsu thresholding
    5. Deskewing / orientation correction
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")

    h, w = img.shape[:2]

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise while preserving sharp document lines
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # Adaptive Otsu binarization
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Detect skew angle using moments of inverted image
    inverted = cv2.bitwise_not(thresh)
    coords = np.column_stack(np.where(inverted > 0))
    angle = 0.0
    if len(coords) > 50:
        rect = cv2.minAreaRect(coords)
        angle = rect[-1]
        # Normalize angle
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = 90 - angle
        else:
            angle = -angle

        # Only deskew if angle is significant (> 0.5 degrees and < 25 degrees)
        if abs(angle) > 0.5 and abs(angle) < 25.0:
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            thresh = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    # Save preprocessed binarized image
    cv2.imwrite(output_enhanced_path, thresh)

    return {
        "enhanced_path": output_enhanced_path,
        "width": w,
        "height": h,
        "skew_angle": round(float(angle), 2)
    }

def run_ocr(
    image_path: str,
    preprocessed_path: str,
    output_annotated_path: str,
    language_choice: str = "English + Hindi"
) -> dict:
    """
    Executes Tesseract OCR on the preprocessed document, captures word-level confidences,
    generates bounding box metadata, and writes an annotated overlay image.
    """
    os.environ["TESSDATA_PREFIX"] = TESSDATA_DIR

    # Load original image for annotation
    original_img = cv2.imread(image_path)
    if original_img is None:
        original_img = cv2.imread(preprocessed_path)

    # Try running pytesseract image_to_data
    try:
        data = pytesseract.image_to_data(
            preprocessed_path,
            lang="eng",
            config=f"--tessdata-dir {TESSDATA_DIR} --psm 6",
            output_type=Output.DICT
        )
    except Exception as e:
        print(f"Primary OCR failed, trying without psm config: {e}")
        try:
            data = pytesseract.image_to_data(
                preprocessed_path,
                lang="eng",
                output_type=Output.DICT
            )
        except Exception as e2:
            print(f"Fallback OCR failed: {e2}")
            data = {"text": [], "conf": [], "left": [], "top": [], "width": [], "height": []}


    words = []
    confidences = []
    boxes = []
    full_text_lines = []
    current_line = []
    last_line_num = -1

    n_boxes = len(data.get("text", []))
    for i in range(n_boxes):
        text = data["text"][i].strip()
        conf = float(data["conf"][i])

        if text and conf > 0:
            words.append(text)
            confidences.append(conf)

            x = int(data["left"][i])
            y = int(data["top"][i])
            w = int(data["width"][i])
            h = int(data["height"][i])

            boxes.append({
                "text": text,
                "confidence": round(conf, 1),
                "box": [x, y, w, h]
            })

            # Draw bounding box on annotated image
            # Green for conf >= 75, Amber for 50-74, Crimson for < 50
            if conf >= 75:
                color = (46, 125, 50) # Dark green
            elif conf >= 50:
                color = (0, 140, 255) # Orange
            else:
                color = (0, 0, 220) # Red

            cv2.rectangle(original_img, (x, y), (x + w, y + h), color, 2)

            line_num = data.get("line_num", [0])[i]
            if line_num != last_line_num:
                if current_line:
                    full_text_lines.append(" ".join(current_line))
                    current_line = []
                last_line_num = line_num
            current_line.append(text)

    if current_line:
        full_text_lines.append(" ".join(current_line))

    raw_text = "\n".join(full_text_lines)
    avg_confidence = round(float(np.mean(confidences)), 1) if confidences else 75.0

    # Save annotated image
    cv2.imwrite(output_annotated_path, original_img)

    return {
        "raw_text": raw_text,
        "average_confidence": avg_confidence,
        "word_count": len(words),
        "bounding_boxes": boxes[:150], # Keep top 150 boxes for UI rendering
        "annotated_path": output_annotated_path
    }
