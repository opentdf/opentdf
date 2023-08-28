ARG NODE_VERSION=lts
# multi-stage build

# depender - get production dependencies
FROM node:${NODE_VERSION} as depender
WORKDIR /build/
COPY package.json ./
RUN npm i


# builder - create-react-app build
FROM depender as builder
WORKDIR /build/
COPY public/ public/
COPY src/ src/
RUN npm run build

# server - nginx alpine
FROM nginx:stable-alpine as server
COPY --from=builder /build/build /usr/share/nginx/html
COPY nginx-default.conf /etc/nginx/templates/default.conf.template
ENV KEYCLOAK_HOST "http://localhost:65432/auth"
ENV KAS_HOST "http://localhost:65432/api/kas"
ENV KEYCLOAK_CLIENT_ID "todo-react-client"
ENV KEYCLOAK_REALM "tdf"

EXPOSE 80
