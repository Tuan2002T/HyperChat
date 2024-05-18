const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const messageSchema = new mongoose.Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
    },
    views: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }
    ],
    notification: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

const messageModel = mongoose.model("Message", messageSchema);

module.exports = messageModel;