const mongoose = require( "mongoose" );
const userModel = require( "../model/userModel" );
const _ = require( "lodash" );
const fakeUsers = require( "../controller/dummyUsers" );
const { find } = require( "lodash" );
const snkTournamentModel = require( "../model/snkTournamentModel" );
const groupModelForSnakeLadder = require( "../model/groupModelForSnakeLadder" );
delete require.cache[require.resolve( "../controller/rocketController" )];
const Decimal = require( "decimal.js" );
const moment = require( "moment" );
const cron = require( "node-cron" );
const { updateProfitLoss } = require( "../reusableCodes/profitAndLossReu" );
// const rktGroupModel = require("../controller/rocketController");
const rktGroupModel = require( "../model/rktGroupModel" );
const rocketTournamentModel = require( "../model/rocketTournamentModel" );
const { pushNotification } = require( "../controller/sendNotificationsController" );
// delete require.cache[require.resolve("../reusableCodes/rocktReuCode")]
// const {checkTurnForRkt} = require("../reusableCodes/rocktReuCode");
//________________________________________________for snakeLadder________________________________________________

const createGroupForSnakeLadder = async function ( tableId, gameName ) {
  console.log( tableId, "============call group in", `${gameName}` );
  try {
    if ( tableId != undefined ) {
      let trnmtMode;
      let grpModel;
      if ( gameName === "SnakeLadder" ) {
        trnmtMode = snkTournamentModel;
        grpModel = groupModelForSnakeLadder;
      } else if ( gameName === "Rocket" ) {
        trnmtMode = rocketTournamentModel;
        grpModel = rktGroupModel;
      }
      let table = await trnmtMode.findOne( { _id: tableId } );

      if ( table && table.Users.length !== 0 ) {
        console.log( tableId, "============create group in snk===>" );

        let players = table.players;
        let users = table.Users;

        // if (users.length !== 0) {
        // Map users to required format
        users = users.map( ( user ) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            token: user.token,
            isBot: user.isBot,
          };
        } );

        const requiredBot = players % 2;
        let totalBot;
        if ( requiredBot === 1 ) {
          totalBot = 1;
        } else {
          totalBot = 0;
        }

        // Update tournament with totalBotInTable and totalPlayersInTable
        const updateTournament = await trnmtMode.findOneAndUpdate(
          { _id: tableId },
          { $set: { totalBotInTable: totalBot, totalPlayersInTable: players } },
          { new: true }
        );

        // Import dummy users
        let dummyUsers = fakeUsers.fakeUsers;
        dummyUsers = dummyUsers.map( ( user ) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        } );

        // Calculate the number of dummy users needed to complete groups
        const remainingPlayers = 2 - ( users.length % 2 );
        const completePlayers = [
          ...users,
          ...dummyUsers.slice( 0, remainingPlayers ),
        ];

        const completeGroups = _.chunk( completePlayers, 2 );

        for ( let i = 0; i < completeGroups.length; i++ ) {
          console.log();
          // Check if a group with the same tableId already exists
          // const existingGroup = await grpModel.findOne({ tableId });

          // If no group exists, create a new one
          // if (!existingGroup) {
          const createGrp = await grpModel.create( {
            group: completeGroups[i],
            tableId: tableId,
          } );

          const grpId = createGrp._id;
          const group = createGrp.group;

          console.log( createGrp );
          startMatchForSnkLdr( grpId, group, gameName );
          // }
        }
        // }
      }
    }
  } catch ( error ) {
    console.error( "Error in createGroupForSnakeLadder:", error );
  }
};

