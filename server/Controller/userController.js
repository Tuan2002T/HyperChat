const userModel = require("../Model/userModel");
const friendsModel = require("../Model/friendsModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const dotenv = require('dotenv');
dotenv.config();

//Redis
const redis = require('redis');
const redisClient = redis.createClient();

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

redisClient.connect();
//OTP Gmail
const nodeMailer = require("nodemailer");
// Khởi tạo transporter cho nodemailer
const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'truongvantuan02042002@gmail.com', // Email của bạn
        pass: 'wjhm jeqa ciyo kqjt' // Mật khẩu email của bạn
    }
});
const fs = require('fs');

const htmlTemplate = fs.readFileSync('./TemplateSendMail/template.html', 'utf8');

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// AWS
const multer = require("multer");
const AWS = require("aws-sdk");
const path = require("path");
const { log } = require("console");


process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const bucketName = process.env.S3_BUCKET_NAME;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, "");
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, callback) {
        checkFileType(file, callback);
    },
});

function checkFileType(file, callback) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) {
        return callback(null, true);
    }
    return callback("Chỉ chấp nhận file ảnh /jpeg|jpg|png|gif/!");
}




const createToken = (_id) => {
    const jwtkey = process.env.JWT_SECRET_KEY;

    return jwt.sign({ _id }, jwtkey, {
        expiresIn: "7d"
    });
}

const sendOTP = async (req, res) => {
    try {
      const { userName, password, fullname, email, phoneNumber, birthday } = req.body;
      let user = await userModel.findOne({ $or: [{ email }, { userName }] });
      if (user) return res.status(400).json({ error: "Email hoặc Tên đăng nhập đã tồn tại." });
      if (!validator.isMobilePhone(phoneNumber, "vi-VN")) return res.status(400).json({ error: "Số điện thoại không hợp lệ." });
      user = await userModel.findOne({ phoneNumber });
      if (user) return res.status(400).json({ error: "Số điện thoại đã tồn tại." });
      if (!userName || !password || !email || !fullname || !birthday) return res.status(400).json({ error: "Bắt buộc nhập đầy đủ thông tin." });
      if (!validator.isStrongPassword(password)) return res.status(400).json({ error: "Mật khẩu không đủ mạnh." });
      if (!validator.isEmail(email)) return res.status(400).json({ error: "Email không hợp lệ." });
      if (!validator.isMobilePhone(phoneNumber, "vi-VN")) return res.status(400).json({ error: "Số điện thoại không hợp lệ." });
  
      // Tạo mã OTP ngẫu nhiên
      const otp = Math.floor(100000 + Math.random() * 900000);
      console.log("OTP: ", otp);
      const date = new Date();
      const dateStr = formatDate(date);
      const mailOptions = {
        from: "HyperChat",
        to: email,
        subject: 'Your OTP Code',
        html: htmlTemplate.replace('{{otp}}', otp).replace('{{date}}', dateStr).replace('{{fullname}}', fullname)
      };
  
      // Lưu mã OTP vào redis
      const registrationData = { userName, password, fullname, email, phoneNumber, birthday, otp };
      await redisClient.set(email, JSON.stringify(registrationData));
  
      // Đặt thời gian hết hạn cho mã OTP là 60 giây
      await redisClient.expire(email, 60);
  
      // Gửi email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).json({ error: 'Failed to send OTP' });
        } else {
          console.log('Email sent: ' + info.response);
          res.json({ message: 'OTP sent successfully' });
        }
      });
      res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn." });
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({ error: "Lỗi server." });
    }
  }
  const verifyOTPAndRegister = async (req, res) => {
    try {
      const { email, userOTP } = req.body;
      const registrationData = await redisClient.get(email);
  
      // Kiểm tra xem mã OTP đã hết hạn hay chưa
      if (!registrationData) {
        return res.status(400).json({ error: "Mã OTP đã hết hạn." });
      }
  
      const { userName, password, fullname, phoneNumber, birthday, otp } = JSON.parse(registrationData);
      console.log(otp);
  
      // Xác minh mã OTP
      if (!userOTP) {
        return res.status(400).json({ error: "Vui lòng nhập mã OTP." });
      }
      if (userOTP !== otp.toString()) {
        return res.status(400).json({ error: "Mã OTP không chính xác." });
      }
  
      // Tạo người dùng mới
      user = new userModel({ userName, password, email, phoneNumber, fullname, birthday });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
  
      // Xóa mã OTP khỏi Redis
      await redisClient.del(email);
  
      const token = createToken(user._id);
      res.status(200).json({ _id: user._id, user: userName, password, email, phoneNumber, fullname, birthday, token });
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({ error: "Lỗi server." });
    }
  }
const loginUser = async (req, res) => {
    try {
      const { account, password } = req.body;
      let user = await userModel.findOne({
        $or: [
          { userName: account },
          { email: account },
          { phoneNumber: account },
        ],
      });
  
      if (!user)
        return res.status(400).json({ error: "Thông tin đăng nhập không hợp lệ." });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Mật khẩu không đúng." });
  
      const token = createToken(user._id);
      res.status(200).json({
        _id: user._id,
        user: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullname: user.fullname,
        birthday: user.birthday,
        avatar: user.avatar,
        token,
      });
      console.log("Đăng nhập thành công.");
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({ error: "Lỗi server." });
    }
  };

