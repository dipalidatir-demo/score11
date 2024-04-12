const mongoose = require("mongoose");


const profitLossSchema = new mongoose.Schema({
    gameType: [],
    groupId: [
      {
        type: mongoose.Schema.Types.ObjectId, // Assuming group IDs are ObjectIds
        ref: 'Group', // Replace 'YourGroupModel' with the actual model name for groups
      },
    ],
      profit:{
        type: Number,
        default: 0,
      },
      fullDayProfit:{
        type: Number,
        default: 0,
      },
      fullMonthProfit:{
        type: Number,
        default: 0,
      },
      fullYearProfit:{
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
      fullMonthLoss:{
        type: Number,
        default: 0,
      },
      fullYearLoss:{
        type: Number,
        default: 0,
      },
      currentTime:{
        type:String,
        // default: new Date()
      },
      crickFullDayProfit:{
        type: Number,
        default: 0,
      },
      crickFullMonthProfit:{
        type: Number,
        default: 0,
      },
      crickFullYearProfit:{
        type: Number,
        default: 0,
      },
      crickFullDayLoss:{
        type: Number,
        default: 0,
      },
      crickFullMonthLoss:{
        type: Number,
        default: 0,
      },
      crickFullYearLoss:{
        type: Number,
        default: 0,
      },
      snkFullDayProfit:{
        type: Number,
        default: 0,
      },
      snkFullMonthProfit:{
        type: Number,
        default: 0,
      },
      snkFullYearProfit:{
        type: Number,
        default: 0,
      },
      snkFullDayLoss:{
        type: Number,
        default: 0,
      },
      snkFullMonthLoss:{
        type: Number,
        default: 0,
      },
      snkFullYearLoss:{
        type: Number,
        default: 0,
      },
      rktFullDayProfit:{
        type: Number,
        default: 0,
      },
      rktFullMonthProfit:{
        type: Number,
        default: 0,
      },
      rktFullYearProfit:{
        type: Number,
        default: 0,
      },
      rktFullDayLoss:{
        type: Number,
        default: 0,
      },
      rktFullMonthLoss:{
        type: Number,
        default: 0,
      },
      rktFullYearLoss:{
        type: Number,
        default: 0,
      },
      tictactoeFullDayProfit:{
        type: Number,
        default: 0,
      },
      tictactoeFullMonthProfit:{
        type: Number,
        default: 0,
      },
      tictactoeFullYearProfit:{
        type: Number,
        default: 0,
      },
      tictactoeFullDayLoss:{
        type: Number,
        default: 0,
      },
      tictactoeFullMonthLoss:{
        type: Number,
        default: 0,
      },
      tictactoeFullYearLoss:{
        type: Number,
        default: 0,
      },
      airHocFullDayProfit:{
        type: Number,
        default: 0,
      },
      airHocFullMonthProfit:{
        type: Number,
        default: 0,
      },
      airHocFullYearProfit:{
        type: Number,
        default: 0,
      },
      airHocFullDayLoss:{
        type: Number,
        default: 0,
      },
      airHocFullMonthLoss:{
        type: Number,
        default: 0,
      },
      airHocFullYearLoss:{
        type: Number,
        default: 0,
      },
      yaxis:{
        type: Array,
        default: [5000,10000,15000,20000,25000]
      },
      time:{
        type: Array,
        default: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
      }
    },
    { timestamps: true });

module.exports = mongoose.model('ProfitLoss', profitLossSchema);