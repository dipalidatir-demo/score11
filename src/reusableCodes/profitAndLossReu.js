const profitLossModel = require("../model/profitLossModel");

async function updateProfitLoss(gameName, groupId, profit, loss, currentDateFormat) {
    console.log("======>", gameName, groupId, profit, loss, currentDateFormat);
    let game;

    if (gameName === "Cricket") {
        game = "crick";
    } else if (gameName === "SnakeLadder") {
        game = "snk";
    } else if (gameName === "Rocket") {
        game = "rkt";
    }else if (gameName === "AirHockey") {
        game = "airHoc";
     } else {
        game = "tictactoe";
    }
    profit = parseInt(profit);
    loss = parseInt(loss);

    const lastDayProfit = await profitLossModel
        .findOne()
        .sort({ createdAt: -1 })
        .limit(1).select({_id:0, groupId:0, gameType:0, time:0, yaxis:0, __v: 0});

    console.log("lastDayProfit=========>",lastDayProfit);
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    if (!lastDayProfit || currentYear !== lastDayProfit.createdAt.getFullYear()) {
        // Create new document if no previous record exists or if year has changed
        const profitData = {
            gameType: [{ gameName: gameName, grpId: groupId }],
            groupId: [groupId],
            profit: profit,
            loss: loss,
            currentTime: currentDateFormat,
            [`${game}FullDayProfit`]: profit,
            [`${game}FullMonthProfit`]: profit,
            [`${game}FullYearProfit`]: profit,
        };
        createProfit = await profitLossModel.create(profitData);
    } else if (currentMonth !== lastDayProfit.createdAt.getMonth()) {
        // If the month has changed, update the fullMonthProfit and fullMonthLoss
        const profitData = {
            $push: {
                gameType: { gameName: gameName, grpId: groupId },
                groupId: groupId,
            },
            $inc: {
                profit: profit,
                loss: loss,
                [`${game}FullMonthProfit`]: profit,
                [`${game}FullMonthLoss`]: loss,
            },
        };
        createProfit = await profitLossModel.updateOne(
            { currentTime: currentDateFormat },
            profitData,
            { new: true }
        );
    } else if (currentDay !== lastDayProfit.createdAt.getDate()) {
        // If the date has changed, update the fullDayProfit and fullDayLoss
        const profitData = {
            $push: {
                gameType: { gameName: gameName, grpId: groupId },
                groupId: groupId,
            },
            $inc: {
                profit: profit,
                loss: loss,
                [`${game}FullDayProfit`]: profit,
                [`${game}FullDayLoss`]: loss,
            },
        };
        createProfit = await profitLossModel.updateOne(
            { currentTime: currentDateFormat },
            profitData,
            { new: true }
        );
    } else {
        // If none of the conditions match, update the existing document
        const profitData = {
            $push: {
                gameType: { gameName: gameName, grpId: groupId },
                groupId: groupId,
            },
            $inc: {
                profit: profit,
                loss: loss,
                [`${game}FullDayProfit`]: profit,
            },
        };
        createProfit = await profitLossModel.updateOne(
            { currentTime: currentDateFormat },
            profitData,
            { new: true }
        );
    }

    console.log("createProfit=====>",createProfit);
    console.log("profit  ===>", createProfit.profit, "======loss==>", createProfit.loss);
    return createProfit;
}
// updateProfitLoss("cricket","6606a458bd357a1fea6fada3",1,0,"29-03-2024")
module.exports = { updateProfitLoss };
