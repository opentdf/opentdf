FROM python:3.10-slim

WORKDIR /app

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD . .

EXPOSE 4070

ENTRYPOINT ["uvicorn", "main:app", "--reload", "--port", "4070"]
