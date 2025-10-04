# Backend Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p static migrations

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=working_server.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Command to run the application
CMD ["python", "working_server.py"]