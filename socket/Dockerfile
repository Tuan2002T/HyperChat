# Sử dụng hình ảnh nodejs phiên bản LTS làm cơ sở
FROM node:10-alpine

# Thiết lập thư mục làm việc của ứng dụng trong container
WORKDIR /app/socket

# Sao chép tất cả các mã nguồn vào thư mục làm việc
COPY . .

# Cài đặt các gói npm
RUN npm install

# Mở cổng 3000 cho ứng dụng
EXPOSE 3000

# Khởi chạy ứng dụng
CMD ["node", "index.js"]
