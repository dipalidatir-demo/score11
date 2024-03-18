const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const tournamentModel = require("../model/tournamentModel");
const cricketModel = require("../model/cricketModel");
const _ = require("lodash");
const fakeUsers = require("../controller/dummyUsers");
const { find } = require("lodash");
const groupModel = require("../model/groupModel");
const snkTournamentModel = require("../model/snkTournamentModel");
const groupModelForSnakeLadder = require("../model/groupModelForSnakeLadder");
const ticTacToeTournamentModel = require("../model/ticTacToeTournamentModel");
const ticTacToeGroupModel = require("../model/ticTacToeGroupModel");
const Decimal = require("decimal.js");
const profitLossModel = require("../model/profitLossModel");
const botModel = require("../model/botModel");
const moment = require("moment");
const cron = require("node-cron");

//_____crete group as per the admin_______

const createGroupByAdmin = async function (tableId) {
  console.log(tableId, "=======tableId in created group functionh");
  if (tableId != undefined) {
    let table = await tournamentModel.findOne({ _id: tableId });

    if (table != undefined || table != null) {
      let players = table.players;
      let users = table.Users;

      if (users.length !== 0) {
        users = users.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        });

        // Fetch dummy users from the botModel where the type is "normal"
        const dummyUsers = await botModel.find({
          botType: { $in: ["normal", "hard"] },
        });

        const groups = _.chunk(players, 5);
        let completePlayers = [...users];

        // Add one hard bot to each group
        const hardBot = dummyUsers.find((bot) => bot.botType === "hard");
        completePlayers.push(hardBot);

        // Calculate how many additional normal bots are needed to complete the group
        const remainingPlayers = 5 - (completePlayers.length % 5);
        if (remainingPlayers > 0) {
          const normalBots = dummyUsers
            .filter((bot) => bot.botType === "normal")
            .slice(0, remainingPlayers);
          completePlayers.push(...normalBots);
        }

        let completeGroups = _.chunk(completePlayers, 5);

        for (let i = 0; i < completeGroups.length; i++) {
          let createGrp = await groupModel.create({
            group: completeGroups[i],
            tableId: tableId,
          });
          let grpId = createGrp._id;
          let group = createGrp.group;
          console.log(createGrp);
          // setTimeout(function () {
          startMatch(grpId, group);
          // }, 120000);

          // runUpdateBalls(grpId);
        }
      }
    }
  }
};

//_____________________createGroup by code____________________

const createGroup = async function (tableId) {
  if (tableId != undefined) {
    let table = await tournamentModel.findOne({ _id: tableId });

    if (table != undefined || table != null) {
      let players = table.players;
      let users = table.Users;

      if (users.length !== 0) {
        users = users.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        });
        const requiredBot = players % 5;
        let totalBot;
        if (requiredBot === 1) {
          totalBot = 4;
        } else if (requiredBot === 2) {
          totalBot = 3;
        } else if (requiredBot === 3) {
          totalBot = 2;
        } else if (requiredBot === 4) {
          totalBot = 1;
        } else {
          totalBot = 0;
        }
        const updateTournament = await tournamentModel.findOneAndUpdate(
          { _id: tableId },
          { $set: { totalBotInTable: totalBot, totalPlayersInTable: players } },
          { new: true }
        );
        // console.log(updateTournament, "======================UpdateTournament");
        // Fetch dummy users from the botModel where the type is "normal"
        const dummyUsers = await botModel.find({
          botType: { $in: ["normal", "hard"] },
        });

        const groups = _.chunk(players, 5);
        let completePlayers = [...users];

        // Check if there's only one real player, and if so, add 1 hard bot and 3 normal bots
        if (users.length === 1) {
          const hardBot = dummyUsers.find((bot) => bot.botType === "hard");
          const normalBots = dummyUsers
            .filter((bot) => bot.botType === "normal")
            .slice(0, 3);
          completePlayers.push(hardBot, ...normalBots);
        } else {
          // If there are more real players, add normal bots as needed
          completePlayers.push(...dummyUsers.slice(0, 5 - (users.length % 5)));
        }

        let completeGroups = _.chunk(completePlayers, 5);

        for (let i = 0; i < completeGroups.length; i++) {
          let createGrp = await groupModel.create({
            group: completeGroups[i],
            tableId: tableId,
          });
          let grpId = createGrp._id;
          let group = createGrp.group;
          // console.log(createGrp);
          //  setTimeout(function () {
          startMatch(grpId, group);
          //  }, 10000);
          // console.log("settime out for 10 sec=======>",new Date());

          // runUpdateBalls(grpId);
        }
      }
    }
  }
};

