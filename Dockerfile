FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
COPY src/migrations ./dist/migrations
COPY src/cores/database/seeds ./dist/cores/database/seeds
RUN npm install --omit=dev
CMD ["node", "dist/main.js"]

# ###
# FROM node:18 AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build

# FROM node:18
# WORKDIR /app
# COPY --from=builder /app/dist ./dist
# COPY package*.json ./
# COPY src/migrations ./dist/migrations
# COPY src/seeders ./dist/seeders
# RUN npm install --omit=dev

# # Chạy migrations và seedings trước khi khởi động ứng dụng
# CMD ["sh", "-c", "npm run migration:run && npm run seeding:run && node dist/main.js"]