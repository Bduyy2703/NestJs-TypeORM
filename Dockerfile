# Sử dụng image Node chính thức
FROM node:18

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Copy package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code vào container
COPY . .

# Build project NestJS (file build nằm trong /dist)
RUN npm run build

# Expose cổng mà NestJS chạy
EXPOSE 3000

# Lệnh khởi động ứng dụng
CMD ["npm", "run", "start:prod"]
