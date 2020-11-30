const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Search Schema for saving search history
 */
const settingSchema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    like_comment: {
      type: Schema.Types.Number,
      default: 1
    },
    from_friends: {
      type: Schema.Types.Number,
      default: 1
    },
    requested_friends: {
      type: Schema.Types.Number,
      defalt: 1
    },
    birthday

  }
);

module.exports = Setting = mongoose.model('search', settingSchema);
