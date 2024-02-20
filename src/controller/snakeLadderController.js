const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const snkTournamentModel = require("../model/snkTournamentModel");
const groupModelForSnakeLadder = require("../model/groupModelForSnakeLadder");
const snakeLadderModel = require("../model/snakeLadderModel");
const Decimal = require("decimal.js");
const {
  startMatch,
  createGroupForSnakeLadder,
} = require("../reusableCodes/reusablecode");
const { log } = require("console");
const { promises } = require("dns");
const { resolve } = require("path");
const totalBotForSnk = 0;
let currentDate = new Date();
const moment = require("moment");
const cron = require("node-cron");

//____________________________________create snakeladder tournaments by admin___________

// const snkTablesCreatedByAdmin = async function (req, res) {
//   try {
//     let {
//       entryFee,
//       prizeAmount,
//       players,
//       status,
//       maxTime,
//       endTime,
//       maxPlayers,
//       rank,
//       rank1,
//       rank2,
//       rank3,
//       rank4,
//       tableByAdmin,
//     } = req.body;
//     maxTime = parseInt(maxTime);
//     endTime = Date.now() + maxTime * 60 * 1000;
//     entryFee = parseInt(entryFee);
//     maxPlayers = parseInt(maxPlayers);
//     req.body.endTime = endTime;
//     req.body.tableByAdmin = true;
//     req.body.maxPlayers = maxPlayers;
//     req.body.entryFee = entryFee;
//     let tableByAdmin1I = await snkTournamentModel.create(req.body);
//     let tableId1 = tableByAdmin1I._id;
//     console.log(tableByAdmin1I, "==========table for snk");
//     setTimeout(function () {
//       createGroupForSnakeLadder(tableId1);
//       console.log(tableByAdmin1I, "==========table for snk after setTimeOut");
//     }, maxTime + 60 * 1000);

//     return res.status(201).send({
//       status: true,
//       message: "Success",
//       data: tableByAdmin1I,
//     });
//   } catch (error) {
//     return res.status(500).send({
//       status: false,
//       message: error.message,
//     });
//   }
// };

