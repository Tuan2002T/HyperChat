const express = require('express');
const { createChatGroup, getChatGroupById, addMemberToChatGroup, deleteUserChatGroup, deleteChatGroup } = require('../Controller/chatGroupController');

const router = express.Router();

router.post("/", createChatGroup);
router.get("/:id", getChatGroupById);
router.post("/add", addMemberToChatGroup);
router.post("/deleteUser", deleteUserChatGroup);
router.post("/deleteChatGroup/:idChatGroup", deleteChatGroup);

module.exports = router;