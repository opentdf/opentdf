FROM python:3.8-slim

WORKDIR /app

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD . .

ENTRYPOINT ["uvicorn", "main:app", "--reload"]
