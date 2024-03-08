const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    chatType: {
        type: String,
        enum: ["user", "group"],
        required: true
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    attachments: [{type: String}],
}, {
    timestamps: true
});

const messageModel = mongoose.model("Message", messageSchema);

module.exports = messageModel;