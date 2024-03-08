const mongoose = require('mongoose');

const chatPrivateSchema = new mongoose.Schema({
    members: Array,
},
    { timestamps: true }
);

const chatPrivateModel = mongoose.model('ChatPrivate', chatPrivateSchema);
module.exports = chatPrivateModel;