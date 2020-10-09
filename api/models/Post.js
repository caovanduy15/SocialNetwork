const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    described: {
        type: String
    },
    status: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now()
    },
    likedUser: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }]
});

module.exports = mongoose.model('Post', postSchema);