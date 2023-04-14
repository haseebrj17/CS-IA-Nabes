const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    username: {
        type: String,
        min: 6,
        required: true,
        max: 255
    },
    message: {
        type: String,
        required: true
    },
    
    
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;