async function startMatch(grpId, group) {
  console.log("grpid>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", grpId);
  console.log("time to call=====>",new Date());
  // console.log("groups>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", group);
  if (grpId !== undefined) {
    const result = group.map((name) => ({
      UserId: name.UserId,
      userName: name.userName,
      isBot: name.isBot,
      run: 0,
      hit: false,
      isBallThrow:false,
      wicket: 0,
      prize: 0,
      runWithWicket:[],
      isRunUpdated: name.isRunUpdated,
      botType: name.botType,
    }));
    // console.log("result", result);
    let totalBot = result.filter((players) => players.isBot === true);
    totalBot = totalBot.length;
    let totalRealPlayres = result.filter((players) => players.isBot === false);
    totalRealPlayres = totalRealPlayres.length;
    const matchData = await groupModel.findOneAndUpdate(
      { _id: grpId },
      {
        updatedPlayers: result,
        $set: {
          totalBotInGrp: totalBot,
          totalPlayerInGrp: totalRealPlayres,
          start: true,
          currentBallTime: Date.now(),
          nextBallTime: Date.now() + 1 * 17 * 1000,
          // gameEndTime: Date.now() + 1 * 60 * 1000,
        },
      },
      { new: true, setDefaultsOnInsert: true }
    );
    const updateRunForBot = matchData.updatedPlayers.map((botPlayers) => {
      function updateRun(runArray) {
        const runWithWicket = [];
        let runForBot = 0;
    
        // Generate five random runs
        for (let i = 0; i < 5; i++) {
            let randomValue = runArray[Math.floor(Math.random() * runArray.length)];
            runWithWicket.push(randomValue);
            runForBot += randomValue;
        }
    
        // Generate a random wicket index within the runs
        const wicketIndex = Math.floor(Math.random() * (runWithWicket.length + 1)); // Adjusted to include the last index
    
        // Insert "w" for wicket at the random index within the runs
        runWithWicket.splice(wicketIndex, 0, "w");
    
        return { runWithWicket, runForBot };
    }
    
      if (botPlayers.isBot === true) {
          let runsArray;
          if (botPlayers.botType === "easy") {
              runsArray = [1, 2];
          } else if (botPlayers.botType === "hard") {
              runsArray = [4, 6];
          } else {
              runsArray = [1, 2, 3, 4, 6];
          }
  
          const runturnValue = updateRun(runsArray);
          botPlayers.runWithWicket = runturnValue.runWithWicket;
  
          // Calculate runs and wickets
          botPlayers.run = runturnValue.runForBot;
          botPlayers.wicket += runturnValue.runWithWicket.filter(val => val === "w").length;
      }
      return botPlayers;
  });
  
  let runUpdatedForBot = await groupModel
      .findByIdAndUpdate(
          { _id: grpId },
          { $set: { updatedPlayers: updateRunForBot } },
          { new: true }
      )
      .exec();
  
  
  
  
     console.log("this is updated data start game and updating botsrun>>>>>>>>>>", runUpdatedForBot.start);
    setTimeout(function () {
      runUpdateBalls(grpId);
    }, 17000);
  }
}
//__________________________________updateBalls function___________________________________
async function updateBalls(grpId) {
  let min = 0;

  if (grpId != undefined) {
    let updateWicket = await groupModel.findByIdAndUpdate({ _id: grpId });
    let ballCountForWicket = updateWicket.ball;
    let tableId = updateWicket.tableId;
    if (ballCountForWicket < 6 && !updateWicket.isMatchOver) {
      let updatedPlayers = updateWicket.updatedPlayers.map((player) => {
        if (!player.hit && player.isBot === false) {
          //___________If the player did not hit the ball, set the wicket to true
          player.wicket += 1;
          player.isRunUpdated = false;
          player.runWithWicket.push("W");
        }
        if (player.hit && ballCountForWicket > 0) {
          //______________If the player did not hit the ball, set the wicket to true
          player.hit = false;
          player.isRunUpdated = false;
        }
        player.isBallThrow = false
        return player;
      });

      await groupModel.updateOne({ _id: grpId }, { $set: { updatedPlayers } });
    }

    if (ballCountForWicket === 0 && !updateWicket.isMatchOver) {
      let updateTable = await tournamentModel.findByIdAndUpdate(
        { _id: tableId },
        { isMatchOverForTable: true },
        { new: true }
      );
      if (!updateTable) {
        return res.status(200).send({
          status: false,
          message: "table is not updated for isMatchOverForTable to true ",
        });
      }
      let players = updateWicket.updatedPlayers.sort((a, b) => {
        if (b.run !== a.run) {
          return b.run - a.run; //__sort by runs in descending order
        } else {
          return a.wicket - b.wicket; //___sort by wickets in ascending order for players with the same runs
        }
      });
      // console.log(players, "declareWinners_______________");

      //_________________winner prize as per prize amount

      const prizes = updateTable.entryFee;
      let totalEntryFee = prizes * 5;
      const prizeDecimal = new Decimal(totalEntryFee);

      players[0].prize = prizeDecimal.times(0.35).toNumber();
      players[1].prize = prizeDecimal.times(0.25).toNumber();
      players[2].prize = prizeDecimal.times(0.15).toNumber();
      players[3].prize = prizeDecimal.times(0.05).toNumber();

      let count = 0;
      let totalPlayerInGrp = updateWicket.totalPlayerInGrp;
      let totalBotInGrp = updateWicket.totalBotInGrp;

      //____________________________"profit" when all 5 players came so entryFee- prize remaining profit__________
      const currentDt = new Date();
      const currentDate = currentDt.getDate();
      const currentMonth = currentDt.getMonth();
      const currentYear = currentDt.getFullYear();
      // console.log(
      //   currentDate,typeof(currentDate),
      //   "====currentDate===",
      //   currentMonth,typeof(currentMonth),
      //   "===currentMonth====",
      //   currentYear, typeof(currentYear),
      //   "========currentYear"
      // );
      if (totalPlayerInGrp === 5) {
        // const tournamentData = await tournamentModel.findById({ _id: tableId });
        // const currentDateInMo = moment();
        const currentDateFormat = moment().format("DD-MM-YYYY");

        // const lastDayProfit = await profitLossModel.findOne(
        //   // {currentTime: currentDateFormat}
        //   // { gameType: "cricket" },
        //   { sort: { createdAt: -1 } }
        // );

        const lastDayProfit = await profitLossModel
          .findOne()
          .sort({ createdAt: -1 })
          .limit(1);

        let lastUpdatedDate;
        let updatedMonth;
        let updatedYear;
        if (lastDayProfit) {
          lastUpdatedDate = lastDayProfit.createdAt.getDate();
          updatedMonth = lastDayProfit.createdAt.getMonth();
          updatedYear = lastDayProfit.createdAt.getFullYear();
          // console.log(
          //   lastUpdatedDate,
          //   "===lastUpdatedDate===",
          //   updatedYear,
          //   "=====updatedYear====",
          //   updatedMonth,
          //   "==========updatedMonth"
          // );
        }

        // if (tournamentData) {
        const entryFee = updateTable.entryFee;
        const prizeAmount = updateTable.prizeAmount;

        const totalEntryFee = entryFee * 5;

        profit = totalEntryFee - prizeAmount;

        if (!lastDayProfit) {
          const profitData = {
            gameType: [{ gameName: "cricket", grpId: grpId }],
            groupId: [grpId],
            profit: profit,
            loss: 0,
            currentTime: currentDateFormat,
            fullDayProfit: profit,
            fullMonthProfit: profit,
            fullYearProfit: profit,
            crickFullDayProfit: profit,
            crickFullMonthProfit: profit,
            crickFullYearProfit: profit,
          };
          const createProfit = await profitLossModel.create(profitData);
        } else if (currentYear !== updatedYear) {
          const profitData = {
            gameType: [{ gameName: "cricket", grpId: grpId }],
            groupId: [grpId],
            profit: profit,
            currentTime: currentDateFormat,
            fullDayProfit: profit,
            fullMonthProfit: profit,
            fullYearProfit: profit,
            crickFullDayProfit: profit,
            crickFullMonthProfit: profit,
            crickFullYearProfit: profit,
            // fullDayLoss:0 ,
            // fullMonthLoss:lastDayProfit.fullMonthLoss,
            // fullYearLoss:lastDayProfit.fullYearLoss
          };
          const createProfit = await profitLossModel.create(profitData);
        } else if (currentMonth !== updatedMonth) {
          const profitData = {
            gameType: [{ gameName: "cricket", grpId: grpId }],
            groupId: [grpId],
            profit: profit,
            currentTime: currentDateFormat,
            fullDayProfit: profit,
            fullMonthProfit: profit,
            fullYearProfit: lastDayProfit.fullYearProfit + parseInt(profit),
            fullYearLoss: lastDayProfit.fullYearLoss,
            crickFullDayProfit: profit,
            crickFullMonthProfit: profit,
            crickFullYearProfit:
              lastDayProfit.crickFullYearProfit + parseInt(profit),
            crickFullYearLoss: lastDayProfit.crickFullYearLoss,
            snkFullYearProfit: lastDayProfit.snkFullYearProfit,
            snkFullYearLoss: lastDayProfit.snkFullYearLoss,
          };
          const createProfit = await profitLossModel.create(profitData);
        } else if (currentDate !== lastUpdatedDate) {
          const profitData = {
            gameType: [{ gameName: "cricket", grpId: grpId }],
            groupId: [grpId],
            profit: profit,
            currentTime: currentDateFormat,
            fullDayProfit: profit,
            fullMonthProfit: lastDayProfit.fullMonthProfit + parseInt(profit),
            fullYearProfit: lastDayProfit.fullYearProfit + parseInt(profit),
            fullMonthLoss: lastDayProfit.fullMonthLoss,
            fullYearLoss: lastDayProfit.fullYearLoss,
            crickFullDayProfit: profit,
            crickFullMonthProfit:
              lastDayProfit.crickFullMonthProfit + parseInt(profit),
            crickFullYearProfit:
              lastDayProfit.crickFullYearProfit + parseInt(profit),
            crickFullMonthLoss: lastDayProfit.crickFullMonthLoss,
            crickFullYearLoss: lastDayProfit.crickFullYearLoss,
            snkFullMonthProfit: lastDayProfit.snkFullMonthProfit,
            snkFullYearProfit: lastDayProfit.snkFullYearProfit,
            snkFullMonthLoss: lastDayProfit.snkFullMonthLoss,
            snkFullYearLoss: lastDayProfit.snkFullYearLoss,
          };
          const createProfit = await profitLossModel.create(profitData);
        } else {
          await profitLossModel.updateOne(
            {
              currentTime: currentDateFormat,
            },
            {
              $push: {
                gameType: { gameName: "cricket", grpId: grpId },
                groupId:  grpId ,
              },
              $inc: {
                profit: profit,
                fullDayProfit: profit,
                fullMonthProfit: profit,
                fullYearProfit: profit,
                crickFullDayProfit: profit,
                crickFullMonthProfit: profit,
                crickFullYearProfit: profit,
              },
            },
            { new: true }
          );
        }
        // Update groupModel
        const updatedGroup = await groupModel.findByIdAndUpdate(
          { _id: grpId },
          {
            $inc: {
              profit: profit,
              // totalBotInGrp: totalBotInGrp,
              // totalPlayerInGrp: totalPlayerInGrp,
            },
            $set: { updatedPlayers: players },
            isWicketUpdated: true,
            isMatchOver: true,
            ball: 0,
          },
          { new: true }
        );

        console.log("Updated Profit in Database:", updatedGroup.profit);
        let updateTableProfit = await tournamentModel.findByIdAndUpdate(
          { _id: tableId },
          {
            $inc: {
              totalProfit: profit,
            },
          },
          { new: true }
        );
        console.log(
          updateTableProfit.totalProfit,
          "================totalProfit of cricket table"
        );
        // }
      }

      //_______________________loss when not came 5 players and win the player so entry-prize calculate loss ______________________

      if (totalPlayerInGrp < 5) {
        // const tournamentData = await tournamentModel.findById({ _id: tableId });
        const lastDayProfit = await profitLossModel
        .findOne()
        .sort({ createdAt: -1 })
        .limit(1);
      
      console.log(lastDayProfit && lastDayProfit.createdAt ,"================lastDayProfit document");
        let lastUpdatedDate;
        let updatedMonth;
        let updatedYear;
        if (lastDayProfit) {
          lastUpdatedDate = lastDayProfit.createdAt.getDate();
          updatedMonth = lastDayProfit.createdAt.getMonth();
          updatedYear = lastDayProfit.createdAt.getFullYear();
          console.log(
            lastUpdatedDate, typeof(lastUpdatedDate),
            "===lastUpdatedDate===",
            updatedMonth,typeof(updatedMonth),
            "==========updatedMonth",
            updatedYear,typeof(updatedYear),
            "=====updatedYear===="
            
          );
        }
        // const currentDate = moment();
        const currentDateFormat = moment().format("DD-MM-YYYY");

        const entryFee = updateTable.entryFee;
        let totalEntryFee = entryFee * parseInt(totalPlayerInGrp);
        console.log(totalEntryFee, "__________totalEntryFee");
        let winPrizeOfUser = 0;

        for (let i = 0; i < updateWicket.updatedPlayers.length; i++) {
          if (updateWicket.updatedPlayers[i].isBot === false) {
            winPrizeOfUser += updateWicket.updatedPlayers[i].prize;
            // console.log(winPrizeOfUser, "_________________winPrizeOfUser");
          }
        }

        if (winPrizeOfUser > totalEntryFee) {
          loss = winPrizeOfUser - totalEntryFee;

          console.log(loss, "____________loss");

          if (!lastDayProfit) {
            console.log("================ loss count 1", !lastDayProfit);
            const profitData = {
              gameType: [{ gameName: "cricket", grpId: grpId }],
              groupId: [grpId],
              profit: 0,
              loss: loss,
              currentTime: currentDateFormat,
              fullDayLoss: loss,
              fullMonthLoss: loss,
              fullYearLoss: loss,
              crickFullDayLoss: loss,
              crickFullMonthLoss: loss,
              crickFullYearLoss: loss,
            };
            const createProfit = await profitLossModel.create(profitData);
          } else if (currentYear !== updatedYear) {
            console.log("================ loss count 2",  currentYear !== updatedYear);
            const profitData = {
              gameType: [{ gameName: "cricket", grpId: grpId }],
              groupId:[grpId],
              loss: loss,
              currentTime: currentDateFormat,
              fullDayLoss: loss,
              fullMonthLoss: loss,
              fullYearLoss: loss,
              crickFullDayLoss: loss,
              crickFullMonthLoss: loss,
              crickFullYearLoss: loss,
              // fullDayLoss:0 ,
              // fullMonthLoss:lastDayProfit.fullMonthLoss,
              // fullYearLoss:lastDayProfit.fullYearLoss
            };
            const createProfit = await profitLossModel.create(profitData);
          } else if (currentMonth !== updatedMonth) {
            console.log("================ loss count 3", currentMonth !== updatedMonth);
            const profitData = {
              gameType: [{ gameName: "cricket", grpId: grpId }],
              groupId: [grpId],
              loss: loss,
              currentTime: currentDateFormat,
              fullDayLoss: loss,
              fullMonthLoss: loss,
              fullYearLoss: lastDayProfit.fullYearLoss + parseFloat(loss),
              fullYearProfit: lastDayProfit.fullYearProfit,
              crickFullDayLoss: loss,
              crickFullMonthLoss: loss,
              crickFullYearLoss:lastDayProfit.crickFullYearLoss + parseFloat(loss),
              crickFullYearProfit: lastDayProfit.crickFullYearProfit,
              snkFullYearProfit: lastDayProfit.snkFullYearProfit,
              snkFullYearLoss: lastDayProfit.snkFullYearLoss,
            };
            const createProfit = await profitLossModel.create(profitData);
          } else if (currentDate !== lastUpdatedDate) {
            console.log("================ loss count 4", currentDate !== lastUpdatedDate);
            const profitData = {
              
              gameType: [{ gameName: "cricket", grpId: grpId }],
              groupId: [grpId],
              loss: loss,
              currentTime: currentDateFormat,
              fullDayLoss: loss,
              fullMonthLoss: lastDayProfit.fullMonthLoss + parseFloat(loss),
              fullYearLoss: lastDayProfit.fullYearLoss + parseFloat(loss),
              fullMonthProfit: lastDayProfit.fullMonthProfit,
              fullYearProfit: lastDayProfit.fullYearProfit,
              crickFullDayLoss: loss,
              crickFullMonthLoss:
                lastDayProfit.crickFullMonthLoss + parseFloat(loss),
              crickFullYearLoss:
                lastDayProfit.crickFullYearLoss + parseFloat(loss),
              crickFullMonthProfit: lastDayProfit.crickFullMonthProfit,
              crickFullYearProfit: lastDayProfit.crickFullYearProfit,
              snkFullMonthProfit: lastDayProfit.snkFullMonthProfit,
              snkFullYearProfit: lastDayProfit.snkFullYearProfit,
              snkFullMonthLoss: lastDayProfit.snkFullMonthLoss,
              snkFullYearLoss: lastDayProfit.snkFullYearLoss,
            };
            const createProfit = await profitLossModel.create(profitData);
          } else {
            console.log("================ loss count 5");
            await profitLossModel.updateOne(
              {
                currentTime: currentDateFormat,
              },
              {
                $push: {
                  gameType: { gameName: "cricket", grpId: grpId },
                  groupId:  grpId ,
                },
                $inc: {
                  loss: loss,
                  fullDayLoss: loss,
                  fullMonthLoss: loss,
                  fullYearLoss: loss,
                  crickFullDayLoss: loss,
                  crickFullMonthLoss: loss,
                  crickFullYearLoss: loss,
                },
              },
              { new: true }
            );
          }
          //_______________Update groupModel

          let updatedGroup = await groupModel.findByIdAndUpdate(
            { _id: grpId },
            {
              $inc: {
                loss: loss,
                // totalBotInGrp: totalBotInGrp,
                // totalPlayerInGrp: totalPlayerInGrp,
              },
              $set: { updatedPlayers: players },
              isWicketUpdated: true,
              isMatchOver: true,
              ball: 0,
            },
            { new: true }
          );

          // console.log(updatedGroup, "______________updatedGroup");

          // console.log("Updated loss in Database:", updatedGroup.loss);
          let updateTableLoss = await tournamentModel.findByIdAndUpdate(
            { _id: tableId },
            {
              $inc: {
                totalLoss: loss,
              },
            },
            { new: true }
          );
          // console.log(
          //   updateTableLoss.totalLoss,
          //   "================totalLoss of cricket table"
          // );
        } else {
          profit = totalEntryFee - winPrizeOfUser;
          // console.log(profit, ":::::::::::::::::profit");
          if (!lastDayProfit) {
            // console.log("================ profit count 1",!lastDayProfit);
            const profitData = {
              gameType: [{ gameName: "cricket", grpId: grpId }],
              groupId: [grpId],
              profit: profit,
              loss: 0,
              currentTime: currentDateFormat,
              fullDayProfit: profit,
              fullMonthProfit: profit,
              fullYearProfit: profit,
              crickFullDayProfit: profit,
              crickFullMonthProfit: profit,
              crickFullYearProfit: profit,
            };
            const createProfit = await profitLossModel.create(profitData);
          } else if (currentYear !== updatedYear) {
            // console.log("================ profit count 2", currentYear !== updatedYear);
            const profitData = {
              gameType: [{ gameName: "cricket", grpId: grpId }],
              groupId: [grpId],
              profit: profit,
              currentTime: currentDateFormat,
              fullDayProfit: profit,
              fullMonthProfit: profit,
              fullYearProfit: profit,
              crickFullDayProfit: profit,
              crickFullMonthProfit: profit,
              crickFullYearProfit: profit,
              // fullDayLoss:0 ,
              // fullMonthLoss:lastDayProfit.fullMonthLoss,
              // fullYearLoss:lastDayProfit.fullYearLoss
            };
            const createProfit = await profitLossModel.create(profitData);
          } else if (currentMonth !== updatedMonth) {
            // console.log("================ profit count 3", currentMonth !== updatedMonth);
            const profitData = {
              gameType: [{ gameName: "cricket", grpId: grpId }],
              groupId: [grpId],
              profit: profit,
              currentTime: currentDateFormat,
              fullDayProfit: profit,
              fullMonthProfit: profit,
              fullYearProfit: lastDayProfit.fullYearProfit + parseFloat(profit),
              fullYearLoss: lastDayProfit.fullYearLoss,
              crickFullDayProfit: profit,
              crickFullMonthProfit: profit,
              crickFullYearProfit:
                lastDayProfit.crickFullYearProfit + parseFloat(profit),
              crickFullYearLoss: lastDayProfit.crickFullYearLoss,
              snkFullYearProfit: lastDayProfit.snkFullYearProfit,
              snkFullYearLoss: lastDayProfit.snkFullYearLoss,
            };
            const createProfit = await profitLossModel.create(profitData);
          } else if (currentDate !== lastUpdatedDate) {
            // console.log(currentDate,typeof(currentDate),"====currentDate=====lastUpdatedDate", lastUpdatedDate,typeof(lastUpdatedDate));
            // console.log("================ profit count 4", currentDate !== lastUpdatedDate);
            const profitData = {
              gameType: [{ gameName: "cricket", grpId: grpId }],
              groupId: [grpId],
              profit: profit,
              currentTime: currentDateFormat,
              fullDayProfit: profit,
              fullMonthProfit: lastDayProfit.fullMonthProfit + parseFloat(profit),
              fullYearProfit: lastDayProfit.fullYearProfit + parseFloat(profit),
              fullMonthLoss: lastDayProfit.fullMonthLoss,
              fullYearLoss: lastDayProfit.fullYearLoss,
              crickFullDayProfit: profit,
              crickFullMonthProfit:
                lastDayProfit.crickFullMonthProfit + parseFloat(profit),
              crickFullYearProfit:
                lastDayProfit.crickFullYearProfit + parseFloat(profit),
              crickFullMonthLoss: lastDayProfit.crickFullMonthLoss,
              crickFullYearLoss: lastDayProfit.crickFullYearLoss,
              snkFullMonthProfit: lastDayProfit.snkFullMonthProfit,
              snkFullYearProfit: lastDayProfit.snkFullYearProfit,
              snkFullMonthLoss: lastDayProfit.snkFullMonthLoss,
              snkFullYearLoss: lastDayProfit.snkFullYearLoss,
            };
            const createProfit = await profitLossModel.create(profitData);
          } else {
            console.log("================ profit count 5");
            await profitLossModel.updateOne(
              {
                currentTime: currentDateFormat,
              },
              {
                $push: {
                  gameType: { gameName: "cricket", grpId: grpId },
                  groupId:  grpId ,
                },
                $inc: {
                  profit: profit,
                  fullDayProfit: profit,
                  fullMonthProfit: profit,
                  fullYearProfit: profit,
                  crickFullDayProfit: profit,
                  crickFullMonthProfit: profit,
                  crickFullYearProfit: profit,
                },
              },
              { new: true }
            );
          }

          //_________________Update groupModel

          const updatedGroup = await groupModel.findByIdAndUpdate(
            { _id: grpId },
            {
              $inc: {
                profit: profit,
                // totalBotInGrp: totalBotInGrp,
                // totalPlayerInGrp: totalPlayerInGrp,
              },
              $set: { updatedPlayers: players },
              isWicketUpdated: true,
              isMatchOver: true,
              ball: 0,
            },
            { new: true }
          );

          // console.log(updatedGroup, "___________update profit");

          let updateTableProfit = await tournamentModel.findByIdAndUpdate(
            { _id: tableId },
            {
              $inc: {
                totalProfit: profit,
              },
            },
            { new: true }
          );

          // console.log(
          //   updateTableProfit.totalProfit,
          //   "================totalProfit of cricket table"
          // );
        }
        // }
      }
      //________________________end profit loss________________

      let users = updateWicket.updatedPlayers;
      const winnerId = players[0].UserId;
      for (let player = 0; player < users.length; player++) {
        try {
          let playerId = users[player].UserId;
          let updatedPrize = users[player].prize;
          const updatedPrizeDecimal = new Decimal(updatedPrize);
          if (playerId === winnerId) {
            let updateBalance = await userModel.findOneAndUpdate(
              { UserId: winnerId, "history.tableId": tableId },
              {
                $inc: {
                  realMoney: updatedPrizeDecimal.toNumber(),
                  cricketWinAmount: updatedPrizeDecimal.toNumber(),
                  "cricketData.0.winCount": 1,
                }, // Increment winCount by 1
                $set: {
                  "history.$.result": "win",
                  "history.$.win": updatedPrizeDecimal,
                },
                $push: {
                  transactionHistory: {
                    date: new Date(),
                    amount: updatedPrizeDecimal.toNumber(),
                    type: "winnings",
                    gameType: "cricket",
                  },
                },
              },
              { new: true }
            );
          } else {
            let updateBalance = await userModel.findOneAndUpdate(
              { UserId: playerId, "history.tableId": tableId },
              {
                $inc: {
                  realMoney: updatedPrizeDecimal.toNumber(),
                  cricketWinAmount: updatedPrizeDecimal.toNumber(),
                },
                $set: {
                  "history.$.result": "lose",
                  "history.$.win": updatedPrizeDecimal,
                },
              },
              { new: true }
            );
          }
        } catch (error) {
          console.error("Error updating balance:", error);
        }
      }
    }
    let ballCount;
    if (ballCountForWicket > 0) {
      let updateBall = await groupModel.findByIdAndUpdate(
        { _id: grpId },
        {
          $inc: { ball: -1 },
          nextBallTime: Date.now() + 1 * 10 * 1000,
          currentBallTime: Date.now(),
          isUpdate: false,
        },
        { new: true }
      );

      ballCount = updateBall.ball;

      console.log(ballCount, "ballCount================");
      console.log(updateBall.nextBallTime, "nextBallTime================");
      // console.log(
      //   updateBall.gameEndTime - Date.now(),
      //   "++++++++++++++++++gameEndTime"
      // );
    }

    if (ballCountForWicket <= min - 1) {
      console.log("Reached minimum ball count!");
      return true;
    }
  }
  return false;
}