async function startMatchForSnkLdr ( grpId, group, gameName ) {
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
      movement: "",
    } ) );
    // console.log("result", result);
    let trnmtMode;
    let grpModel;
    if ( gameName === "SnakeLadder" ) {
      trnmtMode = snkTournamentModel;
      grpModel = groupModelForSnakeLadder;
    } else {
      trnmtMode = rocketTournamentModel;
      grpModel = rktGroupModel;
    }
    // console.log("result", result);
    const Token = group.map( item => item.token ).filter( token => token !== undefined );
    console.log( "Token===========>", Token );
    pushNotification( Token, "Game will start soon!" );
    let totalBot = result.filter( ( players ) => players.isBot === true );
    totalBot = totalBot.length;
    let totalRealPlayres = result.filter( ( players ) => players.isBot === false );
    totalRealPlayres = totalRealPlayres.length;
    const twoMinutesFifteenSeconds = 2 * 60 * 1000 + 15 * 1000;
    const matchData = await grpModel.findOneAndUpdate(
      { _id: grpId },
      {
        updatedPlayers: result,
        $set: {
          totalBotInGrp: totalBot,
          totalPlayerInGrp: totalRealPlayres,
          start: true,
          gameEndTime: Date.now() + twoMinutesFifteenSeconds,
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
      overTheGameForPlayers( grpId, gameName, Token);
    } );
  }
}
//_____________bot's point update_______________
async function updateBotPoints ( botPlayer, gameData, grpModel, gameName ) {
  try {
    console.log( "gameName in updateBotData======>", gameName );
    // let grpModel;
    // if (gameName === "SnakeLadder") {
    //     grpModel = groupModelForSnakeLadder;
    // } else {
    //     grpModel = rktGroupModel;
    // }
    let botPlayerId = botPlayer.UserId;
    let updatedPlayers = gameData.updatedPlayers;
    const currentUserIndex = gameData.updatedPlayers.findIndex(
      ( player ) => player.UserId === botPlayerId
    );
    const nextUserIndex = ( currentUserIndex + 1 ) % updatedPlayers.length;
    const nextUserId = gameData.updatedPlayers[nextUserIndex].UserId;
    const possibleValues = [1, 2, 3, 4, 5, 6];

    const randomIndex = Math.floor( Math.random() * possibleValues.length );
    const randomValue = possibleValues[randomIndex];

    // Calculate current position
    let currentPosition = botPlayer.points + randomValue;

    // Update position based on game rules
    if ( gameName === "SnakeLadder" ) {
      currentPosition = calculateSnakeLadderPosition( currentPosition );
    } else {
      currentPosition = calculateRocketPosition(
        currentPosition,
        updatedPlayers[currentUserIndex].points
      );
    }

    // Update player data
    updatedPlayers[currentUserIndex].points = currentPosition;
    updatedPlayers[currentUserIndex].dicePoints = randomValue;
    updatedPlayers[nextUserIndex].dicePoints = 0;
    updatedPlayers[currentUserIndex].turn = false;

    // Update game data with next turn details
    gameData.nextTurnTime = new Date( Date.now() + 16 * 1000 ); // Set turn 16 sec for real user
    gameData.currentUserId = nextUserId;
    gameData.updatedPlayers[nextUserIndex].turn = true;
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

function calculateRocketPosition ( currentPosition, botPlayerPosition ) {
  // Ensure that the current position does not exceed 20
  return currentPosition > 20 ? botPlayerPosition : currentPosition;
}

async function checkTurn ( groupId, gameName ) {
  if ( !groupId ) return false; // Check if groupId is defined
  console.log( "gamename in checkTurn ====>", gameName );
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
    // console.log("==========>",snakeLadder);
    const { tableId, updatedPlayers, gameEndTime, lastHitTime, nextTurnTime } =
      snakeLadder;
      const currentDate = new Date();
        const timeDiff = gameEndTime - currentDate;
    if (
      timeDiff <= 0 ||
      ( gameName === "SnakeLadder" &&
        updatedPlayers.some( ( player ) => player.points === 99 ) ) ||
      ( gameName !== "SnakeLadder" &&
        updatedPlayers.find( ( player ) => player.points === 20 ) )
    ) {
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
          player.dicePoints = 0;
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
        potentialWinner.dicePoints = 0;
        runner.turn = false;
        runner.dicePoints = 0;

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
          "updatedPlayers.UserId": {
            $in: updatedPlayers.map( ( player ) => player.UserId ),
          },
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
      if ( overGame.isGameOver === true ) {
        console.log( "Reached minimum point!" );
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
      Math.abs( lastHitTime.getTime() - currentDate.getTime() ) / 1000;
    const timeSinceNextTurnTime =
      ( nextTurnTime.getTime() - currentDate.getTime() ) / 1000;

    if ( timeSinceLastHit >= 15 && timeSinceNextTurnTime <= 0 ) {
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
    console.log( "gameName=====>", gameName );

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
        "<====calling the funtion if the player is time is passed ====>"
      );
      await updateBotPoints( botPlayer, snakeLadder, grpModel, gameName );
    } else {
      let updateTurn = await grpModel.findByIdAndUpdate(
        { _id: snakeLadder._id },
        { $set: snakeLadder },
        { new: true }
      );
    }
  } catch ( error ) {
    console.log( "Error in checkTurn function:", error );
  }
}

async function overTheGameForPlayers ( groupId, gameName, Token ) {
  console.log( "game name in overthegame ====>", gameName );
      pushNotification(Token,"Game has started");
  const MAX_DURATION_SECONDS = 180; // 3 minutes
  const INTERVAL_MILLISECONDS = 15000; // 15 seconds
  let startTime = Date.now();
  let intervalId; // Store the interval ID
  if ( groupId !== undefined ) {
    try {
      intervalId = setInterval( async () => {
        const elapsedTimeSeconds = ( Date.now() - startTime ) / 1000;
        if ( elapsedTimeSeconds >= MAX_DURATION_SECONDS ) {
          console.log( "Max duration reached. Stopping interval." );
          clearInterval( intervalId ); // Stop the interval
          return;
        }

        try {
          const isMaxCountReached = await checkTurn( groupId, gameName );
          if ( isMaxCountReached ) {
            console.log( "Max count reached. Stopping interval." );
            clearInterval( intervalId ); // Stop the interval
          }
        } catch ( error ) {
          console.error( "Error in interval execution:", error );
        }
      }, INTERVAL_MILLISECONDS );
    } catch ( error ) {
      console.error( "Error setting up interval:", error );
    }
  }
}

module.exports = {
  createGroupForSnakeLadder,
  updateBotPoints,
  changeTurn,
  overTheGameForPlayers,
};
