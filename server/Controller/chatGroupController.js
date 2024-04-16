const chatGroupModel = require("../Model/chatGroupModel");
const userModel = require("../Model/userModel");

const createChatGroup = async (req, res) => {

    const { admin, name, members } = req.body;
    try {
        if (!admin || !name || !members) {
            return res.status(400).json({ message: "Cần nhập đầy đủ thông tin" });
        }


        const newChatGroup = new chatGroupModel({
            admin, name, members
        });

        const savedChatGroup = await newChatGroup.save();
        members.forEach(async (memberId) => {
            await userModel.findByIdAndUpdate(memberId, { $push: { chatGroups: savedChatGroup._id } });
        });

        res.status(200).json(savedChatGroup);
    } catch (error) {

        console.log('error', error.message);

        res.status(500).json({ message: error.message });
    }
};

const getAllChatGroupByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const chatGroup = await userModel.findById(userId).populate('chatGroups', 'name members admin messages');
        if (!chatGroup) {
            return res.status(404).json({ message: "Không tìm thấy ChatGroup " });
        }
        res.status(200).json(chatGroup.chatGroups);
    } catch (error) {
        console.log('Lỗi tìm chatgroup', error);
        res.status(404).json({ message: error.message });
    }
};

const addMembersToChatGroup = async (req, res) => {
    try {
        const admin = req.params.userId;
        const { chatGroupId, members } = req.body;

        if (!admin || !chatGroupId || !members) {
            return res.status(400).json({ error: "Cần nhập đầy đủ thông tin" });
        }

        const chatGroup = await chatGroupModel.findById(chatGroupId);
        if (!chatGroup) {
            return res.status(400).json({ error: "Không tìm thấy ChatGroup " });
        }

        if (!chatGroup.admin.includes(admin)) {
            return res.status(400).json({ error: "Bạn không phải là admin của nhóm chat" });
        }

        for (const memberId of members) {
            if (chatGroup.members.some(member => member.equals(memberId))) {
                return res.status(400).json({ error: "Một trong các người dùng đã tồn tại trong nhóm chat" });
            }

            // Kiểm tra sự tồn tại của thành viên trong cơ sở dữ liệu trước khi thêm vào nhóm chat
            const existingUser = await userModel.findById(memberId);
            if (!existingUser) {
                return res.status(400).json({ error: `Người dùng có ID ${memberId} không tồn tại` });
            }

            await userModel.findByIdAndUpdate(memberId, { $push: { chatGroups: chatGroupId } });
        }

        chatGroup.members.push(...members);
        await chatGroup.save();

        res.status(200).json(chatGroup);
    } catch (error) {
        console.log('Lỗi khi thêm thành viên vào nhóm chat:', error);
        res.status(500).json({ error: "Đã xảy ra lỗi khi thực hiện yêu cầu" });
    }
}


const deleteMembersChatGroup = async (req, res) => {
    try {
        const { chatGroupId, members } = req.body;
        const admin = req.params.userId;
        const chatGroup = await chatGroupModel.findById(chatGroupId);
        if (!chatGroup) {
            return res.status(404).json({ error: "Không tìm thấy nhóm chat." });
        }
        if (!chatGroup.admin.includes(admin)) {
            return res.status(400).json({ error: "Bạn không phải là admin của nhóm chat" });
        }
        if (!chatGroup.members.includes(members)) {
            return res.status(400).json({ error: "Người dùng không tồn tại trong nhóm chat" });
        }
        const updateMember = chatGroup.members.filter(memberId => !members.includes(memberId.toString()));
        chatGroup.members = updateMember;
        if (chatGroup.admin.includes(members)) {
            chatGroup.admin = chatGroup.admin.filter(adminId => adminId.toString() !== members);
        }
        await chatGroup.save();
        await userModel.findByIdAndUpdate(members, { $pull: { chatGroups: chatGroupId } });

        // await chatGroup.save();
        res.status(200).json(chatGroup);

    } catch (error) {
        console.log('Xoá người dùng khỏi nhóm chat không thành công', error);
        res.status(404).json({ error: error.message });
    }
}


const addAdminToChatGroup = async (req, res) => {
    try {
        const admin = req.params.userId;
        const { chatGroupId, memberId } = req.body;
        if (!chatGroupId || !admin) {
            return res.status(400).json({ error: "Cần nhập đầy đủ thông tin" });
        }
        const chatGroup = await chatGroupModel.findById(chatGroupId);
        if (!chatGroup) {
            return res.status(404).json({ error: "Không tìm thấy ChatGroup " });
        }
        if (!chatGroup.members.includes(memberId)) {
            return res.status(400).json({ error: "Người dùng không tồn tại trong nhóm chat" });
        }
        if (chatGroup.admin.includes(memberId)) {
            return res.status(400).json({ error: "Người dùng đã là admin của nhóm chat" });
        }
        if (!chatGroup.admin.includes(admin)) {
            return res.status(400).json({ error: "Bạn không phải admin của nhóm" });
        }
        if (chatGroup.admin.includes(memberId)) {
            return res.status(400).json({ error: "Người dùng đã là admin của nhóm chat" });
        }
        chatGroup.admin.push(memberId);
        await chatGroup.save();
        res.status(200).json(chatGroup);
    }
    catch (error) {
        console.log('Lỗi tìm chatgroup', error);
        res.status(404).json({ error: error.message });
    }
}