//_________________________________________update run___________________

function runUpdateBalls(grpId) {
  console.log("call the runUpdateBalls function >>>>>>>>>>>", grpId);
  if (grpId != undefined) {
    let continueRunning = true;
    let executionCount = 0;

    async function updateBallsRecursive() {
      if (continueRunning) {
        const isMaxCountReached = await updateBalls(grpId);
        if (!isMaxCountReached && executionCount < 8) {
          executionCount++;
          setTimeout(async () => {
            //________________update nextBallTime, currentBallTime and  ballSpeed in every 10 seconds
            updateBallsRecursive();
          }, 10000); //10sec
        }
      }
    }
    updateBallsRecursive();
  }
}

//________________________________________________for snakeLadder________________________________________________

const createGroupForSnakeLadder = async function (tableId) {
  console.log(tableId, "============create gorup in snk");
  if (tableId != undefined) {
    let table = await snkTournamentModel.findOne({ _id: tableId });

    if (table != undefined || table != null) {
      let players = table.players;
      let users = table.Users;

      if (users.length !== 0) {
        users = users.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        });
        const requiredBot = players % 2;
        let totalBot;
        if (requiredBot === 1) {
          totalBot = 1;
        } else {
          totalBot = 0;
        }
        const updateTournament = await tournamentModel.findOneAndUpdate(
          { _id: tableId },
          { $set: { totalBotInTable: totalBot, totalPlayersInTable: players } },
          { new: true }
        );
        //________________________________import dummyusers and add as per need to complete groups

        let dummyUsers = fakeUsers.fakeUsers;
        dummyUsers = dummyUsers.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        });
        const groups = _.chunk(players, 2);

        let completePlayers = [
          ...users,
          ...dummyUsers.slice(0, 2 - (users.length % 2)),
        ];

        let completeGroups = _.chunk(completePlayers, 2);

        for (let i = 0; i < completeGroups.length; i++) {
          let createGrp = await groupModelForSnakeLadder.create({
            group: completeGroups[i],
            tableId: tableId,
          });
          let grpId = createGrp._id;
          let group = createGrp.group;
          console.log(createGrp);
          // setTimeout(function () {
          startMatchForSnkLdr(grpId, group);
          //  }, 5000);
        }
      }
    }
  }
};

