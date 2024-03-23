// const mongoose = require("mongoose");
// const userModel = require("../model/userModel");
// const _ = require("lodash");
// const fakeUsers = require("../controller/dummyUsers");
// const { find } = require("lodash");
// const rocketTournamentModel = require("../model/rocketTournamentModel");
// delete require.cache[require.resolve("../controller/rocketController")];
// const rktGroupModel = require("../controller/rocketController");
// const Decimal = require("decimal.js");
// const profitLossModel = require("../model/profitLossModel");
// const botModel = require("../model/botModel");
// const moment = require("moment");
// const cron = require("node-cron");
// delete require.cache[require.resolve("../reusableCodes/snkReus")] // resolve the Warning: Accessing non-existent property 'checkTurnForRkt' of module exports inside circular dependency
// const {changeTurn} = require("../reusableCodes/snkReus");
// //________________________________________________for Roket________________________________________________

// const createGroupFoRocket = async function (tableId) {
//     console.log(tableId, "============create gorup in snk");
//     if (tableId != undefined) {
//       let table = await rocketTournamentModel.findOne({ _id: tableId });
  
//       if (table != undefined || table != null) {
//         let players = table.players;
//         let users = table.Users;
  
//         if (users.length !== 0) {
//           users = users.map((user) => {
//             return {
//               UserId: user.UserId,
//               userName: user.userName,
//               isBot: user.isBot,
//             };
//           });
//           const requiredBot = players % 2;
//           let totalBot;
//           if (requiredBot === 1) {
//             totalBot = 1;
//           } else {
//             totalBot = 0;
//           }
//           const updateTournament = await rocketTournamentModel.findOneAndUpdate(
//             { _id: tableId },
//             { $set: { totalBotInTable: totalBot, totalPlayersInTable: players } },
//             { new: true }
//           );
//           //________________________________import dummyusers and add as per need to complete groups
  
//           let dummyUsers = fakeUsers.fakeUsers;
//           dummyUsers = dummyUsers.map((user) => {
//             return {
//               UserId: user.UserId,
//               userName: user.userName,
//               isBot: user.isBot,
//             };
//           });
//           const groups = _.chunk(players, 2);
  
//           let completePlayers = [
//             ...users,
//             ...dummyUsers.slice(0, 2 - (users.length % 2)),
//           ];
  
//           let completeGroups = _.chunk(completePlayers, 2);
  
//           for (let i = 0; i < completeGroups.length; i++) {
//             let createGrp = await rktGroupModel.create({
//               group: completeGroups[i],
//               tableId: tableId,
//             });
//             let grpId = createGrp._id;
//             let group = createGrp.group;
//             console.log(createGrp);
//             // setTimeout(function () {
//               startMatchForRocket(grpId, group);
//             //  }, 5000);
//           }
//         }
//       }
//     }
//   };
  
//   // async function startMatchForRocket(grpId, group) {
//   //   console.log("grpid>>>>>>>>>>>", grpId);
//   //   // console.log("groups>>>>>>>>>>>>>>>>>", group);
  
//   //   if (grpId !== undefined) {
//   //     const result = group.map((name) => ({
//   //       UserId: name.UserId,
//   //       userName: name.userName,
//   //       isBot: name.isBot,
//   //       points: 0,
//   //       turn: name.turn,
//   //       dicePoints: 0
//   //     }));
//   //     // console.log("result", result);
  
//   //     let totalBot = result.filter((players) => players.isBot === true);
//   //     totalBot = totalBot.length;
//   //     let totalRealPlayres = result.filter((players) => players.isBot === false);
//   //     totalRealPlayres = totalRealPlayres.length;
//   //     const twoMinutesFifteenSeconds = 2 * 60 * 1000 + 15 * 1000;
//   //     const matchData = await rktGroupModel.findOneAndUpdate(
//   //       { _id: grpId },
//   //       {
//   //         updatedPlayers: result,
//   //         $set: {
//   //           totalBotInGrp: totalBot,
//   //           totalPlayerInGrp: totalRealPlayres,
//   //           start: true,
//   //           gameEndTime: Date.now() + twoMinutesFifteenSeconds,
//   //         },
//   //       },
//   //       { new: true, setDefaultsOnInsert: true }
//   //     );
  
