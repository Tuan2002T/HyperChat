const userModel = require("../Model/userModel");
const friendsModel = require("../Model/friendsModel");

const sendFriendRequest = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const user = await userModel.findById(receiver);
        const checkFriend = await userModel.findOne({ _id: receiver, friends: sender });

        const checkFriendRequest = await friendsModel.findOne({ sender : receiver, receiver: sender });

        if (checkFriendRequest) {
            return res.status(500).json({ error: "Người này đã gửi lời mời kết bạn đến bạn" });
        }

        if (checkFriend) {
            return res.status(500).json({ error: "Đã kết bạn" });
        }
        if (sender === receiver) {
            return res.status(500).json({ error: "Không thể gửi lời mời kết bạn cho chính mình" });
        }
        if (!user) {
            return res.status(500).json({ error: "Người dùng không tồn tại" });
        }
        const friend = await friendsModel.findOne({ sender, receiver });
        if (friend) { 
            return res.status(500).json({ error: "Đã gửi lời mời kết bạn" });
        }
        const newFriendRequest = new friendsModel({
            sender,
            receiver
        });
        await newFriendRequest.save();
        res.status(200).json({ message: "Gửi lời mời kết bạn thành công" });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};

const acceptFriendRequest = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const friendRequest = await friendsModel.findOne({ sender, receiver });
        if (!friendRequest) {
            return res.status(400).json({ message: "Không tìm thấy lời mời kết bạn" });
        }
        await userModel.findByIdAndUpdate(receiver, { $push: { friends: sender } });
        await userModel.findByIdAndUpdate(sender, { $push: { friends: receiver } });
        await friendsModel.deleteMany({ sender, receiver });
        res.status(200).json({ message: "Chấp nhận lời mời kết bạn thành công" });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

const deleteFriendRequest = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const friendRequest = await friendsModel.findOne({ sender, receiver });
        if (!friendRequest) {
            return res.status(400).json({ message: "Không tìm thấy lời mời kết bạn" });
        }
        await friendsModel.deleteMany({ sender, receiver });
        res.status(200).json({ message: "Xóa lời mời kết bạn thành công" });
    }catch(error){
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

const getAllSendFriendRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        const friendRequests = await friendsModel.find({ receiver: userId });
        res.status(200).json(friendRequests);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

const unFriend = async (req, res) => {
    try {
        const { sender, receiver } = req.body;
        const friend = userModel.findById(receiver);
        if (!friend) {
            return res.status(400).json({ message: "Không tìm bạn bè" });
        }
        await userModel.findByIdAndUpdate(sender, { $pull: { friends: receiver } });
        await userModel.findByIdAndUpdate(receiver, { $pull: { friends: sender } });
        res.status(200).json({ message: "Hủy kết bạn thành công" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }

        
}

module.exports = { sendFriendRequest, acceptFriendRequest, deleteFriendRequest, getAllSendFriendRequests, unFriend};
