const express = require('express');
const { createChatGroup, getChatGroupById, addMemberToChatGroup } = require('../Controller/chatGroupController');

const router = express.Router();

router.post("/", createChatGroup);
router.get("/:id", getChatGroupById);
router.post("/add", addMemberToChatGroup);

module.exports = router;