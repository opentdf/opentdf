FROM node:16.13.0

WORKDIR /src

ADD package.json .
ADD package-lock.json .
COPY opentdf-client-0.1.0.tgz .
RUN npm ci

ADD . /src

ENTRYPOINT npm start
