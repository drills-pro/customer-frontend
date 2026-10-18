FROM node:24-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Vite inlines VITE_* at build time, so pass them as build args (see .env.example).
ARG VITE_ZITADEL_CLIENT_ID
ARG VITE_ZITADEL_ISSUER
ARG VITE_ZITADEL_PROJECT_ID
ARG VITE_API_URL
RUN pnpm build

FROM nginxinc/nginx-unprivileged:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