//   //     console.log(
//   //       new Date().getSeconds(),
//   //       "----before 6 sec of starting the game---",
//   //       matchData.isGameStart
//   //     );
  
//   //     await new Promise(async (resolve) => {
//   //       let updatedPlayers = matchData.updatedPlayers;
//   //       const isBot = updatedPlayers.find(player => player.isBot);
//   //       let currentPlayerIndex ;
//   //       if(isBot){
//   //         console.log("<========if bot is present=====>",isBot.UserId);
//   //         currentPlayerIndex = updatedPlayers.findIndex(players => players.UserId !== isBot.UserId);
//   //         console.log("currentPlayerIndex====>",currentPlayerIndex);
//   //       }else{
//   //         console.log("<========if bot is not present=====>");
//   //         currentPlayerIndex = Math.floor(
//   //           Math.random() * updatedPlayers.length
//   //       );
//   //       } 
//   //       matchData.updatedPlayers[currentPlayerIndex].turn = true;
//   //       matchData.lastHitTime = new Date();
//   //       matchData.isGameStart = 1;
//   //       matchData.currentUserId = updatedPlayers[currentPlayerIndex].UserId;
//   //       matchData.nextTurnTime = new Date(Date.now() + 15 * 1000);
    
//   //       const updatedGroupFst = await matchData.save();
//   //       console.log(
//   //           new Date().getSeconds(),
//   //           "--after 6 sec of starting the game--",
//   //           updatedGroupFst.isGameStart
//   //       );
//   //       resolve(); // Resolve the promise to continue with the rest of the code
//   //       overRocketGame(grpId);
//   //   });
    
//   //   }
//   // }
  
//   //_____________bot's point update_______________
//   async function updateRktBotPoints(botPlayer,rocket){
//     let botPlayerId = botPlayer.UserId;
//     let updatedPlayers = rocket.updatedPlayers ;
//     const currentUserIndex = rocket.updatedPlayers.findIndex(
//       (player) => player.UserId === botPlayerId
//     );
//     const nextUserIndex = (currentUserIndex + 1) % updatedPlayers.length;
//     const nextUserId = rocket.updatedPlayers[nextUserIndex].UserId;
//     const possibleValues = [1, 2, 3, 4, 5, 6];
  
//     const randomIndex = Math.floor(Math.random() * possibleValues.length);
//     const randomValue = possibleValues[randomIndex];
  
//     // Calculate current position
//     let currentPosition = botPlayer.points + randomValue;
//     // Ensure that the current position does not exceed 99
//     const newPosition =
//     currentPosition > 20
//       ? updatedPlayers[currentUserIndex].points
//       : currentPosition;
//     rocket.updatedPlayers[currentUserIndex].points = newPosition; 
//     rocket.updatedPlayers[currentUserIndex].dicePoints = randomValue;
//     rocket.updatedPlayers[nextUserIndex].dicePoints = 0;
//       rocket.updatedPlayers[currentUserIndex].turn = false;
//     console.log(
//       rocket.nextTurnTime.getSeconds(),
//       "sec before db call============="
//     );
  
//     rocket.nextTurnTime = new Date(Date.now() + 16 * 1000); //set  turn 16 sec for real user 
//     rocket.currentUserId = nextUserId;
//     rocket.updatedPlayers[nextUserIndex].turn = true;
//     rocket.lastHitTime = new Date();
//     console.log(
//       "after setTimeout in put >>>>>",
//       new Date().getSeconds(),
//       "++++++++++++",
//       rocket
//     );
  
//     let updatedData = await rktGroupModel.findOneAndUpdate(
//       { _id: rocket._id },
//       {
//         $set: rocket,
//       },
//       { new: true }
//     );
//     console.log(
//       updatedData.nextTurnTime.getSeconds(),
//       "sec after db call========"
//     );
//      return updatedData ;
//   }
  
  
// //   async function overRocketGame(groupId) {
// //     const MAX_DURATION_SECONDS = 180; // 3 minutes
// //     const INTERVAL_MILLISECONDS = 12000; // 12 seconds

// //     let startTime = Date.now();

// //     if (groupId != undefined) {
// //         try {
// //             let continueRunning = true;

