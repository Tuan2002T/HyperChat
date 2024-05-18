const express = require('express');
const { createMessage, sendMessage, getAllMessagesByChatId, retrieveMessages, deleteMessage, sendMessages, forwardMessages, notificationMessage } = require('../Controller/messageController');

const router = express.Router();
const auth = require('../middelware/auth');
// router.post("/", createMessage);
router.post("/sendMessage", sendMessage)
router.post("/sendMessages", sendMessages)
router.get("/getAllMessagesByChatId/:chatId", getAllMessagesByChatId);
router.post("/retrieveMessages/:messageId", retrieveMessages);
router.put("/deleteMessage", deleteMessage);
router.post("/forwadMessages", forwardMessages)
router.post("/notificationMessage", auth, notificationMessage)
module.exports = router;