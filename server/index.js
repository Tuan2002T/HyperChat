const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");



const userRoute = require("./Routes/userRoute");
const chatGroupRoute = require("./Routes/chatGroupRoute");
const chatPrivateRoute = require("./Routes/chatPrivateRoute");
const messageRoute = require("./Routes/messageRoute");

const app = express();
require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use("/api/user", userRoute);
app.use("/api/chatGroup", chatGroupRoute);
app.use("/api/chatPrivate", chatPrivateRoute);
app.use("/api/message", messageRoute);

const port = process.env.PORT || 5000;
const uri = process.env.ATLATS_URI;

app.listen(port , (req, res) => {
    console.log("Server is running on port...:",port);
});


mongoose.connect(uri,{
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => {console.log("Database connected...")}).catch((err) => console.log("MongdoDB connection failed: ",err.message));

app.get("/", (req, res) => {
    res.send("Welcome to HyperChat...!");
});


