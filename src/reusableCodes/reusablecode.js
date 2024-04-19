const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const _ = require("lodash");
const fakeUsers = require("../controller/dummyUsers");
const { find } = require("lodash");
delete require.cache[require.resolve("../controller/rocketController")];
const ticTacToeTournamentModel = require("../model/ticTacToeTournamentModel");
const ticTacToeGroupModel = require("../model/ticTacToeGroupModel");
const Decimal = require("decimal.js");
const profitLossModel = require("../model/profitLossModel");
const botModel = require("../model/botModel");
const moment = require("moment");
const cron = require("node-cron");
// const {makeMoven} = require("../controller/ticTacToeController");
const { pushNotification } = require( "../controller/sendNotificationsController" );
const { updateProfitLoss } = require( "../reusableCodes/profitAndLossReu" );
// //_______________________________for TicTacToe_____________________________________________

const createGroupForticTacToe = async function (tableId, gameName) {
    console.log(tableId, "============call group in", `${gameName}`);
    try {
      if (tableId != undefined) {
        
        let table = await ticTacToeTournamentModel.findOne({ _id: tableId });
  
        if (table && table.Users.length !== 0) {
        //   console.log(tableId, "============create group in snk===>");
  
          let players = table.players;
          let users = table.Users;
  
          users = users.map((user) => {
            return {
              UserId: user.UserId,
              userName: user.userName,
              token: user.token,
              isBot: user.isBot,
            };
          });
          let totalBot = players % 2;
          const updateTournament = await ticTacToeTournamentModel.findOneAndUpdate(
            { _id: tableId },
            { $set: { totalBotInTable: totalBot, totalPlayersInTable: players } },
            { new: true }
          );
  
          // Get bot players array
          let botPlayersArray = fakeUsers.fakeUsers;
  
          // If there are sufficient real players, don't add any bot players
          if (players % 2 === 0) {
            botPlayersArray = [];
          }
  
          // Calculate the number of dummy users needed to complete groups
          const remainingPlayers = (players + totalBot) % 2; 
          const completePlayers = [
            ...users,
            ...botPlayersArray.slice(0, remainingPlayers),
          ];
  
          const completeGroups = _.chunk(completePlayers, 2);
  
          for (let i = 0; i < completeGroups.length; i++) {
            let groupPlayers = completeGroups[i];
            // Add a random bot if needed
            if (groupPlayers.length === 1 && totalBot > 0) {
              const randomIndex = Math.floor(Math.random() * botPlayersArray.length);
              const randomBotPlayer = botPlayersArray[randomIndex];
              groupPlayers.push(randomBotPlayer);
              totalBot--;
            }
            const createGrp = await ticTacToeGroupModel.create({
              group: groupPlayers,
              tableId: tableId,
            });
  
            const grpId = createGrp._id;
            const group = createGrp.group;
            console.log("grpId after creating group===",grpId);
            startMatchForticTacToe(grpId, group, gameName);
          }
        }
      }
    } catch (error) {
      console.error("Error in createGroupForSnakeLadder:", error);
    }
  };
  

