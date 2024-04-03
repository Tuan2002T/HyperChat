const express = require('express');
const {  getUsers, loginUser, findUser, findUserByPhoneNumber, updateUser, upload, sendOTP, verifyOTPAndRegister, listFriends, sendOTPForgotPassword, verifyOTPForgotPassword, getListChats, changePassword } = require('../Controller/userController');



const router = express.Router();
const auth = require('../middelware/auth');
router.post("/register/send-otp", sendOTP);
router.post("/register/verifyOTP", verifyOTPAndRegister);
router.post("/login", loginUser);
router.get("/id/:userId", findUser);
router.get("/phone/:phoneNumber", findUserByPhoneNumber);
router.get("/", getUsers)
router.post("/update/:id",upload.single('file'), updateUser);
router.get("/listFriends/:userId",auth, listFriends);
router.post("/sendOTPForgotPassword", sendOTPForgotPassword);
router.put("/verifyOTPForgotPassword", verifyOTPForgotPassword);
router.get("/getListChats/:userId", getListChats);
router.put("/changePassword", changePassword);
module.exports = router;
