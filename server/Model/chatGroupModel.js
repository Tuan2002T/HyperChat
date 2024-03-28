const mongoose = require("mongoose"); 
const Schema = mongoose.Schema;

const chatGroupSchema = new mongoose.Schema({
    admin: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    messages: [
        {
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: []
        }
    ],
    avatar: {
        type: String,
        default: "https://hyperchatimage.s3.ap-southeast-1.amazonaws.com/avatar-group.png"
    }
}, {
    timestamps: true
});


const chatGroupModel = mongoose.model("ChatGroup", chatGroupSchema);

module.exports = chatGroupModel;