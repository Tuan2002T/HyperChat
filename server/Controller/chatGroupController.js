const chatGroupModel = require("../Model/chatGroupModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const createChatGroup = async (req, res) => {

    const  {groupName, members} = req.body;
    try {
        const chatGroup = await chatGroupModel.findOne({ groupName });
        if (chatGroup) {
            return res.status(400).json({ message: "Nhóm chat đã tồn tại" });
        }

        const newChatGroup = new chatGroupModel({groupName, members});

        const savedChatGroup = await newChatGroup.save();

        
        res.status(200).json(savedChatGroup);
    } catch (error) {

        console.log('error', error.message);

        res.status(500).json({ message: error.message });
    }
};

const getChatGroupById = async (req, res) => {
    try {
        const chatGroup = await chatGroupModel.findById(req.params.id);
        if (!chatGroup) {
            return res.status(404).json({ message: "Không tìm thấy ChatGroup " });
        }
        res.status(200).json(chatGroup);
    } catch (error) {
        console.log('Lỗi tìm chatgroup', error);
        res.status(404).json({ message: error.message });
    }
};

const addMemberToChatGroup = async (req, res) => {
    const { chatGroupId, userId } = req.body;
    try {
        const chatGroup = await chatGroupModel.findById(chatGroupId);
        if (!chatGroup) {
            return res.status(404).json({ message: "Không tìm thấy ChatGroup " });
        }

        if(chatGroup.members.includes(userId)){
            return res.status(400).json({message: "Người dùng đã tồn tại trong nhóm chat"});
        }
        chatGroup.members.push(userId);



        const updatedChatGroup = await chatGroup.save();

        res.status(200).json(updatedChatGroup);
    }
    catch (error) {
        console.log('Lỗi tìm chatgroup', error);
        res.status(404).json({ message: error.message });
    }
}

module.exports = { createChatGroup, getChatGroupById, addMemberToChatGroup };