async function startMatchForticTacToe(grpId, group, gameName) {
  console.log("grpid>>>>>>>>>>>", grpId);
  console.log("groups>>>>>>>>>>>>>>>>>", group);
  if (grpId !== undefined) {
    const result = group.map((name) => ({
      UserId: name.UserId,
      userName: name.userName,
      isBot: name.isBot,
      positions: [],
      turn: false,
      sign:'o'
    }));
    // console.log("result", result);
    const Token = group.map( item => item.token ).filter( token => token !== undefined );
    let totalBot = result.filter((players) => players.isBot === true);
    totalBot = totalBot.length;
    let totalRealPlayres = result.filter((players) => players.isBot === false);
    totalRealPlayres = totalRealPlayres.length;

    let matchDataForTic = await ticTacToeGroupModel.findOneAndUpdate(
      { _id: grpId },
      {
        updatedPlayers: result,
        $set: {
          totalBotInGrp: totalBot,
          totalPlayerInGrp: totalRealPlayres,
          start: true,
          board:[
            '', '', '',
            '', '', '',
            '', '', ''
          ],
          gameEndTime: Date.now() + 100000 ,
        },
      },
      { new: true, setDefaultsOnInsert: true }
    );

    await new Promise( async ( resolve ) => {
      let updatedPlayers = matchDataForTic.updatedPlayers;
      const isBot = updatedPlayers.find( ( player ) => player.isBot );
      let currentPlayerIndex;
      if ( isBot ) {
        console.log( "<========if bot is present=====>", isBot.UserId );
        currentPlayerIndex = updatedPlayers.findIndex(
          ( players ) => players.UserId !== isBot.UserId
        );
        console.log( "currentPlayerIndex====>", currentPlayerIndex );
      } else {
        console.log( "<========if bot is not present=====>" );
        currentPlayerIndex = Math.floor( Math.random() * updatedPlayers.length );
      }
      matchDataForTic.updatedPlayers[currentPlayerIndex].turn = true;
      matchDataForTic.updatedPlayers[currentPlayerIndex].sign  = 'x' ;
      matchDataForTic.lastHitTime = new Date();
      matchDataForTic.isGameStart = 1;
      matchDataForTic.currentUserId = updatedPlayers[currentPlayerIndex].UserId;
      matchDataForTic.nextTurnTime = new Date( Date.now() + 15 * 1000 );

      const updatedGroupFst = await matchDataForTic.save();
      console.log(
        new Date().getSeconds(),
        "--after 6 sec of starting the game--",
        updatedGroupFst.isGameStart
      );
      resolve(); // Resolve the promise to continue with the rest of the code
      overTheTicTacToeGame( grpId, gameName, Token);
    } );
  

    // Rest of your code here...
  }
}

// Function to initialize the game board
// function initializeBoard() {
//   return [
//     ['', '', ''],
//     ['', '', ''],
//     ['', '', '']
//   ];
// }

// Function for bot move (random)
function botMove(board) {
  // Check for potential winning moves for the bot
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      const newBoard = [...board];
      newBoard[i] = 'o'; // Try placing the bot's sign in an empty spot
      if (checkWinner(newBoard) === 'o') {
        return i; // If bot wins, return this move
      }
    }
  }

  // Check for potential winning moves for the user and block them
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      const newBoard = [...board];
      newBoard[i] = 'x'; // Try placing the user's sign in an empty spot
      if (checkWinner(newBoard) === 'x') {
        return i; // If user wins, block this move
      }
    }
  }

  // If no winning moves for either player, make a random move
  let position;
  do {
    position = Math.floor(Math.random() * board.length);
  } while (board[position] !== '');

  return position;
}



// Function to check for a winner
function checkWinner(board) {
  // Check rows
  switch (board[0] + board[1] + board[2]) {
      case 'xxx':
          return 'x';
      case 'ooo':
          return 'o';
  }
  switch (board[3] + board[4] + board[5]) {
      case 'xxx':
          return 'x';
      case 'ooo':
          return 'o';
  }
  switch (board[6] + board[7] + board[8]) {
    case 'xxx':
      return 'x';
    case 'ooo':
      return 'o';
  }

  // Check columns
  switch (board[0] + board[3] + board[6]) {
    case 'xxx':
      return 'x';
     case 'ooo':
      return 'o';
  }
  switch (board[1] + board[4] + board[7]) {
    case 'xxx':
      return 'x';
  case 'ooo':
      return 'o';
  }
  switch (board[2] + board[5] + board[8]) {
    case 'xxx':
      return 'x';
  case 'ooo':
      return 'o';
  }

  // Check diagonals
  switch (board[0] + board[4] + board[8]) {
    case 'xxx':
      return 'x';
  case 'ooo':
      return 'o';
  }
  switch (board[2] + board[4] + board[6]) {
    case 'xxx':
      return 'x';
  case 'ooo':
      return 'o';
  }

  // If no winner is found, return null
  return null;
}

// // Example usage:
// const board = [ "", "o", "x", "o", "x", "x", "x", "", "o"];

// const winner = checkWinner(board);
// if (winner) {
//     console.log(`${winner} is the winner!`);
// } else {
//     console.log('It\'s a draw!');
// }

// Function to check for a draw
function gameDraw(board) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      // If any position is empty, the game is not a draw
      return false;
    }
  }
  // If all positions are filled and there is no winner, it's a draw
  return true;
}


