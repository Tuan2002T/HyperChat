const express = require('express');
const { createMessage, sendMessage, getAllMessagesByChatId } = require('../Controller/messageController');

const router = express.Router();

// router.post("/", createMessage);
router.post("/sendMessage", sendMessage)
router.post("/getAllMessagesByChatId", getAllMessagesByChatId);
module.exports = router;