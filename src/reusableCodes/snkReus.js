const mongoose = require( "mongoose" );
const userModel = require( "../model/userModel" );
const _ = require( "lodash" );
const fakeUsers = require( "../controller/dummyUsers" );
const { find } = require( "lodash" );
const snkTournamentModel = require( "../model/snkTournamentModel" );
const groupModelForSnakeLadder = require( "../model/groupModelForSnakeLadder" );
const airHockyTrnmtModel = require("../model/airHocTrnmtModel");
const airHockeyGroupModel = require("../model/airHocGrpModel");
delete require.cache[require.resolve( "../controller/rocketController" )];
const Decimal = require( "decimal.js" );
const moment = require( "moment" );
const cron = require( "node-cron" );
const { updateProfitLoss } = require( "../reusableCodes/profitAndLossReu" );
// const rktGroupModel = require("../controller/rocketController");
const rktGroupModel = require( "../model/rktGroupModel" );
const rocketTournamentModel = require( "../model/rocketTournamentModel" );
const {overTheGameAirHoc} = require ("../reusableCodes/airHocReus");
const { pushNotification } = require( "../controller/sendNotificationsController" );
const { log } = require( "winston" );
// delete require.cache[require.resolve("../reusableCodes/rocktReuCode")]
// const {checkTurnForRkt} = require("../reusableCodes/rocktReuCode");
//________________________________________________for snakeLadder________________________________________________

const createGroupForSnakeLadder = async function (tableId, gameName) {
  console.log(tableId, "============call group in", `${gameName}`);
  try {
    if (tableId != undefined) {
      let trnmtMode;
      let grpModel;
      if (gameName === "SnakeLadder") {
        trnmtMode = snkTournamentModel;
        grpModel = groupModelForSnakeLadder;
      } else if (gameName === "Rocket") {
        trnmtMode = rocketTournamentModel;
        grpModel = rktGroupModel;
      }else if (gameName === "AirHockey") {
        trnmtMode = airHockyTrnmtModel;
        grpModel = airHockeyGroupModel;
      }
      let table = await trnmtMode.findOne({ _id: tableId });

      if (table && table.Users.length !== 0) {
        console.log(tableId, "============create group in snk===>");

        let players = table.players;
        let users = table.Users;

        // Map users to required format
        users = users.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            token: user.token,
            isBot: user.isBot,
          };
        });

        // Calculate the number of bot players needed to complete groups
        let totalBot = players % 2;
        // if (players % 2 === 1) {
        //   totalBot = 1; // Add one bot if the total number of players is odd
        // }

        // Update tournament with totalBotInTable and totalPlayersInTable
        const updateTournament = await trnmtMode.findOneAndUpdate(
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
        const remainingPlayers = (players + totalBot) % 2; // Adjust for the bot player
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
          const createGrp = await grpModel.create({
            group: groupPlayers,
            tableId: tableId,
          });

          const grpId = createGrp._id;
          const group = createGrp.group;

          startMatchForSnkLdr(grpId, group, gameName,grpModel);
        }
      }
    }
  } catch (error) {
    console.error("Error in createGroupForSnakeLadder:", error);
  }
};

