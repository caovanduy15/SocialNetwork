const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
    },
    // email: {
    //     type: String,
    //     required: true,
    //     lowercase: true,
    //     trim: true,
    //     unique: true,
    // },
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
    register_date: {
        type: Date,
        default: Date.now
    }
})

module.exports = User = mongoose.model('user', UserSchema);