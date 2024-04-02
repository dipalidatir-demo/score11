const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const airHockeySchema = new mongoose.Schema(
  {
    UserId: {
      type: String,
    },
    airHockeyMatch: {
      type: Number,
      default: 0,
      trim: true,
    },
    airHockeyWins: {
      type: Number,
      default: 0,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AirHockey", airHockeySchema);