async function startMatchForSnkLdr(grpId, group) {
  console.log("grpid>>>>>>>>>>>", grpId);
  // console.log("groups>>>>>>>>>>>>>>>>>", group);

  if (grpId !== undefined) {
    const result = group.map((name) => ({
      UserId: name.UserId,
      userName: name.userName,
      isBot: name.isBot,
      points: 0,
      turn: name.turn,
      dicePoints: 0,
      currentPoints: 0,
      movement: "",
    }));
    // console.log("result", result);

    let totalBot = result.filter((players) => players.isBot === true);
    totalBot = totalBot.length;
    let totalRealPlayres = result.filter((players) => players.isBot === false);
    totalRealPlayres = totalRealPlayres.length;

    const matchData = await groupModelForSnakeLadder.findOneAndUpdate(
      { _id: grpId },
      {
        updatedPlayers: result,
        $set: {
          totalBotInGrp: totalBot,
          totalPlayerInGrp: totalRealPlayres,
          start: true,
          gameEndTime: Date.now() + 2 * 60 * 1000,
        },
      },
      { new: true, setDefaultsOnInsert: true }
    );

    console.log(
      new Date().getSeconds(),
      "----before 6 sec of starting the game---",
      matchData.isGameStart
    );

    await new Promise((resolve) => {
      setTimeout(async function () {
        let updatedPlayers = matchData.updatedPlayers;
        let currentPlayerIndex = Math.floor(
          Math.random() * updatedPlayers.length
        );
        matchData.updatedPlayers[currentPlayerIndex].turn = true;
        matchData.lastHitTime = new Date();
        matchData.isGameStart = 1;
        matchData.currentUserId = updatedPlayers[currentPlayerIndex].UserId;

        const updatedGroupFst = await matchData.save();
        console.log(
          new Date().getSeconds(),
          "--after 6 sec of starting the game--",
          updatedGroupFst.isGameStart
        );
        resolve(); // Resolve the promise to continue with the rest of the code
        overTheGame(grpId);
      }, 15000);
    });
  }
}

