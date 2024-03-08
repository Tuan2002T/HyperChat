const express = require('express');
const { createChatPrivate, findChatPrivate, findChatPrivateById } = require('../Controller/chatPrivateController');

const router = express.Router();

router.post("/", createChatPrivate)
router.get("/:userId", findChatPrivate)
router.get("/:firstId/:secondId", findChatPrivateById)
module.exports = router;