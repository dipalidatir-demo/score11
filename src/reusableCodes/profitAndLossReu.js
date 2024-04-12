const profitLossModel = require("../model/profitLossModel");

//__________________________________testing code _________________________
// async function runUpdateProfitLoss() {
//     try {
//         // Call the updateProfitLoss function with await
//         const pofitDataInRes =  await updateProfitLoss("Cricket","6606a458bd357a1fea6fada3",7,0,"12-04-2024");
//         console.log("pofitDataInRes======>", pofitDataInRes);
//     } catch (error) {
//         // Handle any errors
//         console.error("Error:", error);
//     }
// }

// // Call the async function
// runUpdateProfitLoss();

async function updateProfitLoss(gameName, groupId, profit, loss, currentDateFormat) {
    console.log("======>", gameName, groupId, profit, loss, currentDateFormat);
    // let game;
  
 // Define a mapping object for game abbreviations
const gameAbbreviations = {
    "Cricket": "crick",
    "SnakeLadder": "snk",
    "Rocket": "rkt",
    "AirHockey": "airHoc",
    // Add more game mappings as needed
};

// Determine the abbreviation for the current game
const game = gameAbbreviations[gameName] || "tictactoe";
const games =  ["crick", "snk", "rkt", "airHoc", "tictactoe"];
// Filter out the abbreviation of the current game from the games array
// const games = Object.values(gameAbbreviations).filter(abbrev => abbrev !== game);

    profit = parseInt(profit);
    loss = parseInt(loss);

    const lastDayProfit = await profitLossModel
        .findOne()
        .sort({ createdAt: -1 })
        .limit(1).select({_id:0, groupId:0, gameType:0, time:0, yaxis:0, __v: 0});

    // console.log("lastDayProfit=========>",lastDayProfit);
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
        // Prepare data for the new document
        const profitData = {
            gameType: [{ gameName: gameName, grpId: groupId }],
            // groupId: [groupId],
            profit: profit,
            loss: loss,
            currentTime: currentDateFormat,
            // Set the profit and loss for the current game
            [`${game}FullDayProfit`]: profit,
            [`${game}FullMonthProfit`]: profit,
            [`${game}FullYearProfit`]: lastDayProfit[`${game}FullYearProfit`] + profit, 
            [`${game}FullDayLoss`]: loss,
            [`${game}FullMonthLoss`]: loss,
            [`${game}FullYearLoss`]: lastDayProfit[`${game}FullYearLoss`] + loss, 
        };
    
       
        games.forEach(otherGame => {
            if (game !== otherGame) {
                profitData[`${otherGame}FullDayProfit`] = 0;
                profitData[`${otherGame}FullDayLoss`] = 0;
                profitData[`${otherGame}FullMonthProfit`] = 0;
                profitData[`${otherGame}FullMonthLoss`] = 0;
                profitData[`${otherGame}FullYearProfit`] = lastDayProfit[`${otherGame}FullYearProfit`] ;
                profitData[`${otherGame}FullYearLoss`] = lastDayProfit[`${otherGame}FullYearLoss`] ;
            }
        });
    
        // Create a new document
        createProfit = await profitLossModel.create(profitData);
    
    } else if (currentDay !== lastDayProfit.createdAt.getDate()) {
        // Prepare data for the new document
        const profitData = {
            gameType: [{ gameName: gameName, grpId: groupId }],
            // groupId: [groupId],
            profit: profit,
            loss: loss,
            currentTime: currentDateFormat,
            // Set the profit and loss for the current game
            [`${game}FullDayProfit`]: profit,
            [`${game}FullMonthProfit`]: lastDayProfit[`${game}FullMonthProfit`] + profit,
            [`${game}FullYearProfit`]: lastDayProfit[`${game}FullYearProfit`] + profit, 
            [`${game}FullDayLoss`]: loss,
            [`${game}FullMonthLoss`]: lastDayProfit[`${game}FullMonthLoss`] + loss,
            [`${game}FullYearLoss`]: lastDayProfit[`${game}FullYearLoss`] + loss, 
        };
    
       
        games.forEach(otherGame => {
            if (game !== otherGame) {
                profitData[`${otherGame}FullDayProfit`] = 0;
                profitData[`${otherGame}FullDayLoss`] = 0;
                profitData[`${otherGame}FullMonthProfit`] = lastDayProfit[`${otherGame}FullMonthProfit`];
                profitData[`${otherGame}FullMonthLoss`] = lastDayProfit[`${otherGame}FullMonthLoss`];
                profitData[`${otherGame}FullYearProfit`] = lastDayProfit[`${otherGame}FullYearProfit`] ;
                profitData[`${otherGame}FullYearLoss`] = lastDayProfit[`${otherGame}FullYearLoss`] ;
            }
        });
    
        // Create a new document
        createProfit = await profitLossModel.create(profitData);
    } else {
        // If none of the conditions match, update the existing document
        const profitData = {
            $push: {
                gameType: { gameName: gameName, grpId: groupId },
                // groupId: groupId,
            },
            $inc: {
                profit: profit,
                loss: loss,
                [`${game}FullDayProfit`]: profit,
                [`${game}FullDayLoss`]: loss,
                [`${game}FullMonthProfit`]: profit,
                [`${game}FullMonthLoss`]: loss,
                [`${game}FullYearProfit`]: profit,
                [`${game}FullYearLoss`]: loss
            },
        };
        // console.log("profitData for updating=====>", profitData);
        createProfit = await profitLossModel.updateOne(
            { currentTime: currentDateFormat },
            profitData,
            { new: true }
        );
    }

    // console.log("createProfit=====>",createProfit);
    console.log("profit  ===>", createProfit.profit, "======loss==>", createProfit.loss);
    return createProfit;
}
//  const pofitDataInRes =  await updateProfitLoss("cricket","6606a458bd357a1fea6fada3",7,0,"12-04-2024");
//  console.log("pofitDataInRes======>", pofitDataInRes);
module.exports = { updateProfitLoss };
