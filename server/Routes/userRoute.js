const express = require('express');
const {  getUsers, loginUser, findUser, findUserByPhoneNumber, updateUser, upload, sendFriendInvitations, acceptFriendInvitations, deleteFriend, getFriendsByUserId, findFriend, sendOTP, verifyOTPAndRegister } = require('../Controller/userController');



const router = express.Router();

router.post("/register/send-otp", sendOTP);
router.post("/register/verifyOTP", verifyOTPAndRegister);
router.post("/login", loginUser);
router.get("/id/:userId", findUser);
router.get("/phone/:phoneNumber", findUserByPhoneNumber);
router.get("/", getUsers)
router.post("/update/:id",upload.single('file'), updateUser);
router.post("/sendFriend", sendFriendInvitations);
router.post("/acceptFriend", acceptFriendInvitations);
router.post("/deleteFriend", deleteFriend);
router.get("/getFriend/:userId", getFriendsByUserId);
router.get("/findFriend", findFriend);
module.exports = router;
