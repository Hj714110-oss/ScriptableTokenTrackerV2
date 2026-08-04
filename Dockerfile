FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TOKEN_TRACKER_DIR=/app \
    TOKEN_DB=/app/data/tokens.db \
    TOKEN_ENV=/app/.env \
    TOKEN_SOURCES_FILE=/app/sources.json

WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/*.py ./
RUN mkdir -p /app/data

EXPOSE 8799
CMD ["python", "server.py"]
