const mongoose = require("mongoose");
const snkTournamentSchema = new mongoose.Schema(
  {
    UserId: {
      type: String,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    entryFee: {
      type: Number,
      trim: true,
    },
    prizeAmount: {
      type: Number,
      trim: true,
    },
    playerWithBot: {
      type:Number,
      default:0
    },
    totalPlayersInTable:{
      type: Number,
      default: 0,
    },
    totalBotInTable:{
      type: Number,
      default: 0,
    },

    maxPlayers: {
      type: Number,
      default:20,
      trim: true,
    },

    tableByAdmin: {
      type: Boolean,
      default:false,
    },

    players: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "in_progress", "full"],
      default: "in_progress",
    },
    maxTime: {
      type: Number,
    },
    gameName:{
      type:String,
      default:"SnakeLadder"
    },
    Users: [],
    createdTime: {
      type: Date,
      default: Date.now,
      expires: "30m",
    },
    endTime: {
      type: Date,
    },
    isMatchOverForTable: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);
module.exports = mongoose.model("snkTournament", snkTournamentSchema);
