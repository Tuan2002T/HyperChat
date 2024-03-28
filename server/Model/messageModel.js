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
            required: true
        },
        files: [
            {
              name: { type: String, required: true },
              url: { type: String, required: true },
              type: { type: String, required: true }, // e.g. 'image/jpeg', 'application/pdf'
              size: { type: Number, required: true } // size in bytes
            }
          ]
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