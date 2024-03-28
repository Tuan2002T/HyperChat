const express = require('express');
const {  getUsers, loginUser, findUser, findUserByPhoneNumber, updateUser, upload, sendOTP, verifyOTPAndRegister, listFriends } = require('../Controller/userController');



const router = express.Router();

router.post("/register/send-otp", sendOTP);
router.post("/register/verifyOTP", verifyOTPAndRegister);
router.post("/login", loginUser);
router.get("/id/:userId", findUser);
router.get("/phone/:phoneNumber", findUserByPhoneNumber);
router.get("/", getUsers)
router.post("/update/:id",upload.single('file'), updateUser);
router.get("/listFriends/:userId", listFriends);
module.exports = router;
