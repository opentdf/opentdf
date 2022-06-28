ARG NODE_VERSION=lts
# multi-stage build

# depender - get production dependencies
FROM node:${NODE_VERSION} as depender
WORKDIR /build/
COPY package-lock.json package.json opentdf-client-0.2.1.tgz ./
RUN npm ci

# builder - create-react-app build
FROM depender as builder
WORKDIR /build/
COPY resource/ resource/
COPY src/ src/
COPY webpack.config.js/ .
COPY bootstrap.py/ .
RUN pipenv install --dev
RUN pipenv run bootstrap
RUN npm run build
#COPY dist/ dist/

# server - nginx alpine
FROM nginx:stable-alpine as server
COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx-default.conf /etc/nginx/templates/default.conf.template
ENV KEYCLOAK_HOST "http://localhost:65432/auth"
ENV KAS_HOST "http://localhost:65432/api/kas"
ENV KEYCLOAK_CLIENT_ID "abacus-web"
ENV KEYCLOAK_REALM "tdf"

EXPOSE 80