//________________________________till not used code _____________________________

//_____________bot's point update_______________
async function updateBotPoints(botPlayer,snakeLadder){
  let botPlayerId = botPlayer.UserId;
  let updatedPlayers = snakeLadder.updatedPlayers ;
  const currentUserIndex = snakeLadder.updatedPlayers.findIndex(
    (player) => player.UserId === botPlayerId
  );
  const nextUserIndex = (currentUserIndex + 1) % updatedPlayers.length;
  const nextUserId = snakeLadder.updatedPlayers[nextUserIndex].UserId;
  const possibleValues = [1, 2, 3, 4, 5, 6];

  const randomIndex = Math.floor(Math.random() * possibleValues.length);
  const randomValue = possibleValues[randomIndex];

  // Calculate current position
  let currentPosition = botPlayer.points + randomValue;

  // Check for snakes, ladders, and tunnels
  const snakeLadderAndTunnel = {
    2: 21, //--------------ladder .
    8: 29, //--------------ladder.
    14: 7, //--------------snake
    19: 38, //--------------ladder.
    25: 46, //--------------ladder.
    36: 3, //--------------snake
    41: 83, //--------------ladder.
    48: 12, //--------------snake
    49: 71, //--------------ladder.
    58: 22, //--------------snake
    72: 47, //--------------snake
    74: 93, //--------------ladder.
    95: 13, //--------------snake
    97: 78, //--------------snake
  };

  if (currentPosition > 99) {
    currentPosition = snakeLadder.updatedPlayers[currentUserIndex].points;
  }

  if (currentPosition in snakeLadderAndTunnel) {
    // Update position based on snakes, ladders, and tunnels
    snakeLadder.updatedPlayers[currentUserIndex].points =
      snakeLadderAndTunnel[currentPosition];
    snakeLadder.updatedPlayers[currentUserIndex].movement =
      currentPosition === 2 ||
      currentPosition === 8 ||
      currentPosition === 19 ||
      currentPosition === 25 ||
      currentPosition === 41 ||
      currentPosition === 49 ||
      currentPosition === 74
        ? "Ladder"
        : "Snake"; // Use currentPosition here
  } else {
    snakeLadder.updatedPlayers[currentUserIndex].points = currentPosition; // Use currentPosition here
    snakeLadder.updatedPlayers[currentUserIndex].movement = "";
  }

  snakeLadder.updatedPlayers[currentUserIndex].dicePoints = randomValue;
  snakeLadder.updatedPlayers[nextUserIndex].dicePoints = 0;
  snakeLadder.updatedPlayers[currentUserIndex].currentPoints =
    currentPosition;
  snakeLadder.updatedPlayers[currentUserIndex].turn = false;

  // snakeLadder.currentUserId = nextUserId;
  // snakeLadder.updatedPlayers[nextUserIndex].turn = true;
  // snakeLadder.lastHitTime = new Date();
  console.log(
    snakeLadder.nextTurnTime.getSeconds(),
    "sec before db call============="
  );

  snakeLadder.nextTurnTime = new Date(Date.now() + 16 * 1000); //set  turn 16 sec for real user 
  snakeLadder.currentUserId = nextUserId;
  snakeLadder.updatedPlayers[nextUserIndex].turn = true;
  snakeLadder.lastHitTime = new Date();
  console.log(
    "after setTimeout in put >>>>>",
    new Date().getSeconds(),
    "++++++++++++",
    snakeLadder
  );

  let updatedData = await groupModelForSnakeLadder.findOneAndUpdate(
    { _id: snakeLadder._id },
    {
      $set: snakeLadder,
    },
    { new: true }
  );
  console.log(
    updatedData.nextTurnTime.getSeconds(),
    "sec after db call========"
  );
   return updatedData ;
  // const nextTurnHandler = () => {
  // snakeLadder.save();
  // };
  // setTimeout(nextTurnHandler, 3000);
}

