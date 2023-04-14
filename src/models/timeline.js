const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
    title: {
        type: String,
        min: 3,
        required: true,
        max: 255,
        index: true
    },
    description: {
        type: String,
        min: 6,
        required: true,
        max: 2048
    },
    date: {
        type: Date,
        required: true
    },
    
    type: {
        type: String,
        default: 'Event'
    }
});

const Timeline = mongoose.model("Timeline", timelineSchema);

module.exports = Timeline;