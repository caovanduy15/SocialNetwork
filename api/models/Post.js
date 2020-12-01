const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const opts = {
    // Make Mongoose use Unix time (seconds since Jan 1, 1970)
    timestamps: {
        currentTime: () => Math.floor(Date.now() / 1000),
        createdAt: 'created',
        updatedAt: 'modified',
    }
};

const postSchema = new Schema({
    // author of post
    author: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    // description of post
    described: {
        type: String
    },
    // status of author
    status: {
        type: String
    },
    // time when post is created
    created: Number,
    // time when post is modified
    modified: Number,
    // number people liked post
    like: {
        type: Number
    },
    //number people commented post
    comment: {
        type: Number
    },
    // like user
    likedUser: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'comments'
    }],
    image: [{
        filename: {
            type: String
        },
        url: {
            type: String
        }
    }],
    video: {
        filename: {
            type: String
        },
        url: {
            type: String
        }
    },
    reports_post: [{
        type: Schema.Types.ObjectId,
        ref: 'reports_post'
    }]
}, opts);
module.exports = mongoose.model('posts', postSchema);
