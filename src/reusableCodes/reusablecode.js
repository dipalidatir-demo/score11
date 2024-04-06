// const mongoose = require("mongoose");
// const userModel = require("../model/userModel");
// const _ = require("lodash");
// const fakeUsers = require("../controller/dummyUsers");
// const { find } = require("lodash");
// delete require.cache[require.resolve("../controller/rocketController")];
// const ticTacToeTournamentModel = require("../model/ticTacToeTournamentModel");
// const ticTacToeGroupModel = require("../model/ticTacToeGroupModel");
// const Decimal = require("decimal.js");
// const profitLossModel = require("../model/profitLossModel");
// const botModel = require("../model/botModel");
// const moment = require("moment");
// const cron = require("node-cron");
// const {makeMoven} = require("../controller/ticTacToeController");
// const TicTacToeGroup = require("./TicTacToeGroupModel");


// //_______________________________for TicTacToe_____________________________________________

// const createGroupForticTacToe = async function (tableId) {
//   console.log(tableId, "============create gorup in tictactoe");
//   if (tableId != undefined) {
//     let table = await ticTacToeTournamentModel.findOne({ _id: tableId });

//     if (table != undefined || table != null) {
//       let players = table.players;
//       let users = table.Users;

//       if (users.length !== 0) {
//         users = users.map((user) => {
//           return {
//             UserId: user.UserId,
//             userName: user.userName,
//             isBot: user.isBot,
//           };
//         });
//         //________________________________import dummyusers and add as per need to complete groups

//         let dummyUsers = fakeUsers.fakeUsers;
//         dummyUsers = dummyUsers.map((user) => {
//           return {
//             UserId: user.UserId,
//             userName: user.userName,
//             isBot: user.isBot,
//           };
//         });
//         const groups = _.chunk(players, 2);

//         let completePlayers = [
//           ...users,
//           ...dummyUsers.slice(0, 2 - (users.length % 2)),
//         ];

//         let completeGroups = _.chunk(completePlayers, 2);

//         for (let i = 0; i < completeGroups.length; i++) {
//           let createGrp = await ticTacToeGroupModel.create({
//             group: completeGroups[i],
//             tableId: tableId,
//           });
//           let grpId = createGrp._id;
//           let group = createGrp.group;
//           console.log(createGrp);
//           // setTimeout(function () {
//           startMatchForticTacToe(grpId, group);
//           //  }, 5000);
//         }
//       }
//     }
//   }
// };

// async function startMatchForticTacToe(grpId, group) {
//   console.log("grpid>>>>>>>>>>>", grpId);
//   console.log("groups>>>>>>>>>>>>>>>>>", group);
//   if (grpId !== undefined) {
//     const result = group.map((name) => ({
//       UserId: name.UserId,
//       userName: name.userName,
//       isBot: name.isBot,
//       positions: [],
//       turn: name.turn,
//       movement: "",
//     }));
//     console.log("result", result);

//     let totalBot = result.filter((players) => players.isBot === true);
//     totalBot = totalBot.length;
//     let totalRealPlayres = result.filter((players) => players.isBot === false);
//     totalRealPlayres = totalRealPlayres.length;

//     let matchData = await ticTacToeGroupModel.findOneAndUpdate(
//       { _id: grpId },
//       {
//         updatedPlayers: result,
//         $set: {
//           totalBotInGrp: totalBot,
//           totalPlayerInGrp: totalRealPlayres,
//           start: true,
//           board:[
//             ['', '', ''],
//             ['', '', ''],
//             ['', '', '']
//           ],
//           gameEndTime: Date.now() + 135000 ,
//         },
//       },
//       { new: true, setDefaultsOnInsert: true }
//     );

//     await new Promise( async ( resolve ) => {
//       let updatedPlayers = matchData.updatedPlayers;
//       const isBot = updatedPlayers.find( ( player ) => player.isBot );
//       let currentPlayerIndex;
//       if ( isBot ) {
//         console.log( "<========if bot is present=====>", isBot.UserId );
//         currentPlayerIndex = updatedPlayers.findIndex(
//           ( players ) => players.UserId !== isBot.UserId
//         );
//         console.log( "currentPlayerIndex====>", currentPlayerIndex );
//       } else {
//         console.log( "<========if bot is not present=====>" );
//         currentPlayerIndex = Math.floor( Math.random() * updatedPlayers.length );
//       }
//       matchData.updatedPlayers[currentPlayerIndex].turn = true;
//       matchData.updatedPlayers[currentPlayerIndex].turn  = 'x' ;
//       matchData.lastHitTime = new Date();
//       matchData.isGameStart = 1;
//       matchData.currentUserId = updatedPlayers[currentPlayerIndex].UserId;
//       matchData.nextTurnTime = new Date( Date.now() + 15 * 1000 );

//       const updatedGroupFst = await matchData.save();
//       console.log(
//         new Date().getSeconds(),
//         "--after 6 sec of starting the game--",
//         updatedGroupFst.isGameStart
//       );
//       resolve(); // Resolve the promise to continue with the rest of the code
//         overTheGameForPlayers( grpId, gameName, Token);
//     } );
  

//     // Rest of your code here...
//   }
// }

// // Function to initialize the game board
// function initializeBoard() {
//   return [
//     ['', '', ''],
//     ['', '', ''],
//     ['', '', '']
//   ];
// }

// // Function for bot move (random)
// function botMove(board) {
//   let row, col;
//   do {
//     row = Math.floor(Math.random() * 3);
//     col = Math.floor(Math.random() * 3);
//   } while (board[row][col] !== '');
//   return { row, col };
// }


// // Function to check for a winner
// function checkWinner(board) {
//   // Check rows
//   for (let i = 0; i < 3; i++) {
//     if (board[i][0] !== '' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
//       return board[i][0];
//     }
//   }

//   // Check columns
//   for (let i = 0; i < 3; i++) {
//     if (board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
//       return board[0][i];
//     }
//   }

//   // Check diagonals
//   if (board[0][0] !== '' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
//     return board[0][0];
//   }
//   if (board[0][2] !== '' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
//     return board[0][2];
//   }

//   return null;
// }

// // Function to check for a draw
// function isDraw(board) {
//   for (let row of board) {
//     for (let cell of row) {
//       if (cell === '') {
//         return false;
//       }
//     }
//   }
//   return true;
// }

// // Function to start the game
// async function startGame(tableId) {
//   // Find the game group in the database
//   const group = await TicTacToeGroup.findOne({ tableId });
//   if (!group) {
//     throw new Error("Group not found");
//   }

//   // Initialize the game board
//   group.board = initializeBoard();

//   // Randomly choose the starting player
//   const startingPlayerIndex = Math.floor(Math.random() * 2);
//   group.updatedPlayers[startingPlayerIndex].turn = true;

//   // Set the game start time and end time
//   group.start = true;
//   group.gameEndTime = Date.now() + 3 * 60 * 1000;

//   // Save the updated game group
//   await group.save();
// }

// // Example usage
// const grpId = "yourGroupId";
// const playerId = "yourPlayerId";
// try {
//   await makeMove(grpId, 0, 0, playerId); // Example move
// } catch (error) {
//   console.error(error.message);
// }

// module.exports ={
//   botMove,
//   checkWinner,
//   isDraw,
//   startGame,
//   createGroupForticTacToe
// }