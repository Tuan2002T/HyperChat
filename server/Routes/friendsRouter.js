const express = require('express');
const { sendFriendRequest, acceptFriendRequest, deleteFriendRequest, getAllSendFriendRequests, unFriend } = require('../Controller/friendsController');

const router = express.Router();

router.post("/sendFriendRequest", sendFriendRequest);
router.post("/acceptFriendRequest", acceptFriendRequest);
router.delete("/deleteFriendRequest", deleteFriendRequest);
router.get("/getAllSendFriendRequest/:userId", getAllSendFriendRequests)
router.delete("/unFriend", unFriend);
module.exports = router;