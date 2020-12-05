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
    dateLogin: {
        type: Date
    },
    registerDate: {
      type: Date,
      default: Date.now
    },
    avatar: {
        url: {
            type: String
        }
    },
    password: {
        type: String,
        required: true,
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
    blockedList: [{
      user: {
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
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      default: "chưa có mô tả"
    },
    coverImage: {
        url: {
          type: String
      }
    },
    address: {
      type: String
    },
    city: { 
      type: String
    },
    country: {
      type: String
    },
    link: {
      type: String
    }
})

module.exports = mongoose.model('users', UserSchema);