//---------------------using node crone---------------------------------
const snkTablesCreatedByAdmin = async function (req, res) {
  try {
    let {
      entryFee,
      prizeAmount,
      players,
      status,
      maxTime,
      maxPlayers,
      endTime,
      tableByAdmin,
      date,
      time,
    } = req.body;

    console.log(req.body, "============body data");

    entryFee = parseInt(entryFee);
    maxPlayers = parseInt(maxPlayers);
    maxTime = parseInt(maxTime);
    endTime = Date.now() + maxTime * 60 * 1000;
    req.body.endTime = endTime;

    // Use moment for flexible date and time parsing
    const tournamentStartTime = moment(
      `${date} ${time}`,
      "YYYY-MM-DD HH:mm"
    ).toDate();

    // Calculate the delay in milliseconds until the tournament starts
    const delay = tournamentStartTime - Date.now();
    console.log(tournamentStartTime, "========tournamentStartTime====", delay);

    if (delay < 0) {
      console.log("error in delay====");
      return res.status(400).send({
        status: false,
        message:
          "Invalid date and time. Please provide a future date and time.",
      });
    }

    // Schedule the tournament creation using node-cron
    cron.schedule(
      moment(tournamentStartTime).format("mm HH DD MM *"),
      async () => {
        try {
          // Update request body with user-provided values
          console.log(
            tournamentStartTime,
            "========tournamentStartTime====",
            delay
          );
          req.body.tableByAdmin = true;
          req.body.maxPlayers = maxPlayers;
          req.body.entryFee = entryFee;

          let tableByAdmin1 = await snkTournamentModel.create(req.body);
          let tableId1 = tableByAdmin1._id;

          console.log("Tournament created successfully!==", tableId1);
          if (tableId1) {
            // Schedule the createGroupByAdmin function after maxTime
            console.log("calling the setTimeout function");
            setTimeout(function () {
              console.log();
              createGroupForSnakeLadder(tableId1);
              console.log(
                tableByAdmin1,
                "==========table for snk after setTimeOut===",
                new Date().getMinutes()
              );
            }, maxTime + 60 * 1000);
          }
        } catch (error) {
          console.error("Error creating tournament:", error.message);
        }
      }
    );

    return res.status(201).send({
      status: true,
      message: "Tournament creation scheduled",
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

//_________________________________________________createSnakeLadder tournaments____________________________________

const createSnakeLadderTables = async function (req, res) {
  try {
    let data = req.query;
    let UserId = req.query.UserId;

    let data1 = {
      entryFee: 1,
      prizeAmount: 1 * 2, //___win amount will be entry fee multiply with 4 players(5-1 = 4)
      maxTime: 1,
    };

    let data2 = {
      entryFee: 10,
      prizeAmount: 10 * 2,
      maxTime: 4,
    };

    let data3 = {
      entryFee: 20,
      prizeAmount: 20 * 2,
      maxTime: 5,
    };

    let data4 = {
      entryFee: 50,
      prizeAmount: 50 * 2,
      maxTime: 10,
    };

    let data5 = {
      entryFee: 100,
      prizeAmount: 100 * 2,
      maxTime: 15,
    };

    let tournamentTable1;
    let tournamentTable2;
    let tournamentTable3;
    let tournamentTable4;
    let tournamentTable5;

    //_______________________create table1 with setinterval an end time___________
    let tableId1;
    async function createTournament1() {
      if (tableId1 != undefined) {
        createGroupForSnakeLadder(tableId1);
      }

      endTime = Date.now() + 1 * 60 * 1000;
      data1.endTime = req.query.endTime = endTime;

      tournamentTable1 = await snkTournamentModel.create(data1);
      tableId1 = tournamentTable1._id;
      console.log(tournamentTable1);
    }

    setInterval(createTournament1, 60000);

    createTournament1();

    //_______________________create table2 with setinterval an end time________________
    let tableId2;

    async function createTournament2() {
      if (tableId2 != undefined) {
        createGroupForSnakeLadder(tableId2);
      }

      endTime = Date.now() + 4 * 60 * 1000;
      data2.endTime = req.query.endTime = endTime;

      tournamentTable2 = await snkTournamentModel.create(data2);
      tableId2 = tournamentTable2._id;
      // console.log(tournamentTable2);
    }

    setInterval(createTournament2, 240000);
    createTournament2();

    //_______________________create table3 with setinterval an end time________________
    let tableId3;

    async function createTournament3() {
      if (tableId3 != undefined) {
        createGroupForSnakeLadder(tableId3);
      }

      let endTime = Date.now() + 5 * 60 * 1000;
      data3.endTime = req.query.endTime = endTime;
      tournamentTable3 = await snkTournamentModel.create(data3);
      tableId3 = tournamentTable3._id;
      // console.log(tournamentTable3);
    }
    setInterval(createTournament3, 300000);
    createTournament3();

    //  // _______________________create table4 with setinterval an end time________________
    let tableId4;

    async function createTournament4() {
      if (tableId4 != undefined) {
        createGroupForSnakeLadder(tableId4);
      }
      endTime = Date.now() + 10 * 60 * 1000;
      data4.endTime = req.query.endTime = endTime;
      tournamentTable4 = await snkTournamentModel.create(data4);
      tableId4 = tournamentTable4._id;
      // console.log(tournamentTable4);
    }
    setInterval(createTournament4, 600000);
    createTournament4();

    //_____________________________create table5 with setinterval an end time____
    let tableId5;

    async function createTournament5() {
      if (tableId5 != undefined) {
        createGroupForSnakeLadder(tableId5);
      }
      endTime = Date.now() + 15 * 60 * 1000;
      data5.endTime = req.query.endTime = endTime;
      tournamentTable5 = await snkTournamentModel.create(data5);
      tableId5 = tournamentTable5._id;
      // console.log(tournamentTable5);
    }
    setInterval(createTournament5, 900000);
    createTournament5();

    return res.status(201).send({
      status: true,
      message: "Success",
      data: tournamentTable1,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//______________________________________________get all data of SnakeLadder tournaments______________________________

const getAllSnak = async function (req, res) {
  try {
    let UserId = req.query.UserId;
    let currentTime = new Date();

    //______________only fetch that table which timing is running

    const data = await snkTournamentModel
      .find({ endTime: { $gt: new Date() }, isMatchOverForTable: false })
      .select({
        display: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
        Users: 0,
        createdTime: 0,
      })
      .sort({ maxTime: 1 });

    //__________fetch dataas per user id (it shows user joined in this table now)

    let userData = await snkTournamentModel.aggregate([
      {
        $match: {
          isMatchOverForTable: false,
          Users: {
            $elemMatch: {
              UserId: UserId,
            },
          },
        },
      },
    ]);
    console.log(userData, "++++++++++++++++++++");
    if (userData.length > 0) {
      let tableId = userData.map((items) => items._id);
      console.log(tableId, "------------");
      let endTime = userData.map((items) => items.endTime);

      //______________________________check the match is started or not

      let gameStatus = [];

      for (let id = 0; id < tableId.length; id++) {
        let status = await groupModelForSnakeLadder.findOne({
          tableId: tableId[id],
        });
        if (status) {
          //check match is running or finshed.
          if (status.isGameOver === false) {
            gameStatus.push({
              tableId: status.tableId,
              start: status.start,
            });
          }
        } else {
          // push data if group is not created
          gameStatus.push({ tableId: tableId[id], start: false });
        }
      }
      if (gameStatus.length !== 0) {
        return res.status(200).send({
          status: true,
          message: "Success",
          matchStatus: gameStatus,
          endTime: endTime,
          joined: true,
          currentTime: currentTime,
          data: data,
        });
      }
    }
    return res.status(200).send({
      status: true,
      message: "Success",
      currentTime: currentTime,
      data: data,
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

//___________________________________________________update snakeLaddertournament_______________________________

const updateSnakLdrTournaments = async function (req, res) {
  try {
    let tableId = req.query.tableId;
    let UserId = req.query.UserId;
    let updateData = req.query;
    let { status } = updateData;
    const currentTime = new Date();
    console.log(req.query.UserId, "______________req.query.UserId");

    if (Object.keys(updateData).length == 0) {
      return res.status(200).send({
        status: false,
        message: "For updating please enter atleast one key",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res
        .status(200)
        .send({ status: false, message: "invalid tableId" });
    }

    let existTable = await snkTournamentModel.findById({ _id: tableId });
    if (!existTable) {
      return res.status(200).send({
        status: false,
        message: " This table is not present ",
      });
    }

    // if(currentDate != currentTime){
    //   const botCount = await botModel.find().count();
    //   totalBot = botCount ;
    // }

    let ExistPlayers = existTable.players;
    let entryFee = existTable.entryFee;
    let maxPlayers = existTable.maxPlayers;

    // let maxPlayers = 100;

    if (ExistPlayers < maxPlayers) {
      status = "in_progress";
    }
    if (ExistPlayers === maxPlayers - 1) {
      status = "full";
    }
    if (ExistPlayers > maxPlayers - 1) {
      return res.status(200).send({ status: false, message: " Full " });
    }

    if (existTable.playerWithBot === 0) {
      setTimeout(() => {
        existTable.playerWithBot = totalBotForSnk;
        existTable.save();
      }, 1 * 10 * 1000);
    }

    //________________________________find user,s Name _____________________________________

    let userExist = await userModel.findOne({
      UserId: UserId,
      isDeleted: false,
    });
    if (!userExist) {
      return res.status(200).send({
        status: false,
        message: " user not found",
      });
    }
    let { userName, isBot, credits, realMoney } = userExist;
    credits = credits + parseInt(realMoney);
    if (credits < entryFee) {
      return res.status(200).send({
        status: false,
        message: " insufficient balance to play",
      });
    }

    //_______update table with userId and tableId (if user joined perticular table players incereses by 1 automatically)

    let userData = await snkTournamentModel.aggregate([
      {
        $match: {
          isMatchOverForTable: false,
          Users: {
            $elemMatch: {
              UserId: UserId,
            },
          },
        },
      },
    ]);

    if (userData.length !== 0) {
      for (let i = 0; i < userData.length; i++) {
        let time = userData[i].endTime;
        console.log(time.getMinutes(), "time___________");
        console.log(
          existTable.endTime.getMinutes(),
          "time which he want to join___________"
        );
        if (Math.abs(time.getMinutes() - existTable.endTime.getMinutes()) < 5) {
          return res.status(200).send({
            status: false,
            message: " You can not join",
          });
        }
      }
    }
    //_________________deduct the entryFee from the users credit when user want to join the table

    const tableUpdate = await snkTournamentModel
      .findByIdAndUpdate(
        { _id: tableId },
        {
          $inc: { players: 1 },
          $push: {
            Users: {
              UserId: UserId,
              userName: userName,
              isBot: isBot,
              joined: true,
              endTime: existTable.endTime,
            },
          },
          $set: { status: status },
        },

        { new: true }
      )
      .select({ players: 1, _id: 0 });

    //_______store user's tournament history in user profile
    let userHistory;
    let time = existTable.createdAt;
    if (userExist.credits >= entryFee) {
      userHistory = await userModel.findOneAndUpdate(
        { UserId: UserId },
        {
          $push: {
            history: {
              gameType: "snakeLadder",
              tableId: tableId,
              time: time,
              result: "",
              win: 0,
            },
            transactionHistory: {
              date: new Date(),
              amount: entryFee,
              type: "Entry Fee",
              gameType: "snakeLadder",
            },
          },
          $inc: {
            credits: -entryFee,
            "snkLadderData.0.playCount": 1, // Increment playCount by 1
          },
        },
        { new: true }
      );
    } else {
      // Insufficient credits, deduct from realMoney
      const remainingAmount = entryFee - userExist.credits;
      userHistory = await userModel.findOneAndUpdate(
        { UserId: UserId },
        {
          $push: {
            history: {
              gameType: "snakeLadder",
              tableId: tableId,
              time: time,
              result: "",
              win: 0,
            },
            transactionHistory: {
              date: new Date(),
              amount: entryFee,
              type: "Entry Fee",
              gameType: "snakeLadder",
            },
          },
          $inc: {
            realMoney: -remainingAmount,
            "snkLadderData.0.playCount": 1, // Increment playCount by 1
          },
          $set: {
            credits: 0,
          },
        },
        { new: true }
      );
    }
    // console.log("users data after deduct the credit >>>>>>>>>>>>>",userHistory)
    return res.status(200).send({
      status: true,
      message: "Success",
      data: {
        tableUpdate,
        balance: userHistory.credits,
      },
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//__________________________________get groups per players and tableId ____________________________________________
const getGroupsByUser = async function (req, res) {
  try {
    let tableId = req.query.tableId;
    let UserId = req.query.UserId;

    if (Object.keys(req.query).length <= 1) {
      return res.status(200).send({
        status: false,
        message: " Please provide both tableId and UserId ",
      });
    }
    let userExist = await userModel.findOne({ UserId: UserId });

    if (userExist == null) {
      return res.status(200).send({
        status: false,
        message: " User not found ",
      });
    }
    let userName = userExist.userName;

    const table = await groupModelForSnakeLadder.find({ tableId: tableId });
    console.log("table>>>>>>>>>>>>>>", table);

    if (table.length === 0) {
      return res.status(200).send({
        status: false,
        message: " This table is not present ",
      });
    }
    let groups = table.map((items) => items.group);
    console.log(groups, "groups>>>>>>>>>>>");

    let user, groupId, users;
    for (let group = 0; group < groups.length; group++) {
      console.log(groups[group], "================================");

      let findUser = groups[group].find((user) => user.userName === userName);

      if (findUser != null) {
        user = findUser;
        groupId = table[group]._id;
        users = groups[group];
        break;
      }
    }

    if (!user) {
      return res.status(200).send({
        status: true,
        message: "this user is not present in any group",
      });
    }

    console.log(user, ">>>>>>>>>>>>>");
    users = users.map((items) => items.userName);
    let usersNameInStr = users.join(" ");

    return res.status(200).send({
      status: true,
      message: "Success",
      groupId,
      usersNameInStr,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//______________________________________get group by groupId_______________________________

// const getSnkByGroupId = async function (req, res) {
//   try {
//     let groupId = req.query.groupId;

//     if (!mongoose.Types.ObjectId.isValid(groupId)) {
//       return res
//         .status(200)
//         .send({ status: false, message: "invalid groupId" });
//     }
//     let snakeLadder = await groupModelForSnakeLadder.findById({ _id: groupId });

//     if (!snakeLadder) {
//       return res
//         .status(200)
//         .send({ status: false, message: "this groupId not found" });
//     }

//     let tableId = snakeLadder.tableId;
//     let createdTime = snakeLadder.createdTime;
//     const updatedPlayers = snakeLadder.updatedPlayers;
//     let timeDiff = snakeLadder.gameEndTime - new Date();
//     console.log(timeDiff, "endtime of a group==========");
//     let crntPlayer = updatedPlayers.find((players) => players.turn === true);
//     // const cnrtPlayer = updatedPlayers.find(
//     //   (players) => players.dicePoints !== 0
//     // );
//     const checkTable = await snkTournamentModel
//       .findById({ _id: tableId })
//       .lean();

//     if (!checkTable) {
//       return res.status(200).send({
//         status: false,
//         message: "this table is not present in DB",
//       });
//     }
//     if (snakeLadder.isGameStart === 0) {
//       let result = {
//         currentTurn: "wait for the turn",
//         currentTime: new Date(),
//         nextTurnTime: snakeLadder.nextTurnTime,
//         tableId: snakeLadder.tableId,
//         updatedPlayers: snakeLadder.updatedPlayers,
//         isGameOver: snakeLadder.isGameOver,
//         isGameStart: snakeLadder.isGameStart,
//         gameEndTime: snakeLadder.gameEndTime,
//       };
//       console.log("Wait for the turn");
//       return res.status(200).json(result);
//     }
//     //_________________________winner declare_____________

//     let reachTheDestination = updatedPlayers.find(
//       (players) => players.points === 99
//     );

//     if (timeDiff <= 0 || reachTheDestination) {
//       let overTheGame = await snkTournamentModel.findByIdAndUpdate(
//         { _id: tableId },
//         { isMatchOverForTable: true },
//         { new: true }
//       );
//       console.log(overTheGame, "overTheGame==============");
//       let entryFee = checkTable.entryFee;

//       // Find the player with the highest points (the potential winner)
//       let potentialWinner = updatedPlayers.reduce(
//         (prevPlayer, currentPlayer) => {
//           return prevPlayer.points > currentPlayer.points
//             ? prevPlayer
//             : currentPlayer;
//         }
//       );

//       // Check if there is a tie (both players have equal points)
//       let isTie = updatedPlayers.every(
//         (player) => player.points === potentialWinner.points
//       );

//       if (isTie) {
//         // Both players are winners with a prize of 0.5
//         // updatedPlayers.forEach((player) => {
//         //   player.prize = entryFee * 0.5;
//         //   player.turn = false;
//         //   player.dicePoints = 0;
//         // });
//         // Both players are winners with a prize of 0.5
//         const prizeDecimal = new Decimal(entryFee).times(0.5);
//         for (const player of updatedPlayers) {
//           player.prize = prizeDecimal.toNumber();
//           player.turn = false;
//           player.dicePoints = 0;
//          if(!player.isBot){
//           await userModel.findOneAndUpdate(
//             { UserId: player.UserId, "history.tableId":tableId },
//             { $inc: { realMoney: player.prize,
//                       snkLadderWinAmount:player.prize
//                     },
//                $set: { "history.$.result": "lose","history.$.win": player.prize } },
//             { new: true }
//           );
//         }
//       }
//       } else {
//         // Calculate the prize for the potential winner and the runner-up
//         // potentialWinner.prize = entryFee * 1.5;
//         const potentialWinnerPrizeDecimal = new Decimal(entryFee).times(1.5);
//          potentialWinner.prize = potentialWinnerPrizeDecimal.toNumber();
//         let runner = updatedPlayers.find(
//           (player) => player.UserId !== potentialWinner.UserId
//         );
//         runner.prize = entryFee * 0;

//         // Set the turn and dicePoints to 0 for both players
//         potentialWinner.turn = false;
//         potentialWinner.dicePoints = 0;
//         runner.turn = false;
//         runner.dicePoints = 0;
//         //_________________update the winner's realMoney_______________
//         await userModel.findOneAndUpdate(
//           { UserId: potentialWinner.UserId, "history.tableId":tableId },
//           {
//             $inc: { realMoney: potentialWinnerPrizeDecimal.toNumber(),
//                     snkLadderWinAmount:potentialWinnerPrizeDecimal.toNumber(),
//                    "snkLadderData.0.winCount": 1 },   // Increment playCount by 1,
//             $set: { "history.$.result": "win","history.$.win":potentialWinnerPrizeDecimal.toNumber() }
//           },
//           { new: true }
//         );

//         //_____________________update the runner's data ______________
//         await userModel.findOneAndUpdate(
//           { UserId: runner.UserId, "history.tableId":tableId },
//           {
//             $set: { "history.$.result": "lose" }
//           },
//           { new: true }
//         );
//       }

//       // Update the players array with the updated winner(s) and runner-up
//       let playersUpdate = updatedPlayers;

//       let overGame = await groupModelForSnakeLadder.findOneAndUpdate(
//         {
//           _id: groupId,
//           "updatedPlayers.UserId": {
//             $in: updatedPlayers.map((player) => player.UserId),
//           },
//         },
//         {
//           $set: {
//             updatedPlayers: playersUpdate,
//             isGameOver: true,
//             isGameStart: 2,
//           },
//         },
//         { new: true }
//       );

//       if (!overGame) {
//         return { status: false, error: "Game not found" };
//       }

//       // continue with the rest of the code here...

//       let result = {
//         currentTurn: "game is over",
//         currentTime: new Date(),
//         nextTurnTime: new Date(),
//         tableId: snakeLadder.tableId,
//         updatedPlayers: overGame.updatedPlayers,
//         isGameOver: overGame.isGameOver,
//         isGameStart: overGame.isGameStart,
//         gameEndTime: overGame.gameEndTime,
//       };
//       console.log(result.updatedPlayers, "when winner is declared");
//       return res.status(200).json(result);
//     }

//     //_________________update points for bot User________________________________

//     let botPlayer = updatedPlayers.find(
//       (player) => player.isBot && player.turn
//     );

//     if (botPlayer) {
//       let botPlayerId = botPlayer.UserId;
//       const currentUserIndex = updatedPlayers.findIndex(
//         (player) => player.UserId === botPlayerId
//       );
//       const nextUserIndex = (currentUserIndex + 1) % updatedPlayers.length;
//       const nextUserId = updatedPlayers[nextUserIndex].UserId;
//       const possibleValues = [1, 2, 3, 4, 5, 6];

//       const randomIndex = Math.floor(Math.random() * possibleValues.length);
//       const randomValue = possibleValues[randomIndex];

//       // Calculate current position
//       let currentPosition = botPlayer.points + randomValue;

//       // Check for snakes, ladders, and tunnels
//       const snakeLadderAndTunnel = {
//         4: 11, //--------------tunnel
//         6: 41, //--------------ladder
//         13: 7, //--------------snake
//         14: 47, //--------------ladder
//         22: 30, //--------------tunnel
//         24: 16, //--------------snake
//         25: 56, //--------------Ladder
//         32: 61, //--------------Ladder
//         36: 3, //--------------snake
//         37: 49, //--------------tunnel
//         45: 70, //--------------Ladder
//         53: 76, //--------------Laadder
//         60: 66, //--------------tunnel
//         72: 48, //--------------snake
//         79: 56, //--------------snake
//         87: 68, //--------------snake
//         95: 31, //--------------snake
//       };

//       if (currentPosition > 99) {
//         currentPosition = snakeLadder.updatedPlayers[currentUserIndex].points;
//       }

//       if (currentPosition in snakeLadderAndTunnel) {
//         // Update position based on snakes, ladders, and tunnels
//         snakeLadder.updatedPlayers[currentUserIndex].points =
//           snakeLadderAndTunnel[currentPosition];
//         snakeLadder.updatedPlayers[currentUserIndex].movement =
//           currentPosition === 6 ||
//           currentPosition === 14 ||
//           currentPosition === 25 ||
//           currentPosition === 32 ||
//           currentPosition === 45 ||
//           currentPosition === 53
//             ? "Ladder"
//             : currentPosition === 4 ||
//               currentPosition === 22 ||
//               currentPosition === 37 ||
//               currentPosition === 60
//             ? "Tunnel"
//             : "Snake";
//       } else {
//         snakeLadder.updatedPlayers[currentUserIndex].points = currentPosition;
//         snakeLadder.updatedPlayers[currentUserIndex].movement = "";
//       }

//       snakeLadder.updatedPlayers[currentUserIndex].dicePoints = randomValue;
//       snakeLadder.updatedPlayers[nextUserIndex].dicePoints = 0;
//       snakeLadder.updatedPlayers[currentUserIndex].currentPoints =
//         currentPosition;
//       snakeLadder.updatedPlayers[currentUserIndex].turn = false;
//       // snakeLadder.currentUserId = nextUserId;
//       // snakeLadder.updatedPlayers[nextUserIndex].turn = true;
//       // snakeLadder.nextTurnTime = new Date(Date.now() + 8 * 1000);
//       // snakeLadder.lastHitTime = new Date();
//       console.log(
//         snakeLadder.nextTurnTime.getSeconds(),
//         "sec befor db call============="
//       );
//       if (
//         currentPosition === 6 ||
//         currentPosition === 14 ||
//         currentPosition === 25 ||
//         currentPosition === 32 ||
//         currentPosition === 45 ||
//         currentPosition === 53
//       ) {
//         snakeLadder.nextTurnTime = new Date(Date.now() + 15 * 1000); // 8+7
//       } else {
//         snakeLadder.nextTurnTime = new Date(Date.now() + 12 * 1000); //8+4
//       }
//       let updatedData = await groupModelForSnakeLadder.findOneAndUpdate(
//         { _id: groupId },
//         {
//           $set: snakeLadder,
//         },
//         { new: true }
//       );
//       console.log(
//         updatedData.nextTurnTime.getSeconds(),
//         "sec after db call========"
//       );
//       const nextTurnHandler = () => {
//         snakeLadder.lastHitTime = new Date();
//         snakeLadder.currentUserId = nextUserId;
//         snakeLadder.updatedPlayers[nextUserIndex].turn = true;
//         snakeLadder.save();
//         console.log(
//           "after sertTimeout  in put >>>>>>>>>>",
//           new Date().getSeconds(),
//           "++++++++++++",
//           snakeLadder
//         );
//       };
//       let result = {
//         currentTurn: nextUserId,
//         currentTime: new Date(),
//         nextTurnTime: updatedData.nextTurnTime,
//         tableId: snakeLadder.tableId,
//         updatedPlayers: updatedData.updatedPlayers,
//         isGameOver: snakeLadder.isGameOver,
//         isGameStart: updatedData.isGameStart,
//         gameEndTime: snakeLadder.gameEndTime,
//       };

//       console.log(
//         updatedData.lastHitTime.getSeconds(),
//         "time of updatedData================="
//       );
//       if (
//         currentPosition === 6 ||
//         currentPosition === 14 ||
//         currentPosition === 25 ||
//         currentPosition === 32 ||
//         currentPosition === 45 ||
//         currentPosition === 53
//       ) {
//         setTimeout(nextTurnHandler, 7000);
//       } else {
//         setTimeout(nextTurnHandler, 4000);
//       }
//       return res.status(200).json(result);
//     }

//     //___________Check if it's time to switch turn to next user

//     const timeSinceLastHit =
//       Math.abs(snakeLadder.lastHitTime.getTime() - new Date().getTime()) / 1000;
//     if (timeSinceLastHit >= 8) {
//       //__________Switch turn to next user

//       const currentUserIndex = updatedPlayers.findIndex(
//         (player) => player.UserId === snakeLadder.currentUserId
//       );

//       const nextUserIndex = (currentUserIndex + 1) % updatedPlayers.length;
//       const nextUserId = updatedPlayers[nextUserIndex].UserId;
//       snakeLadder.currentUserId = nextUserId;
//       //  snakeLadder.lastHitTime = new Date();
//       snakeLadder.updatedPlayers[currentUserIndex].dicePoints = 0;
//       snakeLadder.updatedPlayers[nextUserIndex].dicePoints = 0;
//       snakeLadder.updatedPlayers[nextUserIndex].turn = true;
//       snakeLadder.updatedPlayers[currentUserIndex].turn = false;
//       snakeLadder.nextTurnTime = new Date(Date.now() + 8 * 1000);
//       snakeLadder.lastHitTime = new Date();

//       // snakeLadder.nextTurnTime = new Date(Date.now() + 1 * 1000);

//       //___________Save updated snakeLadder to database

//       let updateTurn = await groupModelForSnakeLadder.findByIdAndUpdate(
//         { _id: groupId },
//         { $set: snakeLadder },
//         { new: true }
//       );
//       //const remainingTime = ((updateTurn.nextTurnTime - Date.now()) / 1000).toFixed(3);
//       let result = {
//         message: "turn is paased due to not hit the put api",
//         currentTurn: updateTurn.updatedPlayers[nextUserIndex].UserId,
//         currentTime: new Date(),
//         nextTurnTime: updateTurn.nextTurnTime,
//         tableId: updateTurn.tableId,
//         updatedPlayers: updateTurn.updatedPlayers,
//         isGameOver: updateTurn.isGameOver,
//         isGameStart: updateTurn.isGameStart,
//         gameEndTime: updateTurn.gameEndTime,
//       };
//       return res.status(200).json(result);
//     } else {
//       // Not enough time has passed for the turn to switch
//       // const cnrtPlayer = updatedPlayers.find(
//       //   (players) => players.dicePoints !== 0
//       // );
//       if (crntPlayer === undefined || crntPlayer === null) {
//         let result = {
//           currentTurn: "wait for the turn",
//           currentTime: new Date(),
//           nextTurnTime: snakeLadder.nextTurnTime,
//           tableId: snakeLadder.tableId,
//           updatedPlayers: snakeLadder.updatedPlayers,
//           isGameOver: snakeLadder.isGameOver,
//           isGameStart: snakeLadder.isGameStart,
//           gameEndTime: snakeLadder.gameEndTime,
//         };
//         console.log("Wait for the turn");
//         return res.status(200).json(result);
//       } else {
//         let result = {
//           currentTurn: crntPlayer.UserId,
//           currentTime: new Date(),
//           nextTurnTime: snakeLadder.nextTurnTime,
//           tableId: snakeLadder.tableId,
//           updatedPlayers: snakeLadder.updatedPlayers,
//           isGameOver: snakeLadder.isGameOver,
//           isGameStart: snakeLadder.isGameStart,
//           gameEndTime: snakeLadder.gameEndTime,
//         };
//         console.log("dicepoints and position of player", result.updatedPlayers);
//         return res.status(200).json(result);
//       }
//     }
//   } catch (err) {
//     return res.status(500).send({
//       status: false,
//       error: err.message,
//     });
//   }
// };

//____________________testing code_______________________

const getSnkByGroupId = async function (req, res) {
  try {
    let groupId = req.query.groupId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(200)
        .send({ status: false, message: "invalid groupId" });
    }
    let snakeLadder = await groupModelForSnakeLadder.findById({ _id: groupId });

    if (!snakeLadder) {
      return res
        .status(200)
        .send({ status: false, message: "this groupId not found" });
    }

    let tableId = snakeLadder.tableId;
    let createdTime = snakeLadder.createdTime;
    const updatedPlayers = snakeLadder.updatedPlayers;
    let timeDiff = snakeLadder.gameEndTime - new Date();
    console.log(timeDiff, "endtime of a group==========");
    let crntPlayer = updatedPlayers.find((players) => players.turn === true);
    // const cnrtPlayer = updatedPlayers.find(
    //   (players) => players.dicePoints !== 0
    // );
    const checkTable = await snkTournamentModel
      .findById({ _id: tableId })
      .lean();

    if (!checkTable) {
      if (snakeLadder.isGameOver) {
        let result = {
          currentTurn: "game is over",
          currentTime: new Date(),
          nextTurnTime: new Date(),
          tableId: snakeLadder.tableId,
          updatedPlayers: snakeLadder.updatedPlayers,
          isGameOver: snakeLadder.isGameOver,
          isGameStart: snakeLadder.isGameStart,
          gameEndTime: snakeLadder.gameEndTime,
        };
        console.log(result.updatedPlayers, "when winner is declared");
        return res.status(200).json(result);
      }
    }
    if (snakeLadder.isGameStart === 0) {
      let result = {
        currentTurn: "wait for the turn",
        currentTime: new Date(),
        nextTurnTime: snakeLadder.nextTurnTime,
        tableId: snakeLadder.tableId,
        updatedPlayers: snakeLadder.updatedPlayers,
        isGameOver: snakeLadder.isGameOver,
        isGameStart: snakeLadder.isGameStart,
        gameEndTime: snakeLadder.gameEndTime,
      };
      console.log("Wait for the turn");
      return res.status(200).json(result);
    }
    //_________________________winner declare_____________
    if (snakeLadder.isGameOver) {
      let result = {
        currentTurn: "game is over",
        currentTime: new Date(),
        nextTurnTime: new Date(),
        tableId: snakeLadder.tableId,
        updatedPlayers: snakeLadder.updatedPlayers,
        isGameOver: snakeLadder.isGameOver,
        isGameStart: snakeLadder.isGameStart,
        gameEndTime: snakeLadder.gameEndTime,
      };
      console.log(result.updatedPlayers, "when winner is declared");
      return res.status(200).json(result);
    }
    //_________________update points for bot User________________________________

    // let botPlayer = updatedPlayers.find(
    //   (player) => player.isBot && player.turn
    // );

    // if (botPlayer) {
    //   let botPlayerId = botPlayer.UserId;
    //   const currentUserIndex = updatedPlayers.findIndex(
    //     (player) => player.UserId === botPlayerId
    //   );
    //   const nextUserIndex = (currentUserIndex + 1) % updatedPlayers.length;
    //   const nextUserId = updatedPlayers[nextUserIndex].UserId;

    //   let result = {
    //     currentTurn: nextUserId,
    //     currentTime: new Date(),
    //     nextTurnTime: snakeLadder.nextTurnTime,
    //     tableId: snakeLadder.tableId,
    //     updatedPlayers: snakeLadder.updatedPlayers,
    //     isGameOver: snakeLadder.isGameOver,
    //     isGameStart: snakeLadder.isGameStart,
    //     gameEndTime: snakeLadder.gameEndTime,
    //   };

    //   return res.status(200).json(result);
    // }

    //___________Check if it's time to switch turn to next user

    if (crntPlayer === undefined || crntPlayer === null || !crntPlayer) {
      let result = {
        currentTurn: "wait for the turn",
        currentTime: new Date(),
        nextTurnTime: snakeLadder.nextTurnTime,
        tableId: snakeLadder.tableId,
        updatedPlayers: snakeLadder.updatedPlayers,
        isGameOver: snakeLadder.isGameOver,
        isGameStart: snakeLadder.isGameStart,
        gameEndTime: snakeLadder.gameEndTime,
      };
      console.log("Wait for the turn");
      return res.status(200).json(result);
    } else {
      let result = {
        currentTurn: crntPlayer.UserId,
        currentTime: new Date(),
        nextTurnTime: snakeLadder.nextTurnTime,
        tableId: snakeLadder.tableId,
        updatedPlayers: snakeLadder.updatedPlayers,
        isGameOver: snakeLadder.isGameOver,
        isGameStart: snakeLadder.isGameStart,
        gameEndTime: snakeLadder.gameEndTime,
      };
      console.log("dicepoints and position of player", result.updatedPlayers);
      return res.status(200).json(result);
    }
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};
//_____________________________________update points of user________________________________________

const updatePointOfUser = async function (req, res) {
  try {
    let UserId = req.query.UserId;
    let groupId = req.query.groupId;
    let hit = false;

    if (!UserId && !groupId) {
      return res.status(200).send({
        status: false,
        message: "please provide both groupId and UserId",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(200)
        .send({ status: false, message: "invalid groupId" });
    }

    let groupExist = await groupModelForSnakeLadder.findById({
      _id: groupId,
    });
    if (!groupExist) {
      return res
        .status(200)
        .send({ status: false, message: "groupId is not present" });
    }
    let updatedPlayers = groupExist.updatedPlayers;

    let isUserExist = groupExist.updatedPlayers.find(
      (players) => players.UserId === UserId
    );

    if (!isUserExist) {
      return res.status(200).send({
        status: false,
        message: "this user is not present in this group",
      });
    }
    let turn = isUserExist.turn;

    if (turn === false) {
      return res.status(200).send({ message: "not your turn" });
    }

    const currentUserIndex = updatedPlayers.findIndex(
      (player) => player.UserId === UserId
    );
    const nextUserIndex = (currentUserIndex + 1) % updatedPlayers.length;
    const nextUserId = updatedPlayers[nextUserIndex].UserId;
    const possibleValues = [1, 2, 3, 4, 5, 6];

    const randomIndex = Math.floor(Math.random() * possibleValues.length);

    const randomValue = possibleValues[randomIndex];

    // check for snakes, ladders, and tunnels
    const currentPosition =
      updatedPlayers[currentUserIndex].points + randomValue;

    // Ensure that the current position does not exceed 99
    const newPosition =
      currentPosition > 99
        ? updatedPlayers[currentUserIndex].points
        : currentPosition;

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

    if (newPosition in snakeLadderAndTunnel) {
      updatedPlayers[currentUserIndex].points =
        snakeLadderAndTunnel[newPosition];
      updatedPlayers[currentUserIndex].movement =
        newPosition === 2 ||
        newPosition === 8 ||
        newPosition === 19 ||
        newPosition === 25 ||
        newPosition === 41 ||
        newPosition === 49 ||
        newPosition === 74
          ? "Ladder"
          : // : newPosition === 4 ||
            //   newPosition === 22 ||
            //   newPosition === 37 ||
            //   newPosition === 60
            // ? "Tunnel"
            "Snake";
    } else {
      updatedPlayers[currentUserIndex].points = newPosition;
      updatedPlayers[currentUserIndex].movement = "";
    }

    updatedPlayers[currentUserIndex].dicePoints = randomValue;
    updatedPlayers[nextUserIndex].dicePoints = 0;
    updatedPlayers[currentUserIndex].currentPoints = newPosition;
    updatedPlayers[currentUserIndex].turn = false;

    groupExist.updatedPlayers = updatedPlayers;
    if (
      newPosition === 2 ||
      newPosition === 8 ||
      newPosition === 19 ||
      newPosition === 25 ||
      newPosition === 41 ||
      newPosition === 49 ||
      newPosition === 74
    ) {
      // groupExist.nextTurnTime = new Date(Date.now() + 15 * 1000); // 8+7
      groupExist.nextTurnTime = new Date(Date.now() + 11 * 1000); // 8+7
    } else {
      // groupExist.nextTurnTime = new Date(Date.now() + 12 * 1000); //8+4
      groupExist.nextTurnTime = new Date(Date.now() + 11 * 1000); //8+4
    }

    let updatedData = await groupExist.save();
    let updatedUser = updatedData.updatedPlayers[currentUserIndex];

    const nextTurnHandler = () => {
      groupExist.lastHitTime = new Date();
      groupExist.currentUserId = nextUserId;
      groupExist.updatedPlayers[nextUserIndex].turn = true;
      groupExist.save();
      console.log(
        "after sertTimeout  in put >>>>>>>>>>",
        new Date().getSeconds(),
        "++++++++++++",
        groupExist
      );
    };

    if (
      newPosition === 2 ||
      newPosition === 8 ||
      newPosition === 19 ||
      newPosition === 25 ||
      newPosition === 41 ||
      newPosition === 49 ||
      newPosition === 74
    ) {
      let result = {
        nextTurn: nextUserId,
        currentTime: new Date(),
        nextTurnTime: updatedData.nextTurnTime,
        currentPoints: newPosition,
        dicePoints: randomValue,
        userName: updatedUser.userName,
        UserId: updatedUser.UserId,
        prize: updatedUser.prize,
        isBot: updatedUser.isBot,
        totalPoints: updatedUser.points,
        turn: updatedUser.turn,
      };
      console.log(result, "==========================", new Date());

      setTimeout(nextTurnHandler, 11000);

      return res.status(200).json(result);
    } else {
      let result = {
        nextTurn: nextUserId,
        currentTime: new Date(),
        nextTurnTime: updatedData.nextTurnTime,
        currentPoints: newPosition,
        dicePoints: randomValue,
        userName: updatedUser.userName,
        UserId: updatedUser.UserId,
        prize: updatedUser.prize,
        isBot: updatedUser.isBot,
        totalPoints: updatedUser.points,
        turn: updatedUser.turn,
      };
      console.log(
        result,
        "==========================",
        new Date().getSeconds()
      );

      // setTimeout(nextTurnHandler, 4000);

      return res.status(200).json(result);
    }
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//___________________micro api for getting players__________________

const getPlayersOfSnkLadder = async function (req, res) {
  try {
    let players = await snkTournamentModel
      .find({ endTime: { $gt: new Date() } })
      .sort({ maxTime: 1 })
      .select({ _id: 1, players: 1, playerWithBot: 1 });

    if (players.length === 0) {
      return res.status(200).send({
        status: false,
        message: " Data not present",
      });
    }

    players.forEach((item) => {
      item.players = item.playerWithBot;
      console.log(
        item.players,
        "==========data.players in ma=======",
        item.playerWithBot
      );
    });

    return res.status(200).send({
      status: true,
      message: "Success",
      data: players,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//________________________________get all groups____________________________

const getAllGroupsOfSnk = async function (req, res) {
  try {
    let groupsData = await groupModelForSnakeLadder
      .find()
      .sort({ createdTime: -1 });

    if (groupsData.length === 0) {
      return res.status(200).send({
        status: false,
        message: "data not found",
      });
    }
    return res.status(200).json(groupsData);
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

module.exports = {
  snkTablesCreatedByAdmin,
  updateSnakLdrTournaments,
  getAllSnak,
  createSnakeLadderTables,
  getGroupsByUser,
  getSnkByGroupId,
  updatePointOfUser,
  getPlayersOfSnkLadder,
  getAllGroupsOfSnk,
};
