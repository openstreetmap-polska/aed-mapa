FROM python:3.10.2-slim-buster
WORKDIR /
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY  . .
EXPOSE 8888
CMD ["python", "-m", "http.server", "8888"]