const deleteAdminToChatGroup = async (req, res) => {

    try {
        const admin = req.params.userId;
        const { chatGroupId, memberId } = req.body;
        if (!chatGroupId || !admin) {
            return res.status(400).json({ error: "Cần nhập đầy đủ thông tin" });
        }
        const chatGroup = await chatGroupModel.findById(chatGroupId);
        if (!chatGroup) {
            return res.status(404).json({ error: "Không tìm thấy ChatGroup " });
        }
        if (!chatGroup.members.includes(memberId)) {
            return res.status(400).json({ error: "Người dùng không tồn tại trong nhóm chat" });
        }
        if (!chatGroup.admin.includes(admin)) {
            return res.status(400).json({ error: "Người dùng không phải là admin của nhóm chat" });
        }
        if (!chatGroup.admin.includes(admin)) {
            return res.status(400).json({ error: "Bạn không phải admin của nhóm" });
        }
        if (!chatGroup.admin.includes(memberId)) {
            return res.status(400).json({ error: "Người dùng không phải là admin của nhóm chat" });
        }
        chatGroup.admin = chatGroup.admin.filter(adminId => adminId.toString() !== memberId);
        await chatGroup.save();
        res.status(200).json(chatGroup);
    }
    catch (error) {
        console.log('Lỗi tìm chatgroup', error);
        res.status(404).json({ error: error.message });
    }

}

const deleteChatGroup = async (req, res) => {
    try {
        const admin = req.params.userId;
        const { chatGroup } = req.body;
        const deleteChatGroup = await chatGroupModel.findById(chatGroup);
        let checkAdmin = deleteChatGroup.admin.filter(adminId => adminId.toString() === admin);
        if (!deleteChatGroup) {
            return res.status(404).json({ error: "Không tìm thấy nhóm chat." });
        }
        if (checkAdmin.length === 0) {
            return res.status(400).json({ error: "Bạn không phải là admin của nhóm chat." });
        }
        await userModel.updateMany({ chatGroups: chatGroup }, { $pull: { chatGroups: chatGroup } });
        await chatGroupModel.findByIdAndDelete(chatGroup);

        res.status(200).json({ message: "Nhóm chat đã được xóa thành công." });
    } catch (error) {
        console.error('Lỗi khi xóa nhóm chat:', error);
        res.status(500).json({ error: "Đã xảy ra lỗi khi xóa nhóm chat." });
    }
};

const outChatGroup = async (req, res) => {
    try {
        const { userId, chatGroupId } = req.body;
        console.log(chatGroupId);

        const chatGroup = await chatGroupModel.findById(chatGroupId);

        if (!chatGroup) {
            return res.status(404).json({ error: "Không tìm thấy nhóm chat." });
        }

        if (chatGroup.admin.includes(userId)) {
            chatGroup.admin = chatGroup.admin.filter(adminId => adminId.toString() !== userId);
        }
        if (!chatGroup.members.includes(userId)) {
            return res.status(400).json({ error: "Người dùng không tồn tại trong nhóm chat" });
        }
        chatGroup.members = chatGroup.members.filter(memberId => memberId.toString() !== userId);
        // Nếu người dùng đang xóa là admin, ta cần chỉ định một thành viên khác làm admin mới

        await chatGroup.save();
        await userModel.findByIdAndUpdate(userId, {
            $pull: { chatGroups: chatGroupId },
        });

        res.status(200).json(chatGroup);
    } catch (error) {
        console.log("Xoá người dùng khỏi nhóm chat không thành công", error);
        res.status(404).json({ message: error.message });
    }
};

const findChatGroupById = async (req, res) => {
    try {
        const chatGroupId = req.params.chatGroupId;
        const chatGroup = await chatGroupModel.findById(chatGroupId);
        if (!chatGroup) {
            return res.status(404).json({ message: "Không tìm thấy ChatGroup " });
        }
        res.status(200).json(chatGroup);
    }
    catch (error) {
        console.log('Lỗi tìm chatgroup', error);
        res.status(404).json({ message: error.message });
    }

}

module.exports = {
    createChatGroup, getAllChatGroupByUserId, addMembersToChatGroup, deleteMembersChatGroup,
    deleteChatGroup, outChatGroup, findChatGroupById, addAdminToChatGroup, deleteAdminToChatGroup
};