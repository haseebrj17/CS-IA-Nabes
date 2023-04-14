const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.SEC_KEY;

const adminSchema = new mongoose.Schema({

    email: {
        type: String,
        max: 400,
        unique: true,
        required: true,
        index: true
    },
    password: {
        type: String,
        min: 6,
        required: true,
        max: 1024
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

adminSchema.methods.generateAuthToken = async function () {
    try {
        const token = await jwt.sign({ _id: this._id.toString() }, secretKey);
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        return token;
    } catch (err) {
        console.log("Something went wrong" + err);
    }
}

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;