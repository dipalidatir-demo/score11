
const mongoose = require( "mongoose" );
const userModel = require( "../model/userModel" );
const _ = require( "lodash" );
const fakeUsers = require( "../controller/dummyUsers" );
const { find } = require( "lodash" );
const airHockyTrnmtModel = require("../model/airHocTrnmtModel");
const airHockeyGroupModel = require("../model/airHocGrpModel");
delete require.cache[require.resolve( "../controller/rocketController" )];
const Decimal = require( "decimal.js" );
const moment = require( "moment" );
const { updateProfitLoss } = require( "../reusableCodes/profitAndLossReu" );
const { pushNotification } = require( "../controller/sendNotificationsController" );
const { log } = require( "winston" );

async function checkPoint ( groupId, gameName) {
    if ( !groupId ) return false; // Check if groupId is defined
    console.log( "time in checkTurn ====>", new Date().getSeconds());
    try {
      const airHockey = await airHockeyGroupModel.findById( groupId );
  
      if ( !airHockey ) return false; // Check if group exists
      // console.log("==========>",airHockey);
      const { tableId, updatedPlayers, gameEndTime, lastHitTime } =
        airHockey;
        const currentDate = new Date();
          const timeDiff = gameEndTime - currentDate;
          //_____________________declare winner_____________________________
      if (
        timeDiff <= 0 ||
          updatedPlayers.some( ( player ) => player.points === 3 ) 
      ) {
       const overGame = await declareWinner(airHockey,gameName);
       if ( overGame.isGameOver === true ) {
        console.log( "Reached minimum point!" );
        return true; // Stop the calling
      }
       
      }

      const timeSinceNextTurnTime =
        ( currentDate.getTime() - lastHitTime.getTime() ) / 1000;
  
        const isBot = updatedPlayers.find(player => player.isBot);
      if ( timeSinceNextTurnTime >= 15 && isBot) {
        // console.log("<======update for bot====>",isBot.UserId);
        const updateBotPoint = await updatePointForBot( airHockey, gameName, isBot.UserId );
        // console.log("updateBotPointafter updation====>",updateBotPoint);
      }
    } catch ( error ) {
      console.log( "Error in checkTurn function:", error );
    }
    return false;
  }
async function overTheGameAirHoc(groupId, gameName, Token) {
    console.log("game name in airHockey ====>", gameName);
    pushNotification(Token, "Game has started");
  
    const MAX_DURATION_SECONDS = 140; // 140 sec
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
                    const isMaxCountReached = await checkPoint(groupId, gameName);
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

  async function updatePointForBot(airHockey, gameName, UserId ){
    console.log("UserId in botPoint UpDATION====",UserId);
    try{

        const updatedGroup = await airHockeyGroupModel.findOneAndUpdate(
            {
              _id: airHockey._id,
              isGameOver: false,
              "updatedPlayers": {
                $elemMatch: {
                  UserId: UserId
                }
              }
            },
            {
              $inc: { "updatedPlayers.$.points": 1}
            },
            { new: true }
          );
           return updatedGroup
    }catch (error) {
            console.error("Error setting up timeout:", error);
        }
  };
async function declareWinner(airHockey,gameName){
    try{
      let tableId = airHockey.tableId ;
      let groupId = airHockey._id ;
        let overTheGame = await airHockyTrnmtModel.findByIdAndUpdate(
            { _id: tableId },
            { isMatchOverForTable: true },
            { new: true }
          );
          
          let updatedPlayers = airHockey.updatedPlayers ;
          let profit = 0;
          let loss = 0;
          let entryFee = overTheGame.entryFee;
          let playerCount = updatedPlayers.filter(
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
              console.log( "===========>", {
                  airHockeyWinAmount: player.prize,
              } );
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
            }
          } else {
            console.log( "====calculate profit and loss if game is not tie=====" );
            const potentialWinnerPrizeDecimal = new Decimal( entryFee ).times( 1.5 );
            potentialWinner.prize = potentialWinnerPrizeDecimal.toNumber();
            let runner = updatedPlayers.find(
              ( player ) => player.UserId !== potentialWinner.UserId
            );
            runner.prize = entryFee * 0;
    
            await userModel.findOneAndUpdate(
              { UserId: potentialWinner.UserId, "history.tableId": tableId },
              {
                $inc: {
                  realMoney: potentialWinnerPrizeDecimal.toNumber(),
                  airHockeyWinAmount: potentialWinnerPrizeDecimal.toNumber(),
                  "airHockeyData.0.winCount": 1,
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
    
          let overGame = await airHockeyGroupModel.findOneAndUpdate(
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
           return overGame ;

    }catch (error) {
            console.error("Error setting up timeout:", error);
        }
}
  module.exports = { overTheGameAirHoc,declareWinner};