const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    // author of post
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user',
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
    created: {
        type: Date,
        default: Date.now()
    },
    likedUser: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    // time when post is modified
    modified: {
        type: Date
    },
    // number people liked post
    like: {
        type: Number
    },
    //number people commented post
    comment: {
        type: Number
    }
});

module.exports = mongoose.model('Post', postSchema);