// //             let intervalId = setInterval(async () => {
// //                 if (continueRunning) {
// //                     const isMaxCountReached = await checkTurnForRkt(groupId);
// //                     if (!isMaxCountReached) {
// //                         let elapsedTimeSeconds = (Date.now() - startTime) / 1000;
// //                         if (elapsedTimeSeconds >= MAX_DURATION_SECONDS) {
// //                             console.log("Max duration reached. Stopping recursive call.");
// //                             clearInterval(intervalId); // Stop the interval
// //                         }
// //                     } else {
// //                         clearInterval(intervalId); // Stop the interval
// //                     }
// //                 }
// //             }, INTERVAL_MILLISECONDS);
// //         } catch (error) {
// //             console.error("Error in overTheGame:", error);
// //         }
// //     }
// // }

// async function checkTurnForRkt(groupId, gameName) {
//   console.log("groupId===>",groupId, "gameName===>", gameName);
//   if (!groupId) return false; //{
//         try {
//             let rocket = await rktGroupModel.findById({ _id: groupId });
//             let { tableId, updatedPlayers, gameEndTime, lastHitTime, nextTurnTime } = rocket;

//             let timeDiff = gameEndTime - new Date();
//             let reachTheDestination = updatedPlayers.find(player => player.points === 20);

//             if (timeDiff <= 0 || reachTheDestination) {
//                // if (timeDiff <= 0 || reachTheDestination) {
//             let overTheGame = await rocketTournamentModel.findByIdAndUpdate(
//               { _id: tableId },
//               { isMatchOverForTable: true },
//               { new: true }
//             );
//             let profit = 0;
//             let loss = 0;
//             let gameName = 'rocket'
//             let entryFee = overTheGame.entryFee;
//             let playerCountForRkt = updatedPlayers.filter(
//               (player) => !player.isBot
//             ).length;
    
//             //----------- Find the player with the highest points (the potential winner)
//             let potentialWinner = updatedPlayers.reduce(
//               (prevPlayer, currentPlayer) => {
//                 return prevPlayer.points > currentPlayer.points
//                   ? prevPlayer
//                   : currentPlayer;
//               }
//             );
//             // Check if there is a tie (both players have equal points)
//             let isTie = updatedPlayers.every(
//               (player) => player.points === potentialWinner.points
//             );
    
//             if (isTie) {
//               console.log("=======calculate profit or loss if game is tie====");
//               // Both players are winners with a prize of 0.5
//               const prizeDecimal = new Decimal(entryFee).times(0.5);
//               for (const player of updatedPlayers) {
//                 player.prize = prizeDecimal.toNumber();
//                 player.turn = false;
//                 player.dicePoints = 0;
//                 if (!player.isBot) {
//                   await userModel.findOneAndUpdate(
//                     { UserId: player.UserId, "history.tableId": tableId },
//                     {
//                       $inc: {
//                         realMoney: player.prize,
//                         rocketWinAmount: player.prize,
//                       },
//                       $set: {
//                         "history.$.result": "lose",
//                         "history.$.win": player.prize,
//                       },
//                       $push: {
//                         transactionHistory: {
//                           date: new Date(),
//                           amount: player.prize,
//                           type: "winnings",
//                           gameType: "rocket",
//                         },
//                       },
//                     },
//                     { new: true }
//                   );
//                 }
//                 if (playerCountForRkt === 2) {
//                   const totalEntryFee = entryFee * 2;
//                   profit = totalEntryFee - prizeDecimal;
//                   console.log(profit,"======if tie and player is 2");
//                 } else {
//                   const totalEntryFee = entryFee * 1;
//                   profit = totalEntryFee - prizeDecimal;
//                   console.log(profit,"======if tie and player is 1 and onother is bot");
//                 }
//                 await updateProfitLoss(gameName, groupId, profit, loss, moment().format("DD-MM-YYYY"));
//               }
//             } else {
//               // Calculate the prize for the potential winner and the runner-up
//               // potentialWinner.prize = entryFee * 1.5;
//               console.log("====calculate profit and loss if game is not tie=====");
//               const potentialWinnerPrizeDecimal = new Decimal(entryFee).times(1.5);
//               potentialWinner.prize = potentialWinnerPrizeDecimal.toNumber();
//               let runner = updatedPlayers.find(
//                 (player) => player.UserId !== potentialWinner.UserId
//               );
//               runner.prize = entryFee * 0;
    
