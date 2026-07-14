const mongoose = require("mongoose");

const blacklistTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [, "Token is required to be added in blacklist"],
    },
  },
  {
    timestamps: true,
  },
);

const tokenBlacklistModel = mongoose.model("blacklistTokens",blacklistTokenSchema)

module.exports = tokenBlacklistModel