const chatPrivateModel = require('../Model/chatPrivateModel');
const userModel = require('../Model/userModel');

const createChatPrivate = async (req, res) => {
    try {
        const { user1, user2 } = req.body;
        if (!user1 || ! user2) {
            return res.status(400).json({ message: "Thiếu thông tin người dùng." });
        }
        const checkChatPrivate = await chatPrivateModel.findOne({ members: {$all:[user1, user2] }});
        if (checkChatPrivate) {
            return res.status(400).json({ message: "Đã tồn tại cuộc trò chuyện." });
        }
        const name1 = await userModel.findById(user1);
        const name2 = await userModel.findById(user2);
        const chatPrivate = await chatPrivateModel.findOne({ members: {$all:[user1, user2] }});

        if (chatPrivate) {
            return res.status(200).json("Đã tồn tại cuộc trò chuyện.");
        }
        const newChatPrivate = new chatPrivateModel({
            name: `${name1.fullname} & ${name2.fullname}`,
            members: [user1, user2],
        });
        await userModel.findByIdAndUpdate(user1, { $push: { chatPrivate: newChatPrivate._id } });
        await userModel.findByIdAndUpdate(user2, { $push: { chatPrivate: newChatPrivate._id } });
        const savedChatPrivate = await newChatPrivate.save();
        res.status(200).json(savedChatPrivate);
    } catch (error) {
        console.log('error', error.message);
        res.status(500).json({ message: error.message });
    }
}

const findChatPrivateById = async (req, res) => {
    try{
        const userId = req.params.userId;
        const chatPrivate = await userModel.findOne({_id: userId}).populate('chatPrivate', 'name members messages avatar');
        res.status(200).json(chatPrivate.chatPrivate);
    }
    catch(error){
        console.log('error', error.message);
        res.status(500).json({message: error.message});
    }
}

const findChatPrivateByName = async (req, res) => {
    try{
        const {name} = req.body;
        const userId = req.params.userId;
        const chatPrivate = await userModel.findOne({_id: userId}).populate('chatPrivate', 'name members messages avatar');
        const a = chatPrivate.chatPrivate.find(chat => chat.name === name);
        res.status(200).json(a);
    }
    catch(error){
        console.log('error', error.message);
        res.status(500).json({message: error.message});
    }
}

module.exports = {createChatPrivate , findChatPrivateById, findChatPrivateByName};