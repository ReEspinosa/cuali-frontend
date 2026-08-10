FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev && echo "--- BIN CONTENT ---" && ls -la node_modules/.bin/ | grep -i ts
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/cuali.ai
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
