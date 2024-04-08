const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const messageSchema = new mongoose.Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        text: {
            type: String,
        },
        files: []
    },
    chatGroup: {
        type: Schema.Types.ObjectId,
        ref: 'ChatGroup',
    },
    chatPrivate: {
        type: Schema.Types.ObjectId,
        ref: 'ChatPrivate',
    }
}, {
    timestamps: true
});

const messageModel = mongoose.model("Message", messageSchema);

module.exports = messageModel;