# Frontend - build and serve with nginx
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile 2>/dev/null || npm ci
COPY . .
RUN pnpm run build 2>/dev/null || npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