async function checkPosition ( groupId, gameName) {
    if ( !groupId ) return false; // Check if groupId is defined
    // console.log( "time in checkTurn ====>", new Date().getSeconds());
    try {
      
      const ticTacToe = await ticTacToeGroupModel.findById( groupId );
      if ( !ticTacToe ) return false; // Check if gameData exists
      if(ticTacToe.isGameOver)  return true;
      const { tableId, updatedPlayers, gameEndTime, lastHitTime, nextTurnTime } =
        ticTacToe;
        const currentDate = new Date();
          const timeDiff = gameEndTime - currentDate;
          console.log("timeDiff for ending the game in checkTurn ===>");
          // const isEmptyBoard = ticTacToe.board.every((el) => el !='')
      if (
        timeDiff <= 0) {
        console.log("<===========game end time is over ==============");
        const winner = checkWinner(ticTacToe.board);
        if (winner) {
          const overGame = await declareWinner(ticTacToe, gameName, false, winner);  
             if ( overGame.isGameOver === true ) {
              console.log( "Reached minimum point!" );
              return true;
             }
             
        } else if(gameDraw(ticTacToe.board)) { //match is draw
          const overGame = await declareWinner(ticTacToe, gameName, true, null);  
          if ( overGame.isGameOver === true ) {
           console.log( "Reached minimum point!" );
           return true;
          }
      } else{
        const overGame = await declareWinner(ticTacToe, gameName, true, null);  
          if ( overGame.isGameOver === true ) {
           console.log( "Reached minimum point!" );
           return true;
          }
      }   
      }
  
      // const botPlayer = updatedPlayers.find(
      //   ( player ) => player.isBot && player.turn
      // );
      // if ( botPlayer ) {
      //   console.log("gameName in botPlayer=======>",gameName);
       
      //   await updateBotPosition( botPlayer.UserId, ticTacToe, gameName );
      // }
      const timeSinceNextTurnTime =
        ( nextTurnTime.getTime() - currentDate.getTime() ) / 1000;
  
      if ( timeSinceNextTurnTime <= 0) {
        // Change turn logic
        await changeTurn( ticTacToe, gameName );
      }
    } catch ( error ) {
      console.log( "Error in checkTurn function:", error );
    }
    return false;
  }
  
