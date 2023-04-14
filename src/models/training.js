const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        max: 255
    },
    description: {
        type: String,
        required: true,
        max: 255
    },
    link: {
        type: String,
        required: true,
        max: 255
    },
    type: {
        type: String,
        default: 'video'

    }
});

const Training = mongoose.model("Training", trainingSchema);

module.exports = Training;