async function startMatchForSnkLdr ( grpId, group, gameName, grpModel ) {
  console.log( "grpid>>>>>>>>>>>", grpId );
  console.log( "gameName>>>>>>>>>>>>>>>>>", gameName );

  if ( grpId !== undefined ) {
    const result = group.map( ( name ) => ( {
      UserId: name.UserId,
      userName: name.userName,
      isBot: name.isBot,
      points: 0,
      turn: name.turn,
      dicePoints: 0,
      currentPoints: 0,
      prevPoint:0,
      movement: "",
    } ) );

    // let updateEndTime = 0;
    // if (gameName === "SnakeLadder" || gameName === "Rocket") {
    //   updateEndTime = 2 * 60 * 1000 + 15 * 1000; // 2 min 15 sec
    // }else if (gameName === "AirHockey") {
    //   updateEndTime = 100000; // 100 sec
    // }
    const Token = group.map( item => item.token ).filter( token => token !== undefined );
    // console.log( "Token===========>", Token );
    // pushNotification( Token, "Game will start soon!" );
    let totalBot = result.filter( ( players ) => players.isBot === true );
    totalBot = totalBot.length;
    let totalRealPlayres = result.filter( ( players ) => players.isBot === false );
    totalRealPlayres = totalRealPlayres.length;
    const matchData = await grpModel.findOneAndUpdate(
      { _id: grpId },
      {
        updatedPlayers: result,
        $set: {
          totalBotInGrp: totalBot,
          totalPlayerInGrp: totalRealPlayres,
          start: true,
          gameEndTime: Date.now() + 100000,
        },
      },
      { new: true, setDefaultsOnInsert: true }
    );

    console.log(
      new Date().getSeconds(),
      "----before 6 sec of starting the game---",
      matchData.isGameStart
    );

    await new Promise( async ( resolve ) => {
      let updatedPlayers = matchData.updatedPlayers;
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
      matchData.updatedPlayers[currentPlayerIndex].turn = true;
      matchData.lastHitTime = new Date();
      matchData.isGameStart = 1;
      matchData.currentUserId = updatedPlayers[currentPlayerIndex].UserId;
      matchData.nextTurnTime = new Date( Date.now() + 15 * 1000 );

      const updatedGroupFst = await matchData.save();
      console.log(
        new Date().getSeconds(),
        "--after 6 sec of starting the game--",
        updatedGroupFst.isGameStart
      );
      resolve(); // Resolve the promise to continue with the rest of the code
      if(gameName === "AirHockey") {
        console.log("<============ game name is AirHockey  ==========>");
        overTheGameAirHoc( grpId, gameName, Token);
      }else{
        overTheGameForPlayers( grpId, gameName, Token);
      }
    } );
  }
}
//_____________bot's point update_______________
async function updateBotPoints ( botPlayer, gameData, grpModel, gameName ) {
  try {
    console.log( "gameName in updateBotData======>", gameName );
    let botPlayerId = botPlayer.UserId;
    let updatedPlayers = gameData.updatedPlayers;
    const currentUserIndex = gameData.updatedPlayers.findIndex(
      ( player ) => player.UserId === botPlayerId
    );
    const nextUserIndex = ( currentUserIndex + 1 ) % updatedPlayers.length;
    // const nextUserId = gameData.updatedPlayers[nextUserIndex].UserId;
    const possibleValues = [1, 2, 3, 4, 5, 6];

    const randomIndex = Math.floor( Math.random() * possibleValues.length );
    const randomValue = possibleValues[randomIndex];
    const prevPoint = botPlayer.points ;
    // Calculate current position
    let currentPosition = prevPoint + randomValue;
    // Update position based on game rules
    if ( gameName === "SnakeLadder" ) {
      currentPosition = calculateSnakeLadderPosition( currentPosition );
    } else {
      currentPosition = calculateRocketPosition(
        currentPosition,
        prevPoint
      );
    }

    // Update player data
    updatedPlayers[currentUserIndex].points = currentPosition;
    updatedPlayers[currentUserIndex].dicePoints = randomValue;
    updatedPlayers[currentUserIndex].turn = false;
    updatedPlayers[currentUserIndex].prevPoint = prevPoint ;
    updatedPlayers[nextUserIndex].dicePoints = 0;
    updatedPlayers[nextUserIndex].turn = true
    // Update game data with next turn details
    gameData.nextTurnTime = new Date( Date.now() + 15 * 1000 ); // Set turn 15 sec for real user
    gameData.currentUserId = updatedPlayers[nextUserIndex].UserId;
    gameData.lastHitTime = new Date();

    // Save updated game data
    let updatedData = await grpModel.findOneAndUpdate(
      { _id: gameData._id },
      { $set: gameData },
      { new: true }
    );
    if ( !updatedData ) {
    }
    return updatedData;
  } catch ( error ) {
    console.log( error );
  }
}

function calculateSnakeLadderPosition ( currentPosition ) {
  // Check for snakes, ladders, and tunnels
  const snakeLadderAndTunnel = {
    2: 21,
    8: 29,
    14: 7,
    19: 38,
    25: 46,
    36: 3,
    41: 83,
    48: 12,
    49: 71,
    58: 22,
    72: 47,
    74: 93,
    95: 13,
    97: 78,
  };

  if ( currentPosition > 99 ) {
    currentPosition = 99;
  }

  if ( currentPosition in snakeLadderAndTunnel ) {
    return snakeLadderAndTunnel[currentPosition];
  } else {
    return currentPosition;
  }
}

function calculateRocketPosition ( currentPosition, prevPoint ) {
  // Ensure that the current position does not exceed 20
  return currentPosition > 19 ? prevPoint : currentPosition;
}

