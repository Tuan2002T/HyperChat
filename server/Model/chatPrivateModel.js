const mongoose = require('mongoose');
const Schema = mongoose.Schema;                
const chatPrivateSchema = new mongoose.Schema({
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
        default: "https://hyperchatimage.s3.ap-southeast-1.amazonaws.com/default_image.jpg"
    }
},
    { timestamps: true }
);

const chatPrivateModel = mongoose.model('ChatPrivate', chatPrivateSchema);
module.exports = chatPrivateModel;