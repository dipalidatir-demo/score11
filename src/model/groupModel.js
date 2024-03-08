const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const groupSchema = new mongoose.Schema(
  {
    createdTime: {
      type: Date,
      default: Date.now,
      // expires: "30m",
    },
    tableId: {
      type: String,
    },
    updatedPlayers: [
      {
        _id: false,
        UserId: String,
        userName: String,
        run: {
          type: Number,
          default: 0,
        },

        wicket: {
          type: Number,
          default: 0,
        },
        runWithWicket:[],
        hit: {
          type: Boolean,
          default: false,
        },
        prize: {
          type: Number,
          default: 0,
        },
        isRunUpdated: {
          type: Boolean,
          default: false,
        },
        isBot: {
          type: Boolean,
          default: false,
        },
        isBallThrow:{
          type:Boolean,
          default:false,
        }
      },
    ],
    ball: {
      type: Number,
      default: 6,
    },
    start: {
      type: Boolean,
      default: false,
    },
    currentBallTime: {
      type: Date,
      default: Date.now(),
    },
    nextBallTime: {
      type: Date,
      default: Date.now() + 1 * 7 * 1000
    },
    gameEndTime:{
      type: Date,
      default: () => Date.now() + 60 * 1000
    },
    ballSpeed: {
      type: Number,
      default: 13,
    },
    isWicketUpdated: {
      type: Boolean,
      default: false,
    },
    isUpdate: {
      type: Boolean,
      default: false,
    },
    isMatchOver: {
      type: Boolean,
      default: false,
    },
    profit:{
      type: Number,
      default: 0,
    },
    fullDayProfit:{
      type: Number,
      default: 0,
    },
    loss:{
      type: Number,
      default: 0,
    },
    fullDayLoss:{
      type: Number,
      default: 0,
    },
    totalPlayerInGrp:{
      type:Number,
      default:0
    },
    totalBotInGrp:{
      type:Number,
      default:0
    }
  },
  { strict: false }
);

module.exports = mongoose.model("Group", groupSchema);
