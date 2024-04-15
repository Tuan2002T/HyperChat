const express = require('express');
const { createChatPrivate, findChatPrivateById, findChatPrivateByName } = require('../Controller/chatPrivateController');
const { createChatGroup, getAllChatGroupByUserId, addMembersToChatGroup, deleteMembersChatGroup, deleteChatGroup, outChatGroup, findChatGroupById } = require('../Controller/chatGroupController');

const router = express.Router();
const auth = require('../middelware/auth');
//ChatPrivate
router.post("/createChatPrivate", createChatPrivate)
router.get("/findChatPrivateByName/:userId", findChatPrivateByName)
router.get("/findChatPrivate/:userId", findChatPrivateById)

//ChatGroup
router.post("/createChatGroup", createChatGroup)
router.get("/getAllChatGroupByUserId/:userId", getAllChatGroupByUserId)
router.post("/addMembersToChatGroup/:userId", auth , addMembersToChatGroup)
router.delete("/deleteMembersChatGroup/:chatGroupId", deleteMembersChatGroup)
router.delete("/deleteChatGroup/:userId", auth, deleteChatGroup)
router.delete("/outChatGroup", outChatGroup)
router.get("/findChatGroupById/:chatGroupId", findChatGroupById)    
module.exports = router;