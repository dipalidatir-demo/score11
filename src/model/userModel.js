const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    botType: {
      type: String,
      enum: ["normal", "hard", "easy"],
      required: true,
      default: "normal",
    },
    UserId: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    token: {
      type: String,
      dfault: "",
    },
    referralCode: {
      type: String,
    },
    referralAmount: {
      type: Number,
      default: 10,
    },
    referredBy: {
      type: String,
    },
    referralHistory: [],
    isActive: {
      type: Boolean,
      default: true,
    },
    credits: {
      type: Number,
      default: 10,
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    realMoney: {
      type: Number,
      default: 0,
    },
    status: {
      type: Boolean,
      default: false,
    },
    banned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    history: [],
    transactionHistory: [],
    refToCricket: {
      type: String,
      ref: "cricket",
    },
    refToHockey: {
      type: String,
      ref: "hocky",
    },
    refToSnakeLadder: {
      type: String,
      ref: "snakeLadder",
    },
    refToTicTacToe: {
      type: String,
      ref: "ticTacToe",
    },
    cricketData: [
      {
        _id: false,
        playCount: Number,
        winCount: Number,
      },
    ],
    cricketWinAmount: {
      type: Number,
      default: 0,
    },
    snkLadderData: [
      {
        _id: false,
        playCount: Number,
        winCount: Number,
      },
    ],
    snkLadderWinAmount: {
      type: Number,
      default: 0,
    },
    rocketData: [
      {
        _id: false,
        playCount: Number,
        winCount: Number,
      },
    ],
    rocketWinAmount: {
      type: Number,
      default: 0,
    },
    ticTacToeData: [
      {
        _id: false,
        playCount: Number,
        winCount: Number,
      },
    ],
    ticTacToeWinAmount: {
      type: Number,
      default: 0,
    },
    airHockeyData: [
      {
        _id: false,
        playCount: Number,
        winCount: Number,
      },
    ],
    airHockeyWinAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
