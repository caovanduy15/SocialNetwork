const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    passwordResetToken: String,
    passwordResetTokenExpiry: Date,
    dateLogin: {
        type: Date
    },
    password: {
        type: String,
        required: true,
    },
    registerDate: {
        type: Date,
        default: Date.now
    },
    verifyCode: {
        type: Number,
    },
    isVerified:{
        type: Boolean,
        default: false
    }
})

module.exports = User = mongoose.model('users', UserSchema);
