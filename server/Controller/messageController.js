const messageModel = require('../Model/messageModel');
const chatGroupModel = require('../Model/chatGroupModel');
const chatPrivateModel = require('../Model/chatPrivateModel');
const userModel = require('../Model/userModel');
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

const sendMessage = async (req, res) => {
    try {
      const { sender, messageText, files, chatGroupId, chatPrivateId } = req.body;
      const user = await userModel.findById(sender);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      let chat;
      if (chatGroupId) {
        chat = await chatGroupModel.findById(chatGroupId);
        if (!chat) {
          return res.status(404).json({ error: 'Chat group not found' });
        }
      } else if (chatPrivateId) {
        chat = await chatPrivateModel.findById(chatPrivateId);
        if (!chat) {
          return res.status(404).json({ error: 'Chat private not found' });
        }
      } else {
        return res.status(400).json({ error: 'Either chatGroupId or chatPrivateId is required' });
      }
  
      const newMessage = new messageModel({
        sender,
        content: {
          text: messageText,
          files: files || []
        },
        chatGroup: chatGroupId,
        chatPrivate: chatPrivateId,
      });
  
      const savedMessage = await newMessage.save();
      await chat.updateOne({ $push: { messages: savedMessage._id } });
  
      res.status(200).json({ message: 'Message sent successfully', data: savedMessage });
    } catch (error) {
      console.log('Error:', error.message);
      res.status(500).json({ message: error.message });
    }
  };

const getAllMessagesByChatId = async (req, res) => {
    try {
        const { chatGroupId, chatPrivateId } = req.body;
        console.log(chatPrivateId, chatGroupId);
        let query;
        if (chatGroupId) {
          query = await chatGroupModel.findById(chatGroupId).populate('messages', 'sender content createdAt');
        } else if (chatPrivateId) {
          query = await chatPrivateModel.findById(chatPrivateId).populate('messages', 'sender content createdAt');
        }
    
    
        res.status(200).json(query.messages);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }

};


module.exports = { createMessage, sendMessage, getAllMessagesByChatId};