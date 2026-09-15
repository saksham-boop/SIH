# ── Stage 1: Build image with all system + Python dependencies ──────────────
FROM python:3.11-slim

# Install Tesseract OCR, Hindi language pack, and OpenCV system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-hin \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire project
COPY . .

# Create required runtime directories
RUN mkdir -p backend/uploads backend/annotated data sample_documents

# Expose the port Render will assign via $PORT (defaulting to 10000 for local docker)
EXPOSE 10000

# Start the FastAPI app; Render sets $PORT automatically
CMD ["sh", "-c", "python -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