async function checkTurn ( groupId, gameName) {
  if ( !groupId ) return false; // Check if groupId is defined
  // console.log( "time in checkTurn ====>", new Date().getSeconds());
  try {
    let trnmtMode;
    let grpModel;
    if ( gameName === "SnakeLadder" ) {
      trnmtMode = snkTournamentModel;
      grpModel = groupModelForSnakeLadder;
    } else {
      trnmtMode = rocketTournamentModel;
      grpModel = rktGroupModel;
    }

    const snakeLadder = await grpModel.findById( groupId );

    if ( !snakeLadder ) return false; // Check if group exists
    if ( snakeLadder.isGameOver === true ) {
      console.log( "Game is over !====" , snakeLadder.isGameOver);
      return true; // Stop the calling
    }
    // console.log("updatedPlayers==========>",typeof(snakeLadder.updatedPlayers[0].points));
    const { tableId, updatedPlayers, gameEndTime, lastHitTime, nextTurnTime } =
      snakeLadder;
      const currentDate = new Date();
        const timeDiff = gameEndTime - currentDate;
        console.log("timeDiff for ending the game in checkTurn ===>",timeDiff);
    if (
      timeDiff <= 0 ||
      ( gameName === "SnakeLadder" &&
        updatedPlayers.some( ( player ) => player.points >= 99 ) ) ||
      ( gameName === "Rocket" &&
        updatedPlayers.some( ( player ) => player.points >= 19 ) )
    ) {
      console.log("<===========game end time is over ==============");
      const overGame = winnerDeclaredForGame(snakeLadder, trnmtMode, grpModel, gameName);
      if ( overGame.isGameOver === true ) {
        console.log( "Reached minimum point!" , overGame.isGameOver);
        return true; // Stop the calling
      }
      
    }

    const botPlayer = updatedPlayers.find(
      ( player ) => player.isBot && player.turn
    );
    if ( botPlayer ) {
      // Bot player logic
      // console.log("gameName in botPlayer=======>",gameName);
      // console.log("grpModel in botPlayer====>",grpModel);
      await updateBotPoints( botPlayer, snakeLadder, grpModel, gameName );
    }

    const timeSinceLastHit =
      Math.abs( lastHitTime.getTime() - new Date().getTime() ) / 1000;
    const timeSinceNextTurnTime =
      ( nextTurnTime.getTime() - currentDate.getTime() ) / 1000;

    if ( timeSinceNextTurnTime <= 0) {
      // Change turn logic
      await changeTurn( snakeLadder, gameName );
    }
  } catch ( error ) {
    console.log( "Error in checkTurn function:", error );
  }
  return false;
}

async function changeTurn ( snakeLadder, gameName ) {
  try {
    console.log( "gameName in change turn =====>", gameName );
    console.log("time for changing turn ====>", ( snakeLadder.lastHitTime.getTime() - new Date().getTime() ) / 1000);
    let grpModel;
    if ( gameName === "SnakeLadder" ) {
      grpModel = groupModelForSnakeLadder;
    } else {
      grpModel = rktGroupModel;
    }
    const updatedPlayers = snakeLadder.updatedPlayers;
    const currentUserIndex = updatedPlayers.findIndex(
      ( player ) => player.UserId === snakeLadder.currentUserId
    );
    const isBotTurn = updatedPlayers[currentUserIndex].isBot;
    if(isBotTurn){
      let botPlayer = updatedPlayers[currentUserIndex] ;
      await updateBotPoints( botPlayer, snakeLadder, grpModel, gameName );
    }else{

    const nextUserIndex = ( currentUserIndex + 1 ) % updatedPlayers.length;
    const nextUserId = updatedPlayers[nextUserIndex].UserId;
    snakeLadder.currentUserId = nextUserId;
    //  snakeLadder.lastHitTime = new Date();
    snakeLadder.updatedPlayers[currentUserIndex].dicePoints = 0;
    snakeLadder.updatedPlayers[nextUserIndex].dicePoints = 0;
    snakeLadder.updatedPlayers[nextUserIndex].turn = true;
    snakeLadder.updatedPlayers[currentUserIndex].turn = false;
    snakeLadder.nextTurnTime = new Date( Date.now() + 12 * 1000 );
    snakeLadder.lastHitTime = new Date();
    const checkBot = updatedPlayers[nextUserIndex].isBot;
    let botPlayer = updatedPlayers.find(
      ( player ) => player.isBot && player.UserId === nextUserId
    );
    if ( checkBot ) {
      console.log(
        "<====calling the funtion if the player's time is passed ====>"
      );
      await updateBotPoints( botPlayer, snakeLadder, grpModel, gameName );
    } else {
      let updateTurn = await grpModel.findByIdAndUpdate(
        { _id: snakeLadder._id },
        { $set: snakeLadder },
        { new: true }
      );
    }
  }
  } catch ( error ) {
    console.log( "Error in checkTurn function:", error );
  }
}