//               // Set the turn and dicePoints to 0 for both players
//               potentialWinner.turn = false;
//               potentialWinner.dicePoints = 0;
//               runner.turn = false;
//               runner.dicePoints = 0;
//               //___________________________________update the winner's realMoney_______________
    
//               await userModel.findOneAndUpdate(
//                 { UserId: potentialWinner.UserId, "history.tableId": tableId },
//                 {
//                   $inc: {
//                     realMoney: potentialWinnerPrizeDecimal.toNumber(),
//                     rocketWinAmount: potentialWinnerPrizeDecimal.toNumber(),
//                     "rocketData.0.winCount": 1,
//                   }, // Increment playCount by 1,
//                   $set: {
//                     "history.$.result": "win",
//                     "history.$.win": potentialWinnerPrizeDecimal.toNumber(),
//                   },
//                   $push: {
//                     transactionHistory: {
//                       date: new Date(),
//                       amount: potentialWinnerPrizeDecimal.toNumber(),
//                       type: "winnings",
//                       gameType: "rocket",
//                     },
//                   },
//                 },
//                 { new: true }
//               );
    
//               //_______________________________________update the runner's data ______________
    
//               await userModel.findOneAndUpdate(
//                 { UserId: runner.UserId, "history.tableId": tableId },
//                 {
//                   $set: { "history.$.result": "lose" },
//                 },
//                 { new: true }
//               );
    
//               if (playerCountForRkt === 2 || potentialWinner.isBot) {
    
//                 if(potentialWinner.isBot){
//                   profit = entryFee;
//                   console.log(profit,"======if game is not tie and winner is bot");
//                 }
//                 if(playerCountForRkt === 2){
//                   const totalEntryFee = entryFee * 2;
//                   profit = totalEntryFee - potentialWinnerPrizeDecimal.toNumber();
//                   console.log(profit,"======if game is not tie and player is 2");
//                 }
               
//                 await updateProfitLoss(gameName, groupId, profit, loss, moment().format("DD-MM-YYYY"));
//               } else {
//                 // if()
//                 const totalEntryFee = entryFee * 1;
//                  loss = potentialWinnerPrizeDecimal.toNumber() - totalEntryFee;
    
//                  await updateProfitLoss(gameName, groupId, profit, loss, moment().format("DD-MM-YYYY"));
//               }
//             }
    
//             // Update the players array with the updated winner(s) and runner-up
//             let playersUpdate = updatedPlayers;
    
//             let overGame = await rktGroupModel.findOneAndUpdate(
//               {
//                 _id: groupId,
//                 "updatedPlayers.UserId": {
//                   $in: updatedPlayers.map((player) => player.UserId),
//                 },
//               },
//               {
//                 $set: {
//                   updatedPlayers: playersUpdate,
//                   isGameOver: true,
//                   isGameStart: 2,
//                 },
//               },
//               { new: true }
//             );
//             if (!overGame) {
//               console.log({ status: false, error: "Game not found" });
//             }
//             if (overGame.isGameOver === true) {
//               console.log("Reached minimum point!");
//               return true; //for stop the calling
//             }
//             }
//             const botPlayer = updatedPlayers.find(player => player.isBot && player.turn);
//             if (botPlayer) {
//                 // Bot player logic
//                 await updateRktBotPoints(botPlayer, rocket);
//             }

//             const timeSinceLastHit =
//             Math.abs(rocket.lastHitTime.getTime() - new Date().getTime()) /
//             1000;
//             const timeSinceNextTurnTime = rocket.nextTurnTime.getTime() - new Date().getTime() /
//             1000;
//           if (timeSinceLastHit >= 15 && timeSinceNextTurnTime <= 0) {
//             await changeTurn(rocket, gameName);
//           }

//         } catch (error) {
//             console.log("Error in checkTurnForRkt function:", error);
//         }
//     // }
//     // return false;
// }


  
// module.exports = {
//     createGroupFoRocket, 
//     updateRktBotPoints,
//     checkTurnForRkt

// }  