async function checkTurn(groupId) {
  if (groupId != undefined) {
    try {
      let snakeLadder = await groupModelForSnakeLadder.findById({
        _id: groupId,
      });
      let tableId = snakeLadder.tableId;
      let createdTime = snakeLadder.createdTime;
      const updatedPlayers = snakeLadder.updatedPlayers;
      let timeDiff = snakeLadder.gameEndTime - new Date();
      let nxtPlayer = updatedPlayers.find((players) => players.turn === true);
      let crntPlayer = updatedPlayers.find((players) => players.turn === true);
      let reachTheDestination = snakeLadder.updatedPlayers.find(
        (players) => players.points === 99
      );
      if (timeDiff <= 0 || reachTheDestination) {
        let overTheGame = await snkTournamentModel.findByIdAndUpdate(
          { _id: tableId },
          { isMatchOverForTable: true },
          { new: true }
        );
        const currentDt = new Date();
      const currentDate = currentDt.getDate();
      const currentMonth = currentDt.getMonth();
      const currentYear = currentDt.getFullYear();
      console.log(
        currentDate,typeof(currentDate),
        "====currentDate===",
        currentMonth,typeof(currentMonth),
        "===currentMonth====",
        currentYear, typeof(currentYear),
        "========currentYear"
      );
        let entryFee = overTheGame.entryFee;
        //----------- Find the player with the highest points (the potential winner)
        let potentialWinner = updatedPlayers.reduce(
          (prevPlayer, currentPlayer) => {
            return prevPlayer.points > currentPlayer.points
              ? prevPlayer
              : currentPlayer;
          }
        );
        // Check if there is a tie (both players have equal points)
        let isTie = updatedPlayers.every(
          (player) => player.points === potentialWinner.points
        );
        const lastDayProfit = await profitLossModel
          .findOne()
          .sort({ createdAt: -1 })
          .limit(1);
        let lastUpdatedDate;
        let updatedMonth;
        let updatedYear;
        let profit = 0;
        if (lastDayProfit) {
          lastUpdatedDate = lastDayProfit.createdAt.getDate();
          updatedMonth = lastDayProfit.createdAt.getMonth();
          updatedYear = lastDayProfit.createdAt.getFullYear();
          console.log(
            lastUpdatedDate,
            "===lastUpdatedDate===",
            updatedYear,
            "=====updatedYear====",
            updatedMonth,
            "==========updatedMonth"
          );
        }
        // const currentDate = moment();
        const currentDateFormat = moment().format("DD-MM-YYYY");
        let playerCountForSnk = updatedPlayers.filter(
          (player) => !player.isBot
        ).length;

        if (isTie) {
          console.log("=======calculate profit or loss if game is tie====");
          // Both players are winners with a prize of 0.5
          const prizeDecimal = new Decimal(entryFee).times(0.5);
          for (const player of updatedPlayers) {
            player.prize = prizeDecimal.toNumber();
            player.turn = false;
            player.dicePoints = 0;
            if (!player.isBot) {
              await userModel.findOneAndUpdate(
                { UserId: player.UserId, "history.tableId": tableId },
                {
                  $inc: {
                    realMoney: player.prize,
                    snkLadderWinAmount: player.prize,
                  },
                  $set: {
                    "history.$.result": "lose",
                    "history.$.win": player.prize,
                  },
                  $push: {
                    transactionHistory: {
                      date: new Date(),
                      amount: player.prize,
                      type: "winnings",
                      gameType: "snakeLadder",
                    },
                  },
                },
                { new: true }
              );
            }
            if (playerCountForSnk === 2) {
              const totalEntryFee = entryFee * 2;
              profit = totalEntryFee - prizeDecimal;
              console.log(profit,"======if tie and player is 2");
            } else {
              const totalEntryFee = entryFee * 1;
              profit = totalEntryFee - prizeDecimal;
              console.log(profit,"======if tie and player is 1 and onother is bot");
            }
            if (!lastDayProfit) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId: [groupId],
                profit: profit,
                loss: 0,
                currentTime: currentDateFormat,
                fullDayProfit: profit,
                fullMonthProfit: profit,
                fullYearProfit: profit,
                snkFullDayProfit: profit,
                snkFullMonthProfit: profit,
                snkFullYearProfit: profit,
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentYear !== updatedYear) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId: [groupId],
                profit: profit,
                loss: 0,
                currentTime: currentDateFormat,
                fullDayProfit: profit,
                fullMonthProfit: profit,
                fullYearProfit: profit,
                snkFullDayProfit: profit,
                snkFullMonthProfit: profit,
                snkFullYearProfit: profit,
                // fullDayLoss:0 ,
                // fullMonthLoss:lastDayProfit.fullMonthLoss,
                // fullYearLoss:lastDayProfit.fullYearLoss
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentMonth !== updatedMonth) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                profit: profit,
                currentTime: currentDateFormat,
                fullDayProfit: profit,
                fullMonthProfit: profit,
                fullYearProfit: lastDayProfit.fullYearProfit + parseFloat(profit),
                fullYearLoss: lastDayProfit.fullYearLoss,
                snkFullDayProfit: profit,
                snkFullMonthProfit: profit,
                snkFullYearProfit:
                  lastDayProfit.snkFullYearProfit + parseFloat(profit),
                snkFullYearLoss: lastDayProfit.snkFullYearLoss,
                crickFullYearProfit:
                  lastDayProfit.crickFullYearProfit + parseInt(profit),
                crickFullYearLoss: lastDayProfit.crickFullYearLoss,
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentDate !== lastUpdatedDate) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                profit: profit,
                currentTime: currentDateFormat,
                fullDayProfit: profit,
                fullMonthProfit:
                  lastDayProfit.fullMonthProfit + parseFloat(profit),
                fullYearProfit: lastDayProfit.fullYearProfit + parseFloat(profit),
                fullMonthLoss: lastDayProfit.fullMonthLoss,
                fullYearLoss: lastDayProfit.fullYearLoss,
                snkFullDayProfit: profit,
                snkFullMonthProfit:
                  lastDayProfit.snkFullMonthProfit + parseFloat(profit),
                snkFullYearProfit:
                  lastDayProfit.snkFullYearProfit + parseFloat(profit),
                snkFullMonthLoss: lastDayProfit.snkFullMonthLoss,
                snkFullYearLoss: lastDayProfit.snkFullYearLoss,
                crickFullMonthProfit: lastDayProfit.crickFullMonthProfit,
                crickFullYearProfit: lastDayProfit.crickFullYearProfit,
                crickFullMonthLoss: lastDayProfit.crickFullMonthLoss,
                crickFullYearLoss: lastDayProfit.crickFullYearLoss,
              };
              const createProfit = await profitLossModel.create(profitData);
            } else {
              await profitLossModel.updateOne(
                {
                  currentTime: currentDateFormat,
                },
                {
                  $push: {
                    gameType: { gameName: "snakeLadder", grpId: groupId },
                    groupId: groupId ,
                  },
                  $inc: {
                    profit: profit,
                    fullDayProfit: profit,
                    fullMonthProfit: profit,
                    fullYearProfit: profit,
                    snkFullDayProfit: profit,
                    snkFullMonthProfit: profit,
                    snkFullYearProfit: profit,
                  },
                },
                { new: true }
              );
            }
          }
        } else {
          // Calculate the prize for the potential winner and the runner-up
          // potentialWinner.prize = entryFee * 1.5;
          console.log("====calculate profit and loss if game is not tie=====");
          const potentialWinnerPrizeDecimal = new Decimal(entryFee).times(1.5);
          potentialWinner.prize = potentialWinnerPrizeDecimal.toNumber();
          let runner = updatedPlayers.find(
            (player) => player.UserId !== potentialWinner.UserId
          );
          runner.prize = entryFee * 0;

          // Set the turn and dicePoints to 0 for both players
          potentialWinner.turn = false;
          potentialWinner.dicePoints = 0;
          runner.turn = false;
          runner.dicePoints = 0;
          //___________________________________update the winner's realMoney_______________

          await userModel.findOneAndUpdate(
            { UserId: potentialWinner.UserId, "history.tableId": tableId },
            {
              $inc: {
                realMoney: potentialWinnerPrizeDecimal.toNumber(),
                snkLadderWinAmount: potentialWinnerPrizeDecimal.toNumber(),
                "snkLadderData.0.winCount": 1,
              }, // Increment playCount by 1,
              $set: {
                "history.$.result": "win",
                "history.$.win": potentialWinnerPrizeDecimal.toNumber(),
              },
              $push: {
                transactionHistory: {
                  date: new Date(),
                  amount: potentialWinnerPrizeDecimal.toNumber(),
                  type: "winnings",
                  gameType: "snakeLadder",
                },
              },
            },
            { new: true }
          );

          //_______________________________________update the runner's data ______________

          await userModel.findOneAndUpdate(
            { UserId: runner.UserId, "history.tableId": tableId },
            {
              $set: { "history.$.result": "lose" },
            },
            { new: true }
          );

          if (playerCountForSnk === 2 || potentialWinner.isBot) {

            if(potentialWinner.isBot){
              profit = entryFee;
              console.log(profit,"======if game is not tie and winner is bot");
            }
            if(playerCountForSnk === 2){
              const totalEntryFee = entryFee * 2;
              profit = totalEntryFee - potentialWinnerPrizeDecimal.toNumber();
              console.log(profit,"======if game is not tie and player is 2");
            }
           
            if (!lastDayProfit) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                profit: profit,
                loss: 0,
                currentTime: currentDateFormat,
                fullDayProfit: profit,
                fullMonthProfit: profit,
                fullYearProfit: profit,
                snkFullDayProfit: profit,
                snkFullMonthProfit: profit,
                snkFullYearProfit: profit,
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentYear !== updatedYear) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                profit: profit,
                loss: 0,
                currentTime: currentDateFormat,
                fullDayProfit: profit,
                fullMonthProfit: profit,
                fullYearProfit: profit,
                snkFullDayProfit: profit,
                snkFullMonthProfit: profit,
                snkFullYearProfit: profit,
                // fullDayLoss:0 ,
                // fullMonthLoss:lastDayProfit.fullMonthLoss,
                // fullYearLoss:lastDayProfit.fullYearLoss
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentMonth !== updatedMonth) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                profit: profit,
                currentTime: currentDateFormat,
                fullDayProfit: profit,
                fullMonthProfit: profit,
                fullYearProfit: lastDayProfit.fullYearProfit + parseFloat(profit),
                fullYearLoss: lastDayProfit.fullYearLoss,
                snkFullDayProfit: profit,
                snkFullMonthProfit: profit,
                snkFullYearProfit:
                  lastDayProfit.snkFullYearProfit + parseFloat(profit),
                snkFullYearLoss: lastDayProfit.snkFullYearLoss,
                crickFullYearProfit:
                  lastDayProfit.crickFullYearProfit + parseFloat(profit),
                crickFullYearLoss: lastDayProfit.crickFullYearLoss,
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentDate !== lastUpdatedDate) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                profit: profit,
                currentTime: currentDateFormat,
                fullDayProfit: profit,
                fullMonthProfit:
                  lastDayProfit.fullMonthProfit + parseFloat(profit),
                fullYearProfit: lastDayProfit.fullYearProfit + parseFloat(profit),
                fullMonthLoss: lastDayProfit.fullMonthLoss,
                fullYearLoss: lastDayProfit.fullYearLoss,
                snkFullDayProfit: profit,
                snkFullMonthProfit:
                  lastDayProfit.snkFullMonthProfit + parseFloat(profit),
                snkFullYearProfit:
                  lastDayProfit.snkFullYearProfit + parseFloat(profit),
                snkFullMonthLoss: lastDayProfit.snkFullMonthLoss,
                snkFullYearLoss: lastDayProfit.snkFullYearLoss,
                crickFullMonthProfit: lastDayProfit.crickFullMonthProfit,
                crickFullYearProfit: lastDayProfit.crickFullYearProfit,
                crickFullMonthLoss: lastDayProfit.crickFullMonthLoss,
                crickFullYearLoss: lastDayProfit.crickFullYearLoss,
              };
              const createProfit = await profitLossModel.create(profitData);
            } else {
              await profitLossModel.updateOne(
                {
                  currentTime: currentDateFormat,
                },
                {
                  $push: {
                    gameType: { gameName: "snakeLadder", grpId: groupId },
                    groupId: groupId,
                  },
                  $inc: {
                    profit: profit,
                    fullDayProfit: profit,
                    fullMonthProfit: profit,
                    fullYearProfit: profit,
                    snkFullDayProfit: profit,
                    snkFullMonthProfit: profit,
                    snkFullYearProfit: profit,
                  },
                },
                { new: true }
              );
            }
          } else {
            // if()
            const totalEntryFee = entryFee * 1;
            let loss = potentialWinnerPrizeDecimal.toNumber() - totalEntryFee;

            if (!lastDayProfit) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                profit: 0,
                loss: loss,
                currentTime: currentDateFormat,
                fullDayLoss: loss,
                fullMonthLoss: loss,
                fullYearLoss: loss,
                snkFullDayLoss: loss,
                snkFullMonthLoss: loss,
                snkFullYearLoss: loss,
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentYear !== updatedYear) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                profit: 0,
                loss: loss,
                currentTime: currentDateFormat,
                fullDayLoss: loss,
                fullMonthLoss: loss,
                fullYearLoss: loss,
                snkFullDayLoss: loss,
                snkFullMonthLoss: loss,
                snkFullYearLoss: loss,
                // fullDayLoss:0 ,
                // fullMonthLoss:lastDayProfit.fullMonthLoss,
                // fullYearLoss:lastDayProfit.fullYearLoss
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentMonth !== updatedMonth) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                loss: loss,
                currentTime: currentDateFormat,
                fullDayLoss: loss,
                fullMonthLoss: loss,
                fullYearLoss: lastDayProfit.fullYearLoss + parseFloat(loss),
                fullYearProfit: lastDayProfit.fullYearProfit,
                snkFullDayLoss: loss,
                snkFullMonthLoss: loss,
                crickFullYearLoss: lastDayProfit.crickFullYearLoss,
                crickFullYearProfit: lastDayProfit.crickFullYearProfit,
                snkFullYearProfit: lastDayProfit.snkFullYearProfit,
                snkFullYearLoss: lastDayProfit.snkFullYearLoss + parseFloat(loss),
              };
              const createProfit = await profitLossModel.create(profitData);
            } else if (currentDate !== lastUpdatedDate) {
              const profitData = {
                gameType: [{ gameName: "snakeLadder", grpId: groupId }],
                groupId:  [groupId],
                loss: loss,
                currentTime: currentDateFormat,
                fullDayLoss: loss,
                fullMonthLoss: lastDayProfit.fullMonthLoss + parseFloat(loss),
                fullYearLoss: lastDayProfit.fullYearLoss + parseFloat(loss),
                fullMonthProfit: lastDayProfit.fullMonthProfit,
                fullYearProfit: lastDayProfit.fullYearProfit,
                snkFullDayLoss: loss,
                snkFullMonthProfit:
                  lastDayProfit.snkFullMonthProfit + parseFloat(loss),
                snkFullYearLoss: lastDayProfit.snkFullYearLoss + parseFloat(loss),
                snkFullMonthProfit: lastDayProfit.snkFullMonthProfit,
                snkFullYearProfit: lastDayProfit.snkFullYearProfit,
                crickFullMonthLoss: lastDayProfit.crickFullMonthLoss,
                crickFullYearLoss: lastDayProfit.crickFullYearLoss,
                crickFullMonthProfit: lastDayProfit.crickFullMonthProfit,
                crickFullYearProfit: lastDayProfit.crickFullYearProfit,
              };
              const createProfit = await profitLossModel.create(profitData);
            } else {
              await profitLossModel.updateOne(
                {
                  currentTime: currentDateFormat,
                },
                {
                  $push: {
                    gameType: { gameName: "snakeLadder", grpId: groupId },
                    groupId: groupId ,
                  },
                  $inc: {
                    loss: loss,
                    fullDayLoss: loss,
                    fullMonthLoss: loss,
                    fullYearLoss: loss,
                    snkFullDayLoss: loss,
                    snkFullMonthLoss: loss,
                    snkFullYearLoss: loss,
                  },
                },
                { new: true }
              );
            }
          }
        }

        // Update the players array with the updated winner(s) and runner-up
        let playersUpdate = updatedPlayers;

        let overGame = await groupModelForSnakeLadder.findOneAndUpdate(
          {
            _id: groupId,
            "updatedPlayers.UserId": {
              $in: updatedPlayers.map((player) => player.UserId),
            },
          },
          {
            $set: {
              updatedPlayers: playersUpdate,
              isGameOver: true,
              isGameStart: 2,
            },
          },
          { new: true }
        );
        if (!overGame) {
          console.log({ status: false, error: "Game not found" });
        }
        if (overGame.isGameOver === true) {
          console.log("Reached minimum point!");
          return true;
        }
      }
      //_____________________finished winnerlogic ______________________________
      let botPlayer = updatedPlayers.find(
        (player) => player.isBot && player.turn
      );
      if (botPlayer) {
     console.log("<=====calling the funtion if the player is bot====>");
        updateBotPoints(botPlayer,snakeLadder);
        }
       

      //_____________________________________________passing turn______________________________________

      const timeSinceLastHit =
        Math.abs(snakeLadder.lastHitTime.getTime() - new Date().getTime()) /
        1000;
        const timeSinceNextTurnTime = snakeLadder.nextTurnTime.getTime() - new Date().getTime() /
        1000;
      if (timeSinceLastHit >= 12 && timeSinceNextTurnTime <= 0) { //pass the turn if the lasthitTime is morethan 12 sec
        //____________________________________________Switch turn to next user

        const currentUserIndex = updatedPlayers.findIndex(
          (player) => player.UserId === snakeLadder.currentUserId
        );

        const nextUserIndex = (currentUserIndex + 1) % updatedPlayers.length;
        const nextUserId = updatedPlayers[nextUserIndex].UserId;
        snakeLadder.currentUserId = nextUserId;
        //  snakeLadder.lastHitTime = new Date();
        snakeLadder.updatedPlayers[currentUserIndex].dicePoints = 0;
        snakeLadder.updatedPlayers[nextUserIndex].dicePoints = 0;
        snakeLadder.updatedPlayers[nextUserIndex].turn = true;
        snakeLadder.updatedPlayers[currentUserIndex].turn = false;
        snakeLadder.nextTurnTime = new Date(Date.now() + 12 * 1000);
        snakeLadder.lastHitTime = new Date();
        const checkBot = updatedPlayers[nextUserIndex].isBot
        let botPlayer = updatedPlayers.find(
          (player) => player.isBot && player.UserId === nextUserId
        );
        if(checkBot){
          console.log("<====calling the funtion if the player is time is passed ====>");
         updateBotPoints(botPlayer,snakeLadder);
        }else{
          let updateTurn = await groupModelForSnakeLadder.findByIdAndUpdate(
            { _id: groupId },
            { $set: snakeLadder },
            { new: true }
          );
        }

        //___________________________________Save updated snakeLadder to database

        
      }
    } catch (error) {
      console.log("Error in checkTurn function:", error);
    }
  }
  return false;
}