async function overTheTicTacToeGame(groupId, gameName, Token) {
    console.log("game name in ticTactToe ====>", gameName);
    pushNotification(Token, "Game has started");
  
    const MAX_DURATION_SECONDS = 150; // 150 sec
    let startTime = Date.now();
    let timeoutId; // Store the timeout ID
    if (groupId !== undefined) {
        try {
            const checkAndSetTimeout = async () => {
                const elapsedTimeSeconds = (Date.now() - startTime) / 1000;
                if (elapsedTimeSeconds >= MAX_DURATION_SECONDS) {
                    console.log("Max duration reached. Stopping timeout.");
                    clearTimeout(timeoutId); // Stop the timeout
                    return;
                }
  
                try {
                    const isMaxCountReached = await checkPosition(groupId, gameName);
                    if (!isMaxCountReached) {
                        // If max count not reached, set the timeout for next iteration
                        timeoutId = setTimeout(checkAndSetTimeout, 4000); // 4 seconds
                    } else {
                        console.log("Max count reached. Stopping timeout.");
                        clearTimeout(timeoutId); // Stop the timeout
                    }
                } catch (error) {
                    console.error("Error in timeout execution:", error);
                }
            };
  
            // Start the initial call to the timeout function
            timeoutId = setTimeout(checkAndSetTimeout, 4000); // 4 seconds
        } catch (error) {
            console.error("Error setting up timeout:", error);
        }
    }
  }

  async function declareWinner(ticTacToe, gameName, isDraw, winner){
    try{
      console.log("declarewinner   ===>", ticTacToe._id);
      let tableId = ticTacToe.tableId ;
      let groupId = ticTacToe._id ;
        let overTheGame = await ticTacToeTournamentModel.findByIdAndUpdate(
            { _id: tableId },
            { isMatchOverForTable: true },
            { new: true }
          );
          
          let updatedPlayers = ticTacToe.updatedPlayers ;
          let profit = 0;
          let loss = 0;
          let entryFee = overTheGame.entryFee;
          let playerCount = updatedPlayers.filter(
            ( player ) => !player.isBot
          ).length;
    
          if ( isDraw ) {
            console.log( "=======calculate profit or loss if game is tie====" );
            const prizeDecimal = new Decimal( entryFee ).times( 0.5 );
            for ( const player of updatedPlayers ) {
              player.prize = prizeDecimal.toNumber();
              player.turn = false;
              if ( !player.isBot ) {
                await userModel.findOneAndUpdate(
                  { UserId: player.UserId, "history.tableId": tableId },
                  {
                    $inc: {
                      realMoney: player.prize,
                      airHockeyWinAmount: player.prize,
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
                        gameType: gameName,
                      },
                    },
                  },
                  { new: true }
                );
              }
            }
            if ( playerCount === 2 ) {
              const totalEntryFee = entryFee * 2;
              profit = totalEntryFee - prizeDecimal;
              console.log( profit, "======if tie and player is 2" );
            } else {
              const totalEntryFee = entryFee * 1;
              profit = totalEntryFee - prizeDecimal;
              console.log(
                profit,
                "======if tie and player is 1 and another is bot"
              );
            }
            await updateProfitLoss(
              gameName,
              groupId,
              profit,
              loss,
              moment().format( "DD-MM-YYYY" )
            );
          } else {
            let potentialWinner = ticTacToe.updatedPlayers.find(players => players.sign === winner);
            console.log( "====calculate profit and loss if game is not tie=====" );
            const potentialWinnerPrizeDecimal = new Decimal( entryFee ).times( 1.5 );
            potentialWinner.prize = potentialWinnerPrizeDecimal.toNumber();
            let runner = updatedPlayers.find(
              ( player ) => player.UserId !== potentialWinner.UserId
            );
            runner.prize = entryFee * 0;
            potentialWinner.turn = false;
            runner.turn = false;
            await userModel.findOneAndUpdate(
              { UserId: potentialWinner.UserId, "history.tableId": tableId },
              {
                $inc: {
                  realMoney: potentialWinnerPrizeDecimal.toNumber(),
                  airHockeyWinAmount: potentialWinnerPrizeDecimal.toNumber(),
                  "ticTacToeData.0.winCount": 1,
                },
                $set: {
                  "history.$.result": "win",
                  "history.$.win": potentialWinnerPrizeDecimal.toNumber(),
                },
                $push: {
                  transactionHistory: {
                    date: new Date(),
                    amount: potentialWinnerPrizeDecimal.toNumber(),
                    type: "winnings",
                    gameType: gameName,
                  },
                },
              },
              { new: true }
            );
    
            await userModel.findOneAndUpdate(
              { UserId: runner.UserId, "history.tableId": tableId },
              {
                $set: { "history.$.result": "lose" },
              },
              { new: true }
            );
    
            if ( playerCount === 2 || potentialWinner.isBot ) {
              if ( potentialWinner.isBot ) {
                profit = entryFee;
                console.log( profit, "======if game is not tie and winner is bot" );
              }
              if ( playerCount === 2 ) {
                const totalEntryFee = entryFee * 2;
                profit = totalEntryFee - potentialWinnerPrizeDecimal.toNumber();
                console.log( profit, "======if game is not tie and player is 2" );
              }
    
              await updateProfitLoss(
                gameName,
                groupId,
                profit,
                loss,
                moment().format( "DD-MM-YYYY" )
              );
            } else {
              const totalEntryFee = entryFee * 1;
              loss = potentialWinnerPrizeDecimal.toNumber() - totalEntryFee;
    
              await updateProfitLoss(
                gameName,
                groupId,
                profit,
                loss,
                moment().format( "DD-MM-YYYY" )
              );
            }
          }
    
          let overGame = await ticTacToeGroupModel.findOneAndUpdate(
            {
              _id: groupId,
              // "updatedPlayers.UserId": {
              //   $in: updatedPlayers.map( ( player ) => player.UserId ),
              // },
            },
            {
              $set: {
                updatedPlayers,
                isGameOver: true,
                isGameStart: 2,
              },
            },
            { new: true }
          );
    
          if ( !overGame ) {
            console.log( { status: false, error: "Game not found" } );
          }
           return overGame ;

    }catch (error) {
            console.error("Error setting up timeout:", error);
        }
}

