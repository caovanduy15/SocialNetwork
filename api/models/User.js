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
    isVerified: {
      type: Boolean
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    friends: [{
      friend: {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
      createdAt: {
        type: Date
      }
    }],
    friendRequestReceived: [{
      fromUser: {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
      lastCreated: {
        type: Date,
        default: Date.now
      },
    }],
    friendRequestSent: [{
      type: Schema.Types.ObjectId,
      ref: 'users',
    }]

})

module.exports = User = mongoose.model('users', UserSchema);
