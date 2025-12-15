# backend/Dockerfile
FROM python:3.11-slim

# system deps for some Python packages (add if your project needs extras)
RUN apt-get update && apt-get install -y gcc libpq-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy requirements first to leverage Docker cache
COPY ./requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copy rest of source
COPY . .

# expose the port expected by Fly (typically 8080 or 8000)
ENV PORT=8000
EXPOSE 8000

# run uvicorn - ensure your FastAPI app is at app.main:app or adjust the path
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]