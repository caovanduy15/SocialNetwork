const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reportPostSchema = Schema({
    subject: {
        type: String,
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    created: {
      type: Date,
      default: Date.now(),
    },
  });

module.exports = Report_Post = mongoose.model('reports_post', reportPostSchema);