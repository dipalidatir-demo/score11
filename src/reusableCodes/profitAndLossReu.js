const profitLossModel = require("../model/profitLossModel");

async function updateProfitLoss(gameName, groupId, profit, loss, currentDateFormat) {
    console.log("======>", gameName, groupId, profit, loss, currentDateFormat);
    let game;

    if (gameName === "cricket") {
        game = "crick";
    } else if (gameName === "snakeLadder") {
        game = "snk";
    } else if (gameName === "rocket") {
        game = "rkt";
    } else {
        game = "tictactoe";
    }

    const lastDayProfit = await profitLossModel
        .findOne()
        .sort({ createdAt: -1 })
        .limit(1);

    if (!lastDayProfit) {
        // Create new document if no previous record exists
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
    } else {
        // Check if the current date, month, or year is different from the last updated record
        const lastUpdatedDate = lastDayProfit.createdAt.getDate();
        const updatedMonth = lastDayProfit.createdAt.getMonth();
        const updatedYear = lastDayProfit.createdAt.getFullYear();

        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const updatedFields = {
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

        if (currentYear !== updatedYear) {
            // If the year has changed, update the fullYearProfit and fullYearLoss
            updatedFields.$inc[`${game}FullYearProfit`] = profit;
            updatedFields.$inc[`${game}FullYearLoss`] = loss;
        } else if (currentMonth !== updatedMonth) {
            // If the month has changed, update the fullMonthProfit and fullMonthLoss
            updatedFields.$inc[`${game}FullMonthProfit`] = profit;
            updatedFields.$inc[`${game}FullMonthLoss`] = loss;
        } else if (currentDay !== lastUpdatedDate) {
            // If the date has changed, update the fullDayProfit and fullDayLoss
            updatedFields.$inc[`${game}FullDayProfit`] += profit;
            updatedFields.$inc[`${game}FullDayLoss`] += loss;
        }

        createProfit = await profitLossModel.updateOne(
            { currentTime: currentDateFormat },
            updatedFields,
            { new: true }
        );
    }
    console.log("createProfit=====>",createProfit);
    console.log("profit  ===>", createProfit.profit, "======loss==>", createProfit.loss);
    return createProfit;
}

module.exports = { updateProfitLoss };