const getUsers = async (req, res) => {
    try {
        const users = await userModel.find();
        res.status(200).json(users);
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(500).json(error);
    }
}

const findUser = async (req, res) => {
    const userId = req.params.userId;
    console.log("userId: ", req.params);
    try {
        const user = await userModel.findById(userId);
        res.status(200).json(user);
    }
    catch (error) {
        console.log("Error: ", error.message);
        res.status(500).json(error);
    }
}

const findUserByPhoneNumber = async (req, res) => {
    const phoneNumber = req.params.phoneNumber;
    console.log("phoneNumber: ", req.params);
    try {
        const user = await userModel.findOne({ phoneNumber });
        res.status(200).json(user);
    }
    catch (error) {
        console.log("Error: ", error.message);
        res.status(500).json(error);
    }
}

const updateUser = async (req, res) => {
    const userId = req.params.id; 
    const { userName, fullname, birthday } = req.body; 
    let avatar = req.file; 

    try {
        // Tìm người dùng trong cơ sở dữ liệu
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        // Cập nhật từng trường nếu dữ liệu được cung cấp
        if (userName) user.userName = userName;
        if (fullname) user.fullname = fullname;
        if (birthday) user.birthday = birthday;

        // Nếu có ảnh được tải lên, tiến hành lưu trữ và cập nhật đường dẫn ảnh
        if (avatar) {
            const paramsS3 = {
                Bucket: bucketName,
                Key: `avatar.${Date.now()}.${avatar.originalname.split(".").pop()}`,
                Body: avatar.buffer,
                ContentType: avatar.mimetype,
            };

            const data = await s3.upload(paramsS3).promise();
            user.avatar = data.Location;
        }

        // Lưu thay đổi
        const updatedUser = await user.save();

        return res.status(200).json({ user: updatedUser });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const sendOTPForgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await userModel.findOne({ email });
      if (!user) return res.status(404).json({ message: "Email không tồn tại." });
      const otp = Math.floor(100000 + Math.random() * 900000);
      console.log("OTP: ", otp);
      const date = new Date();
      const dateStr = formatDate(date);
      const mailOptions = {
        from: "HyperChat",
        to: email,
        subject: 'Your OTP Code',
        html: htmlTemplate.replace('{{otp}}', otp).replace('{{date}}', dateStr).replace('{{fullname}}', user.fullname)
      };
      const regisOTPForgotPassword = { email, otp };
  
      // Đặt thời gian hết hạn là giây
      const expirationTime = 60;
  
      // Lưu mã OTP vào Redis với thời gian hết hạn
      await redisClient.set(email, JSON.stringify(regisOTPForgotPassword));
      await redisClient.expire(email, expirationTime);
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).json({ error: 'Failed to send OTP' });
        } else {
          console.log('Email sent: ' + info.response);
          res.json({ message: 'OTP sent successfully' });
        }
      });
      res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn." });
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({ error: "Lỗi server." });
    }
  }

  
  const verifyOTPForgotPassword = async (req, res) => {
    try {
      const { email, userOTP, password } = req.body;
      const regisOTPForgotPassword = await redisClient.get(email);
  
      if (!regisOTPForgotPassword) {
        return res.status(400).json({ error: "Mã OTP đã hết hạn." });
      }
  
      const { otp } = JSON.parse(regisOTPForgotPassword);
  
      if (!userOTP) {
        return res.status(400).json({ error: "Vui lòng nhập mã OTP." });
      }
  
      if (userOTP !== otp.toString()) {
        return res.status(400).json({ error: "Mã OTP không chính xác." });
      }
  
      const user = await userModel.findOne({ email });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      const updatePas = await user.save();
      res.status(200).json(updatePas);
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({ error: "Lỗi server." });
    }
  };

const listFriends = async (req, res) => {
    try{
        const {userId} = req.params;
        const user = await userModel.findById(userId).populate("friends", "userName email phoneNumber fullname avatar birthday");
        res.status(200).json(user.friends);
    }
    catch(error){
        console.log(error.message);
        res.status(500).json({message: error.message});
    }
}

const getListChats = async (req, res) => {
    try{
        const {userId} = req.params;
        const chatGroup = await userModel.findById(userId).populate('chatGroups', 'name members admin messages avatar');
        const chatPrivate = await userModel.findById(userId).populate('chatPrivate', 'name members messages avatar');
        const chatGroup1 = chatGroup.chatGroups
        const chatPrivate1 = chatPrivate.chatPrivate;
        const chats = [...chatGroup1,...chatPrivate1];
        res.status(200).json(chats);
    }
    catch(error){
        console.log(error.message);
        res.status(500).json({message: error.message});
    }
}
const changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không chính xác." });
        if (!validator.isStrongPassword(newPassword)) return res.status(400).json({ message: "Mật khẩu mới không đủ mạnh." });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.status(200).json({ message: "Đổi mật khẩu thành công." });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}


module.exports = { sendOTP,verifyOTPAndRegister ,loginUser, getUsers, findUser, findUserByPhoneNumber, updateUser, listFriends, upload ,sendOTPForgotPassword, verifyOTPForgotPassword, getListChats, changePassword};
