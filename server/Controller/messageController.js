const messageModel = require('../Model/messageModel');

const createMessage = async (req, res) => {
    const { content, sender, chatType, chatId, fileType, fileUrl } = req.body;
    try {
        const newMessage = new messageModel({ content, sender, chatType, chatId, fileType, fileUrl });
        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (error) {
        console.log('error', error.message);
        res.status(500).json({ message: error.message });
    }
};

const getMessagesByChatId = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const messages = await messageModel.find({ chatId });
        res.status(200).json(messages);
    } catch (error) {
        console.log('Lỗi tìm message', error);
        res.status(404).json({ message: error.message });
    }
};

module.exports = { createMessage, getMessagesByChatId };