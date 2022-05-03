FROM python:3.8-slim

WORKDIR /app

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD . .

# ENTRYPOINT ["uvicorn", "main:app", "--reload", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000", "--log-level", "trace", "--forwarded-allow-ips='*'"]

ENTRYPOINT ["uvicorn", "main:app", "--reload", "--proxy-headers", "--host", "0.0.0.0"]