async function overTheGame(groupId) {
  let count = 0;
  if (groupId != undefined) {
    try {
      let continueRunning = true;
      async function updateMatchRecursive() {
        if (continueRunning) {
          const isMaxCountReached = await checkTurn(groupId);
          if (!isMaxCountReached) {
            setTimeout(async () => {
              updateMatchRecursive();
            }, 12000); // 2 seconds
          }
        }
      }
      updateMatchRecursive();
    } catch (error) {
      console.error("Error in overTheGame:", error);
    }
  }
}

//_______________________________for TicTacToe_____________________________________________

const createGroupForticTacToe = async function (tableId) {
  console.log(tableId, "============create gorup in tictactoe");
  if (tableId != undefined) {
    let table = await ticTacToeTournamentModel.findOne({ _id: tableId });

    if (table != undefined || table != null) {
      let players = table.players;
      let users = table.Users;

      if (users.length !== 0) {
        users = users.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        });
        //________________________________import dummyusers and add as per need to complete groups

        let dummyUsers = fakeUsers.fakeUsers;
        dummyUsers = dummyUsers.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        });
        const groups = _.chunk(players, 2);

        let completePlayers = [
          ...users,
          ...dummyUsers.slice(0, 2 - (users.length % 2)),
        ];

        let completeGroups = _.chunk(completePlayers, 2);

        for (let i = 0; i < completeGroups.length; i++) {
          let createGrp = await ticTacToeGroupModel.create({
            group: completeGroups[i],
            tableId: tableId,
          });
          let grpId = createGrp._id;
          let group = createGrp.group;
          console.log(createGrp);
          // setTimeout(function () {
          startMatchForticTacToe(grpId, group);
          //  }, 5000);
        }
      }
    }
  }
};

