FROM node:16.13.0

WORKDIR /src

ADD package.json .
ADD package-lock.json .
RUN npm ci

ADD . /src

ENTRYPOINT npm start
