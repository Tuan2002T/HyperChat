const express = require('express');
const { createMessage, sendMessage, getAllMessagesByChatId, retrieveMessages, deleteMessage, sendMessages, forwardMessages } = require('../Controller/messageController');

const router = express.Router();

// router.post("/", createMessage);
router.post("/sendMessage", sendMessage)
router.post("/sendMessages", sendMessages)
router.get("/getAllMessagesByChatId/:chatId", getAllMessagesByChatId);
router.post("/retrieveMessages/:messageId", retrieveMessages);
router.put("/deleteMessage", deleteMessage);
router.post("/forwadMessages", forwardMessages)
module.exports = router;