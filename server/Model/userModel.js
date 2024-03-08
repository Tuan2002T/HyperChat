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
    friends: {
        type: Array,
        default: []
    },
    groups: {
        type: Array,
        default: []
    },
    avatar: {
        type: String,
        default: "https://st.quantrimang.com/photos/image/072015/22/avatar.jpg"
    }

}
    , {
        timestamps: true
});



const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
