const mongoose = require("mongoose");

const friendsSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status:{
        type:String,
        enum: ['pending', 'accepted'],
        default: 'pending'
    }
    }
    , {
        timestamps: true
});

const friendsModel = mongoose.model("Friends", friendsSchema);

module.exports = friendsModel; 