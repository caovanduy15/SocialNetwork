const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    phone_number: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
    },
    passwordResetToken: String,
    passwordResetTokenExpiry: Date,
    password: {
        type: String,
        required: true,
    },
    register_date: {
        type: Date,
        default: Date.now
    },
    verify_code: {
        type: Number,
        required: true
    }
})

module.exports = User = mongoose.model('user', UserSchema);