async function overTheGameForPlayers(groupId, gameName, Token) {
  console.log("game name in overthegame ====>", gameName);
  pushNotification(Token, "Game has started");

  const MAX_DURATION_SECONDS = 150; // 2 min 
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
                  const isMaxCountReached = await checkTurn(groupId, gameName);
                  if (!isMaxCountReached) {
                      // If max count not reached, set the timeout for next iteration
                      timeoutId = setTimeout(checkAndSetTimeout, 2000); // 2 seconds
                  } else {
                      console.log("Max count reached. Stopping timeout.");
                      clearTimeout(timeoutId); // Stop the timeout
                  }
              } catch (error) {
                  console.error("Error in timeout execution:", error);
              }
          };

          // Start the initial call to the timeout function
          timeoutId = setTimeout(checkAndSetTimeout, 2000); // 2 seconds
      } catch (error) {
          console.error("Error setting up timeout:", error);
      }
  }
}

async function winnerDeclaredForGame(gameDatas, trnmtMode, grpModel, gameName){
  try{
    let tableId = gameDatas.tableId ;
    let groupId = gameDatas._id ;
    let updatedPlayers = gameDatas.updatedPlayers ;
    let overTheGame = await trnmtMode.findByIdAndUpdate(
      { _id: tableId },
      { isMatchOverForTable: true },
      { new: true }
    );
    let profit = 0;
    let loss = 0;
    let entryFee = overTheGame.entryFee;
    let playerCountForSnk = updatedPlayers.filter(
      ( player ) => !player.isBot
    ).length;

    let potentialWinner = updatedPlayers.reduce(
      ( prevPlayer, currentPlayer ) => {
        return prevPlayer.points > currentPlayer.points
          ? prevPlayer
          : currentPlayer;
      }
    );

    let isTie = updatedPlayers.every(
      ( player ) => player.points === potentialWinner.points
    );

    if ( isTie ) {
      console.log( "=======calculate profit or loss if game is tie====" );
      const prizeDecimal = new Decimal( entryFee ).times( 0.5 );
      for ( const player of updatedPlayers ) {
        player.prize = prizeDecimal.toNumber();
        player.turn = false;
        // player.dicePoints = 0;
        console.log( "===========>", {
          [gameName === "SnakeLadder"
            ? "snkLadderWinAmount"
            : "rocketWinAmount"]: player.prize,
        } );
        if ( !player.isBot ) {
          await userModel.findOneAndUpdate(
            { UserId: player.UserId, "history.tableId": tableId },
            {
              $inc: {
                realMoney: player.prize,
                [gameName === "SnakeLadder"
                  ? "snkLadderWinAmount"
                  : "rocketWinAmount"]: player.prize,
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
        if ( playerCountForSnk === 2 ) {
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
      }
    } else {
      console.log( "====calculate profit and loss if game is not tie=====" );
      const potentialWinnerPrizeDecimal = new Decimal( entryFee ).times( 1.5 );
      potentialWinner.prize = potentialWinnerPrizeDecimal.toNumber();
      let runner = updatedPlayers.find(
        ( player ) => player.UserId !== potentialWinner.UserId
      );
      runner.prize = entryFee * 0;

      potentialWinner.turn = false;
      // potentialWinner.dicePoints = 0;
      runner.turn = false;
      // runner.dicePoints = 0;

      await userModel.findOneAndUpdate(
        { UserId: potentialWinner.UserId, "history.tableId": tableId },
        {
          $inc: {
            realMoney: potentialWinnerPrizeDecimal.toNumber(),
            [gameName === "SnakeLadder"
              ? "snkLadderWinAmount"
              : "rocketWinAmount"]: potentialWinnerPrizeDecimal.toNumber(),
            [gameName === "SnakeLadder"
              ? "snkLadderData.0.winCount"
              : "rocketData.0.winCount"]: 1,
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

      if ( playerCountForSnk === 2 || potentialWinner.isBot ) {
        if ( potentialWinner.isBot ) {
          profit = entryFee;
          console.log( profit, "======if game is not tie and winner is bot" );
        }
        if ( playerCountForSnk === 2 ) {
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

    let overGame = await grpModel.findOneAndUpdate(
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
module.exports = {
  createGroupForSnakeLadder,
  updateBotPoints,
  changeTurn,
  overTheGameForPlayers,
  checkTurn,
  winnerDeclaredForGame
};
