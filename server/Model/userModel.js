const mongoose = require("mongoose");
//lược đồ user
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber:{
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullname: {
        type: String,
    },
    birthday: {
        type: Date,
    },
    avatar: {
        type: String,
        default: "https://hyperchatimg.s3.ap-southeast-1.amazonaws.com/default_image.jpg"
    }

}
    , {
        timestamps: true
});



const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
