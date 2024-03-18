const userModel = require("../Model/userModel");
const friendsModel = require("../Model/friendsModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const dotenv = require('dotenv');
dotenv.config();
// const { s3 } = require("../AWS/aws");


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

const registerUser = async (req, res) => {
    try {
        const { userName, password, fullname, email, phoneNumber } = req.body;

        let user = await userModel.findOne({ email });

        if (user) return res.status(400).json({ error: "Email đã tồn tại." });

        if (!validator.isMobilePhone(phoneNumber, "vi-VN")) return res.status(400).json({ error: "Số điện thoại không hợp lệ." });

        user = await userModel.findOne({ phoneNumber });

        if (user) return res.status(400).json({ error: "Số điện thoại đã tồn tại." });

        if (!userName || !password || !email || !fullname) return res.status(400).json({ error: "Bắt buộc nhập đầy đủ thông tin." });

        if (!validator.isStrongPassword(password)) return res.status(400).json({ error: "Mật khẩu không đủ mạnh." });

        if (!validator.isEmail(email)) return res.status(400).json({ error: "Email không hợp lệ." });

        if (!validator.isMobilePhone(phoneNumber, "vi-VN")) return res.status(400).json({ error: "Số điện thoại không hợp lệ." });

        user = new userModel({ userName, password, email, phoneNumber, fullname });

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const token = createToken(user._id);

        res.status(200).json({ _id: user._id, user: userName, password, email, phoneNumber, fullname, token });
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).json({ error: "Lỗi server." });
    }
}

const loginUser = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        let user = await userModel
            .findOne({ phoneNumber })
        if (!user) return res.status(400).json({ error: "Số điện thoại không tồn tại." });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Mật khẩu không đúng." });
        const token = createToken(user._id);
        res.status(200).json({ _id: user._id, user: user.userName, phoneNumber, token });
        console.log("Đăng nhập thành công.");
    }
    catch (error) {
        console.log("Error: ", error);
        res.status(500).json({ error: "Lỗi server." });
    }
}

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
// const updateUser = async (req, res) => {
//     try {
//         console.log("req.file: ", req.body);
//         let avatar = req.file;
//         console.log("avatar: ", avatar);
//         avatar = req.file?.originalname.split(".");
//         // console.log("avatar: ", avatar);
//         // const fileType = avatar[avatar.length - 1];
//         // const filePath = `${Date.now().toString()}.${fileType}`;
//         // const paramsS3 ={
//         //     Bucket: bucketName,
//         //     Key: filePath,
//         //     Body: req.file.buffer,
//         //     ContentType: req.file.mimetype,
//         // }

//         // s3.upload(paramsS3, (error, data) => {
//         //     if (error) {
//         //         console.log("Error: ", error);
//         //         res.status(500).json({ error: "Lỗi server." });
//         //     }
//         //     user.avatar = data.Location;
//         //     console.log("user: ", data.Location);
//         // });

//         // await user.save();
//         res.status(200).json(avatar);

//     }
//     catch (error) {
//         console.log("Error: ", error);
//         res.status(500).json({ error: "Lỗi server." });
//     }
// }
// const updateUser1 = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).send('No file uploaded.');
//           }
//         const fileData = {
//             fieldname: req.file.fieldname,
//             originalname: req.file.originalname,
//             encoding: req.file.encoding,
//             mimetype: req.file.mimetype,
//             buffer: req.file.buffer,
//             size: req.file.size
//           };
//         console.log("req.file: ", req.file);    
//         return res.status(200).json({ fileData });
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// };

const updateUser = async (req, res) => {
    const userId = req.params.id; // Lấy ID của người dùng từ tham số URL
    const { userName, fullname } = req.body; // Lấy các trường cần cập nhật từ body của yêu cầu
    let avatar = req.file; // Lấy file ảnh từ yêu cầu
    console.log("req.body: ", avatar);
    try {
        let avatarName;
        // Tìm người dùng trong cơ sở dữ liệu
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }
        //upload ảnh lên s3
        avatar = req.file?.originalname.split(".");
        const fileType = avatar[avatar.length - 1];
        const filePath = `avatar.${Date.now().toString()}.${fileType}`;
        // console.log("filePath: ", filePath);
        const paramsS3 = {
            Bucket: bucketName,
            Key: filePath,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }
        s3.upload(paramsS3, async(err, data) => {
            if (err) {
                console.log("error=", err);
                return res.send("Internal server error!")
            } else {
                const imageURL = data.Location;
                const paramsDynamoDb = {
                    TableName: tableName,
                    Item: {
                        idUser: userId,
                        avatar: imageURL,
                    },
                };
                await dynamodb.put(paramsDynamoDb).promise();
            }
        });
    
        const params = { TableName: tableName };
        const data = await dynamodb.scan(params).promise();
        data.Items.forEach((item) => {
            if (item.idUser === userId) {
                avatarName = item.avatar;
            }
        });
        console.log("data=", avatarName);;
        // Cập nhật từng trường
        if (userName) user.userName = userName;
        if (fullname) user.fullname = fullname;
        if (avatarName) user.avatar = avatarName;
        // Lưu thay đổi
        const updatedUser = await user.save();

        return res.status(200).json({ user: updatedUser });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
//Friends
const sendFriendInvitations = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const friend = new friendsModel({ sender, receiver });
        await friend.save();
        res.status(200).json(friend);
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(500).json(error);
    }
}

const acceptFriendInvitations = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const friend = await friendsModel.findOne({ sender, receiver });
        friend.status = "accepted";
        await friend.save();
        res.status(200).json(friend);
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(500).json(error);
    }
}
//sử dụng để xoá friend và từ chối lời mời kết bạn
const deleteFriend = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const friend = await friendsModel.deleteMany({ sender, receiver });
        res.status(200).json(friend);
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(500).json(error);
    }
}

const getFriendsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const friends = await friendsModel.find({ $or: [{ sender: userId }, { receiver: userId }] });
        res.status(200).json(friends);
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(500).json(error);
    }
}

const findFriend = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const friend = await friendsModel.findOne({ sender, receiver });
        res.status(200).json(friend);
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(500).json(error);
    }
}


module.exports = { registerUser, loginUser, getUsers, findUser, findUserByPhoneNumber, updateUser,sendFriendInvitations, acceptFriendInvitations ,deleteFriend, getFriendsByUserId, findFriend,upload };
