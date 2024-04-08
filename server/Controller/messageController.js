const messageModel = require('../Model/messageModel');
const chatGroupModel = require('../Model/chatGroupModel');
const chatPrivateModel = require('../Model/chatPrivateModel');
const userModel = require('../Model/userModel');

const multer = require("multer");
const AWS = require("aws-sdk");
const path = require("path");


process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const bucketName = process.env.S3_BUCKET_NAME;
const tableName = process.env.DYNAMODB_TABLE_NAME;
const storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, "");
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, callback) {
        checkFileType(file, callback);
    },
});

function checkFileType(file, callback) {
  const fileTypes = /jpeg|jpg|png|gif|mp4|mov|avi|doc|docx|pdf|txt|ppt|pptx|xls|xlsx|zip|rar|/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) {
        return callback(null, true);
    }
    return callback("Chỉ chấp nhận file ảnh, video hoặc tài liệu!");
}

const sendMessage = async (req, res) => {
  try {
    const { sender, messageText, chatGroupId, chatPrivateId } = req.body;
    const user = await userModel.findById(sender);
    let img = req.file;
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });
    console.log(img);
    let chat;
    if (chatGroupId) {
      chat = await chatGroupModel.findById(chatGroupId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat nhóm không tồn tại' });
      }
    } else if (chatPrivateId) {
      chat = await chatPrivateModel.findById(chatPrivateId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat không tồn tại' });
      }
    } else {
      return res.status(400).json({ error: 'Cần có chatGroupId hoặc chatPrivateId' });
    }

    if (img) {
            const paramsS3 = {
                Bucket: bucketName,
                Key: `message.${Date.now()}.${img.originalname.split(".").pop()}`,
                Body: img.buffer,
                ContentType: img.mimetype,
            };

            const data = await s3.upload(paramsS3).promise();
            img = [data.Location];
        }

        console.log('img', img);

    const newMessage = new messageModel({
      sender,
      content: {
        text: messageText,
        files: img,
      },
      chatGroup: chatGroupId,
      chatPrivate: chatPrivateId,
    });

    const savedMessage = await newMessage.save();
    await chat.updateOne({ $push: { messages: savedMessage._id } });
    res.status(200).json(savedMessage.content.files);
  } catch (error) {
    console.log('Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const getAllMessagesByChatId = async (req, res) => {
  try {
      const { chatId } = req.params;
      console.log('chatId', chatId);
      let chatMessages = [];
      
      const chat = await chatGroupModel.findById(chatId).populate('messages', 'sender content createdAt');
      if (chat) {
          chatMessages = chat.messages;
      } else {
          const chat2 = await chatPrivateModel.findById(chatId).populate('messages', 'sender content createdAt');
          if (chat2) {
              chatMessages = chat2.messages;
          } else {
              return res.status(404).json({ error: 'Chat không tồn tại' });
          }
      }
      
      res.status(200).json(chatMessages);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

const retrieveMessages = async (req, res) => {
  try{
    const messageId = req.params.messageId;
    const message = await messageModel.findById(messageId);
    
    if(!message){
      return res.status(404).json({error: 'Không tìm thấy tin nhắn'});
    }
    message.content.text = 'Tin nhắn đã được thu hồi';
    message.content.files = [];

    await message.save();

    res.status(200).json({message : 'Tin nhắn đã được thu hồi'});
  }
  catch(error){
    console.error('Lỗi khi thu hồi tin nhắn:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await messageModel
      .findById(messageId)
      .populate('chatGroup chatPrivate', 'members');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const chat = message.chatGroup || message.chatPrivate;
    const user = req.user;

    if (!chat.members.includes(user._id)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    await message.delete();
    res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const sendMessages = async (req, res) => {
  try {
    const { sender, messageText, chatGroupId, chatPrivateId } = req.body;
    const user = await userModel.findById(sender);
    let imgs = req.files; // Đổi từ req.file thành req.files để hỗ trợ upload nhiều ảnh

    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    let chat;
    if (chatGroupId) {
      chat = await chatGroupModel.findById(chatGroupId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat nhóm không tồn tại' });
      }
    } else if (chatPrivateId) {
      chat = await chatPrivateModel.findById(chatPrivateId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat không tồn tại' });
      }
    } else {
      return res.status(400).json({ error: 'Cần có chatGroupId hoặc chatPrivateId' });
    }

    if (imgs && imgs.length > 0) {
      const uploadedImages = [];
      for (const img of imgs) {
        const paramsS3 = {
          Bucket: bucketName,
          Key: `message.${Date.now()}.${img.originalname.split(".").pop()}`,
          Body: img.buffer,
          ContentType: img.mimetype,
        };

        const data = await s3.upload(paramsS3).promise();
        uploadedImages.push(data.Location);
      }
      imgs = uploadedImages;
    }

    const newMessage = new messageModel({
      sender,
      content: {
        text: messageText,
        files: imgs,
      },
      chatGroup: chatGroupId,
      chatPrivate: chatPrivateId,
    });

    const savedMessage = await newMessage.save();
    await chat.updateOne({ $push: { messages: savedMessage._id } });
    res.status(200).json(savedMessage.content.files);
  } catch (error) {
    console.log('Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {sendMessage: [upload.single('files'), sendMessage],sendMessages: [upload.array('files', 10), sendMessages], getAllMessagesByChatId, deleteMessage, retrieveMessages};



//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// module.exports = { sendMessage: [upload.array('files', 10), sendMessage], getAllMessagesByChatId };