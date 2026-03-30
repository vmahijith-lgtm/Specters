FROM python:3.11-slim

# Install system dependencies required by Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (Specifically Chromium) and its OS dependencies
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy application source
COPY . .

# Expose port (Railway passes $PORT dynamically, but defaults to 8000 here)
EXPOSE 8000

# Start server using the port provided by Railway and binding to 0.0.0.0
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
