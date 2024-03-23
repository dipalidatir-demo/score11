const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const rocketSchema = new mongoose.Schema(
  {
    UserId: {
      type: String,
    },
    rocketMatch: {
      type: Number,
      default: 0,
      trim: true,
    },
    rcketWins: {
      type: Number,
      default: 0,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rocket", rocketSchema);
