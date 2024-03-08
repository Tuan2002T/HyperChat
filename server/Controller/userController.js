const userModel = require("../Model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const createToken = (_id) => {
    const jwtkey = process.env.JWT_SECRET_KEY;

    return jwt.sign({ _id }, jwtkey, {
        expiresIn: "7d"
    });
}

const registerUser = async (req, res) => {
    try{
        const { userName, password, fullname, email, phoneNumber } = req.body;
        
        let user = await userModel.findOne({email});

        if(user) return res.status(400).json({error: "Email đã tồn tại."});

        if (!validator.isMobilePhone(phoneNumber, "vi-VN")) return res.status(400).json({ error: "Số điện thoại không hợp lệ." });

        user = await userModel.findOne({ phoneNumber });

        if (user) return res.status(400).json({ error: "Số điện thoại đã tồn tại." });

        if(!userName || !password || !email || !fullname) return res.status(400).json({error: "Bắt buộc nhập đầy đủ thông tin."});

        if(!validator.isStrongPassword(password)) return res.status(400).json({error: "Mật khẩu không đủ mạnh."});

        if(!validator.isEmail(email)) return res.status(400).json({error: "Email không hợp lệ."});

        if(!validator.isMobilePhone(phoneNumber, "vi-VN")) return res.status(400).json({error: "Số điện thoại không hợp lệ."});
 
        user  =  new userModel({userName, password, email,phoneNumber, fullname});
        
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const token = createToken(user._id);

        res.status(200).json({_id: user._id,user: userName, password, email, phoneNumber, fullname,token});
    }catch(error){
        console.log("Error: ", error);
        res.status(500).json({error:"Lỗi server."});
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
    }catch(error){
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
module.exports = { registerUser, loginUser, getUsers, findUser, findUserByPhoneNumber };
