const chatPrivateModel = require('../Model/chatPrivateModel');


const createChatPrivate = async (req, res) => {
    const { firstId, secondId } = req.body;
    if (!firstId || !secondId) {
        return res.status(400).json({ message: "Thiếu thông tin người dùng." });
    }
    try {
        const chatPrivate = await chatPrivateModel.findOne({ members: {$all:[firstId, secondId] }});

        if (chatPrivate) {
            return res.status(200).json(chatPrivate);
        }
        const newChatPrivate = new chatPrivateModel({
            members: [firstId, secondId],
        });
        const savedChatPrivate = await newChatPrivate.save();
        res.status(201).json(savedChatPrivate);
    } catch (error) {
        console.log('error', error.message);
        res.status(500).json({ message: error.message });
    }
}

const findChatPrivate = async (req, res) => {
    const userId = req.params.userId;
    try{
        const chatPrivate = await chatPrivateModel.find({members: {$in:[userId]}});
        res.status(200).json(chatPrivate);
    }
    catch(error){
        console.log('error', error.message);
        res.status(500).json({message: error.message});
    }
}

const findChatPrivateById = async (req, res) => {
    const {firstId, secondId} = req.body;

    try{
        const chatPrivate = await chatPrivateModel.find({members:  {$all:[firstId, secondId]}});
        res.status(200).json(chatPrivate);
    }
    catch(error){
        console.log('error', error.message);
        res.status(500).json({message: error.message});
    }
}
module.exports = {createChatPrivate , findChatPrivate, findChatPrivateById};