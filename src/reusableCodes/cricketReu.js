const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const tournamentModel = require("../model/tournamentModel");
const _ = require("lodash");
const { find } = require("lodash");
const groupModel = require("../model/groupModel");
delete require.cache[require.resolve("../controller/rocketController")];
const Decimal = require("decimal.js");
const profitLossModel = require("../model/profitLossModel");
const botModel = require("../model/botModel");
const moment = require("moment");
const {pushNotification} = require("../controller/sendNotificationsController");
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
          }).select({ UserId: 1, userName: 1, isBot: 1, _d:0, botType:1});
  
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
  
      if (table && table.Users.length !== 0) { 
        let players = table.players;
        let users = table.Users;
  
        // if (users.length !== 0) {
          users = users.map((user) => {
            return {
              UserId: user.UserId,
              userName: user.userName,
              token:user.token,
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
          }).select({ UserId: 1, userName: 1, isBot: 1, _id:0, botType:1});
  
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
        // }
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
      const Token = group.map(item => item.token).filter(token => token !== undefined);
      console.log("Token===========>",Token);
      pushNotification(Token,"Game will start soon!");
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
        runUpdateBalls(grpId, Token);
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
          // let updatedPlayer = { ...player }; // Clone the player object
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
              rktFullYearProfit:lastDayProfit.rktFullYearProfit,
              rktFullYearLoss:lastDayProfit.rktFullYearLoss,
              airHocFullYearProfit:lastDayProfit.airHocFullYearProfit,
              airHocFullYearLoss:lastDayProfit.airHocFullYearLoss
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
              rktFullMonthProfit:lastDayProfit.rktFullMonthProfit,
              rktFullYearProfit:lastDayProfit.rktFullYearProfit,
              rktFullMonthLoss:lastDayProfit.rktFullMonthLoss,
              rktFullYearLoss:lastDayProfit.rktFullYearLoss,
              airHocFullMonthProfit :lastDayProfit.airHocFullMonthProfit,
              airHocFullYearProfit:lastDayProfit.airHocFullYearProfit,
              airHocFullMonthLoss:lastDayProfit.airHocFullMonthLoss,
              airHocFullYearLoss:lastDayProfit.airHocFullYearLoss
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
                rktFullYearProfit:lastDayProfit.rktFullYearProfit,
                rktFullYearLoss:lastDayProfit.rktFullYearLoss,
                airHocFullYearProfit:lastDayProfit.airHocFullYearProfit,
                airHocFullYearLoss:lastDayProfit.airHocFullYearLoss
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
                rktFullMonthProfit:lastDayProfit.rktFullMonthProfit,
                rktFullYearProfit:lastDayProfit.rktFullYearProfit,
                rktFullMonthLoss:lastDayProfit.rktFullMonthLoss,
                rktFullYearLoss:lastDayProfit.rktFullYearLoss,
                airHocFullMonthProfit :lastDayProfit.airHocFullMonthProfit,
                airHocFullYearProfit:lastDayProfit.airHocFullYearProfit,
                airHocFullMonthLoss:lastDayProfit.airHocFullMonthLoss,
                airHocFullYearLoss:lastDayProfit.airHocFullYearLoss
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
                rktFullYearProfit:lastDayProfit.rktFullYearProfit,
                rktFullYearLoss:lastDayProfit.rktFullYearLoss,
                airHocFullYearProfit:lastDayProfit.airHocFullYearProfit,
                airHocFullYearLoss:lastDayProfit.airHocFullYearLoss
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
                rktFullMonthProfit:lastDayProfit.rktFullMonthProfit,
                rktFullYearProfit:lastDayProfit.rktFullYearProfit,
                rktFullMonthLoss:lastDayProfit.rktFullMonthLoss,
                rktFullYearLoss:lastDayProfit.rktFullYearLoss,
                airHocFullMonthProfit :lastDayProfit.airHocFullMonthProfit,
                airHocFullYearProfit:lastDayProfit.airHocFullYearProfit,
                airHocFullMonthLoss:lastDayProfit.airHocFullMonthLoss,
                airHocFullYearLoss:lastDayProfit.airHocFullYearLoss
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
  
  async function runUpdateBalls(grpId,Token) {
    console.log("call the runUpdateBalls function >>>>>>>>>>>", grpId);
    if (grpId != undefined) {
        let executionCount = 0;
        console.log("Token===========>",Token);
        pushNotification(Token,"Game has started");
        async function updateBallsRecursive() {
            const MAX_EXECUTION_COUNT = 8;
            if (executionCount < MAX_EXECUTION_COUNT) {
                const isMaxCountReached = await updateBalls(grpId);
                if (!isMaxCountReached) {
                    executionCount++;
                    setTimeout(updateBallsRecursive, 10000); // 10 seconds
                }
            } else {
                console.log("Max execution count reached. Stopping recursive call.");
            }
        }
  
        // Start the initial call to the recursive function
        updateBallsRecursive();
    }
  }
  
  module.exports = {
    startMatch,
    runUpdateBalls,
    createGroup,
    createGroupByAdmin,
  }