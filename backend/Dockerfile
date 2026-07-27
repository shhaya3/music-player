FROM python:3.12-slim
 
WORKDIR /app
 
# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*
 
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
 
COPY . .
 
# Create directories for music and covers
RUN mkdir -p /music /covers
 
EXPOSE 5000
 
CMD ["python", "app.py"]