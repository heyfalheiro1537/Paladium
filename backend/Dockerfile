FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System deps if you compile wheels (psycopg, pillow, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

EXPOSE 8000

# If your entrypoint is backend/main.py with app = FastAPI()
# Adjust module path if needed (e.g., "app.main:app")
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
