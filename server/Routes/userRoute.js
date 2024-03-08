const express = require('express');
const { registerUser, getUsers, loginUser, findUser, findUserByPhoneNumber } = require('../Controller/userController');


const router = express.Router();

router.get("/register", registerUser);
router.post("/login", loginUser);
router.get("/id/:userId", findUser);
router.get("/phone/:phoneNumber", findUserByPhoneNumber);
router.get("/", getUsers)


module.exports = router;
