const mongoose = require("mongoose"); 
const Schema = mongoose.Schema;

const chatGroupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    members: {
        type: Array,
    },
    avatar: {
        type: String,
        default: "https://st.quantrimang.com/photos/image/072015/22/avatar.jpg"
    }
}, {
    timestamps: true
});


const chatGroupModel = mongoose.model("ChatGroup", chatGroupSchema);

module.exports = chatGroupModel;