const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy mã token' });
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token không hợp lệ'});
        }

        req.user = decodedToken; // Lưu thông tin người dùng từ token vào request để các hàm sau có thể sử dụng
        next(); // Tiếp tục tiến hành xử lý yêu cầu
    });
};

module.exports = verifyToken;
