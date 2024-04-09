# Sử dụng hình ảnh nodejs phiên bản LTS làm cơ sở
FROM node:20

# Thiết lập thư mục làm việc của ứng dụng trong container
WORKDIR /app/server

# Sao chép tất cả các mã nguồn vào thư mục làm việc
COPY . .

# Cài đặt các gói npm
RUN npm install

# Mở cổng 5000 cho ứng dụng
EXPOSE 5000

# Khởi chạy ứng dụng
CMD ["node", "index.js"]
