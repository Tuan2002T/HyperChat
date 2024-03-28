const express = require('express');
const { createChatPrivate, findChatPrivateById, findChatPrivateByName } = require('../Controller/chatPrivateController');
const { createChatGroup, getAllChatGroupByUserId, addMembersToChatGroup, deleteMembersChatGroup, deleteChatGroup, outChatGroup } = require('../Controller/chatGroupController');

const router = express.Router();

//ChatPrivate
router.post("/createChatPrivate", createChatPrivate)
router.get("/findChatPrivateByName/:userId", findChatPrivateByName)
router.get("/findChatPrivate/:userId", findChatPrivateById)

//ChatGroup
router.post("/createChatGroup", createChatGroup)
router.get("/getAllChatGroupByUserId/:userId", getAllChatGroupByUserId)
router.post("/addMembersToChatGroup", addMembersToChatGroup)
router.delete("/deleteMembersChatGroup/:chatGroupId", deleteMembersChatGroup)
router.delete("/deleteChatGroup", deleteChatGroup)
router.delete("/outChatGroup", outChatGroup)
module.exports = router;