async function startMatchForticTacToe(grpId, group) {
  console.log("grpid>>>>>>>>>>>", grpId);
  console.log("groups>>>>>>>>>>>>>>>>>", group);
  if (grpId !== undefined) {
    const result = group.map((name) => ({
      UserId: name.UserId,
      userName: name.userName,
      isBot: name.isBot,
      positions: [],
      turn: name.turn,
      movement: "",
    }));
    console.log("result", result);

    let totalBot = result.filter((players) => players.isBot === true);
    totalBot = totalBot.length;
    let totalRealPlayres = result.filter((players) => players.isBot === false);
    totalRealPlayres = totalRealPlayres.length;

    let matchData = await ticTacToeGroupModel.findOneAndUpdate(
      { _id: grpId },
      {
        updatedPlayers: result,
        $set: {
          totalBotInGrp: totalBot,
          totalPlayerInGrp: totalRealPlayres,
          start: true,
          gameEndTime: Date.now() + 3 * 60 * 1000,
        },
      },
      { new: true, setDefaultsOnInsert: true }
    );

    await new Promise((resolve) => {
      setTimeout(async function () {
        let updatedPlayers = matchData.updatedPlayers;
        let currentPlayerIndex = Math.floor(
          Math.random() * updatedPlayers.length
        );
        matchData.updatedPlayers[currentPlayerIndex].turn = true;
        matchData.lastHitTime = new Date();
        matchData.isGameStart = 1;
        matchData.currentUserId = updatedPlayers[currentPlayerIndex].UserId;

        const updatedGroupFst = await matchData.save();

        resolve();
      }, 6000);
    });

    // Rest of your code here...
  }
}

module.exports = {
  startMatch,
  runUpdateBalls,
  createGroup,
  createGroupForSnakeLadder,
  createGroupForticTacToe,
  createGroupByAdmin,
  updateBotPoints
};