async function changeTurn ( ticTacToe, gameName ) {
    try {
      console.log( "gameName in change turn =====>", gameName );
  

      const updatedPlayers = ticTacToe.updatedPlayers;
      const currentUserIndex = updatedPlayers.findIndex(
        ( player ) => player.UserId === ticTacToe.currentUserId
      );
      const isBotTurn = updatedPlayers[currentUserIndex].isBot;
      if(isBotTurn){
        let botPlayer = updatedPlayers[currentUserIndex].UserId;
        await updateBotPosition( botPlayer, ticTacToe, ticTacToeGroupModel, gameName );
      }else{
  
      const nextUserIndex = ( currentUserIndex + 1 ) % updatedPlayers.length;
      const nextUserId = updatedPlayers[nextUserIndex].UserId;
      ticTacToe.currentUserId = nextUserId;
      //  ticTacToe.lastHitTime = new Date();
    //   ticTacToe.updatedPlayers[currentUserIndex].dicePoints = 0;
    //   ticTacToe.updatedPlayers[nextUserIndex].dicePoints = 0;
      ticTacToe.updatedPlayers[nextUserIndex].turn = true;
      ticTacToe.updatedPlayers[currentUserIndex].turn = false;
      ticTacToe.nextTurnTime = new Date( Date.now() + 12 * 1000 );
      ticTacToe.lastHitTime = new Date();
      const checkBot = updatedPlayers[nextUserIndex].isBot;
      let botPlayer = updatedPlayers.find(
        ( player ) => player.isBot && player.UserId === nextUserId
      );
      if ( checkBot ) {
        console.log(
          "<====calling the funtion if the player's time is passed ====>"
        );
        await updateBotPosition( botPlayer.UserId, ticTacToe, ticTacToeGroupModel, gameName );
      } else {
        let updateTurn = await ticTacToeGroupModel.findByIdAndUpdate(
          { _id: ticTacToe._id },
          { $set: ticTacToe },
          { new: true }
        );
      }
    }
    } catch ( error ) {
      console.log( "Error in checkTurn function:", error );
    }
  }

  async function updateBotPosition(botPlayerId, gameData, gameName) {
    try {
      console.log("gameName in updateBotData======>", gameName);
      // let botPlayerId = botPlayer.UserId;
      let updatedPlayers = gameData.updatedPlayers;
      const currentUserIndex = gameData.updatedPlayers.findIndex(
        (player) => player.UserId === botPlayerId
      );
      const nextUserIndex = (currentUserIndex + 1) % 2;
      const botMoveCoordinates = botMove(gameData.board);
      gameData.board[botMoveCoordinates] = "o"; // Assign the bot's sign ('o') to the board
      // Switch turns
      gameData.updatedPlayers[currentUserIndex].turn = false;
      gameData.updatedPlayers[nextUserIndex].turn = true;
      // Update game data with next turn details
      gameData.nextTurnTime = new Date(Date.now() + 15 * 1000); // Set turn 15 sec for real user
      gameData.currentUserId = gameData.updatedPlayers[nextUserIndex].UserId;
      gameData.lastHitTime = new Date();
      // gameData.markModified('board') // Mark 'board' field as modified ncase of nested array or obj it unable to save the changes
      // Save the updated game gameData
      const updatedData = await gameData.save();
      /// Check for a winner or draw
      const winner = checkWinner(updatedData.board);
      if (winner ) {
        console.log("sign of winner=====>", winner);
        const overGame = await declareWinner(
          updatedData,
          gameName,
          false,
          winner
        );
        return overGame;
      } else if(gameDraw(updatedData.board)){ // match is draw
        const overGame = await declareWinner(updatedData, gameName, true, null);
        return overGame;
      } 
        return updatedData;
    
    } catch (error) {
      console.log(error);
    }
  };

module.exports ={
  botMove,
  checkWinner,
  createGroupForticTacToe,
  updateBotPosition,
  declareWinner,
  gameDraw
 }

 //____________________flatten array______________________
// const array = [
//   '', '', '',
//   '', '', '',
//   '', '', ''
// ]
//  const flatArray = array.join(', ');
//  console.log(flatArray);