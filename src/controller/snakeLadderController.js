const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const snkTournamentModel = require("../model/snkTournamentModel");
const groupModelForSnakeLadder = require("../model/groupModelForSnakeLadder");
const snakeLadderModel = require("../model/snakeLadderModel");
const Decimal = require("decimal.js");
const {
  updateBotPoints,
  createGroupForSnakeLadder,
  checkTurn
} = require("../reusableCodes/snkReus");
const { log } = require("console");
const { promises } = require("dns");
const { resolve } = require("path");
const totalBotForSnk = 0;
let currentDate = new Date();
const moment = require("moment");
const cron = require("node-cron");
const rocketTournamentModel = require("../model/rocketTournamentModel");
delete require.cache[require.resolve("../controller/rocketController")];
const rktGroupModel = require("../controller/rocketController");

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

    let data1ForRkt = {
      entryFee: 1,
      prizeAmount: 1 * 2, 
      maxTime: 1,
    };

    let data2ForRkt = {
      entryFee: 10,
      prizeAmount: 10 * 2,
      maxTime: 4,
    };

    let tournamentTable1;
    let tournamentTable2;
    let tournamentTable1ForRkt;
    let tournamentTable2ForRkt;

    //_______________________create table1 with setinterval an end time___________
    let tableId1;
    let gameNameForSnk = 'SnakeLadder';
    async function createTournament1() {
      if (tableId1 != undefined) {
        createGroupForSnakeLadder(tableId1, gameNameForSnk);
      }

      endTime = Date.now() + 1 * 60 * 1000;
      data1.endTime = req.query.endTime = endTime;

      tournamentTable1 = await snkTournamentModel.create(data1);
      tableId1 = tournamentTable1._id;
      console.log(tournamentTable1);
    }
 //_______________________create table1 with setinterval an end time for Rocket___________
 let tableId1ForRkt;
 let gameNameForRkt = 'Rocket' ;
 async function createTournament1ForRkt() {
   if (tableId1ForRkt != undefined ) {
     createGroupForSnakeLadder(tableId1ForRkt, gameNameForRkt);
   }

   endTime = Date.now() + 1 * 60 * 1000;
   data1ForRkt.endTime = req.query.endTime = endTime;

   tournamentTable1ForRkt = await rocketTournamentModel.create(data1ForRkt);
   tableId1ForRkt = tournamentTable1ForRkt._id;
   console.log(tournamentTable1ForRkt);
 }
    setInterval(function() {
      createTournament1();
      createTournament1ForRkt();
  }, 60000);

    createTournament1();
    createTournament1ForRkt();

    //_______________________create table2 with setinterval an end time________________
    let tableId2;

    async function createTournament2() {
      if (tableId2 != undefined) {
        createGroupForSnakeLadder(tableId2, gameNameForSnk);
      }

      endTime = Date.now() + 4 * 60 * 1000;
      data2.endTime = req.query.endTime = endTime;

      tournamentTable2 = await snkTournamentModel.create(data2);
      tableId2 = tournamentTable2._id;
      // console.log(tournamentTable2);
    }
 //_______________________create table2 with setinterval an end time for Rocket___________
 let tableId2ForRkt;
 async function createTournament2ForRkt() {
   if (tableId2ForRkt != undefined) {
     createGroupForSnakeLadder(tableId2ForRkt, gameNameForRkt);
   }

   endTime = Date.now() + 1 * 60 * 1000;
   data2ForRkt.endTime = req.query.endTime = endTime;

   tournamentTable2ForRkt = await rocketTournamentModel.create(data2ForRkt);
   tableId2ForRkt = tournamentTable2ForRkt._id;
  //  console.log(tournamentTable2ForRkt);
 }
 setInterval(function() {
  createTournament2();
  createTournament2ForRkt();
}, 240000);

createTournament2();
createTournament2ForRkt();

   

    return res.status(201).send({
      status: true,
      message: "Success for both snakeladder and rocket",
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
    let { userName, isBot, credits, realMoney, token } = userExist;
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
              token:token,
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
    console.log("input data=====>",tableId,"====>",UserId);
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

    const table = await groupModelForSnakeLadder.findOne({ tableId: tableId,"group.UserId": UserId })
    .select({ group: 1, updatedPlayers: 1 })
    .lean();
    // console.log("table>>>>>>>>>>>>>>", table);

    if (!table) {
      return res.status(200).send({
        status: false,
        message: " This table is not present ",
      });
    }
    // let groups = table.map((items) => items.group);
    // console.log(groups, "groups>>>>>>>>>>>");

    // let user, groupId, users;
    // for (let group = 0; group < groups.length; group++) {
    //   console.log(groups[group], "================================");

    //   let findUser = groups[group].find((user) => user.userName === userName);

    //   if (findUser != null) {
    //     user = findUser;
    //     groupId = table[group]._id;
    //     users = groups[group];
    //     break;
    //   }
    // }

    // if (!user) {
    //   return res.status(200).send({
    //     status: true,
    //     message: "this user is not present in any group",
    //   });
    // }

    // console.log(user, ">>>>>>>>>>>>>");
    // users = users.map((items) => items.userName);
    // let usersNameInStr = users.join(" ");
    const usersName = table.group.map((items) => items.userName);
    const userId = table.group.map((items) => items.UserId);
    const usersIdInStr = userId.join(" ");
    let usersNameInStr = usersName.join(" ");
    const botData = table.updatedPlayers.find(player => player.isBot);
    console.log("botData=====>",botData);
    if(botData){
    return res.status(200).send({
      status: true,
      message: "Success",
      groupId:table._id,
      botData:botData.UserId,
      usersNameInStr,
      usersIdInStr
    });
  }
  return res.status(200).send({
    status: true,
    message: "Success",
    groupId:table._id,
    botData:null,
    usersNameInStr,
    usersIdInStr
  });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//______________________get snakeladder data by groupId______________________
const getSnkByGroupId = async function (req, res) {
  try {
    let groupId = req.query.groupId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(200)
        .send({ status: false, message: "invalid groupId" });
    }
    let snakeLadder = await groupModelForSnakeLadder
      .findById({ _id: groupId })
      .select({ group: 0 })
      .lean();

    if (!snakeLadder) {
      return res
        .status(200)
        .send({ status: false, message: "this groupId not found" });
    }

    let timeDiff = snakeLadder.gameEndTime - new Date();
    console.log(timeDiff, "endtime of a group==========");
    let crntPlayer = snakeLadder.updatedPlayers.find(
      (players) => players.turn === true
    );

    const updatedPlayersForRes = snakeLadder.updatedPlayers.map(
      ({ UserId, points,dicePoints }) => ({
        UserId,
        points,
        dicePoints
      })
    );

    //_________________________winner declare_____________

    if (snakeLadder.isGameOver) {
      const DataAftrGameOver = snakeLadder.updatedPlayers.map(
        ({ UserId, points,dicePoints, prize, userName }) => ({
          UserId,
          userName,
          points,
          dicePoints,
          prize,
        })
      );
      let result = {
        message:"game is over",
        currentTurn:snakeLadder.currentUserId,
        currentTime: new Date(),
        nextTurnTime: snakeLadder.nextTurnTime,
        updatedPlayers: DataAftrGameOver,
        isGameOver: snakeLadder.isGameOver,
        gameEndTime: snakeLadder.gameEndTime,
      };
      console.log(result.updatedPlayers, "when winner is declared");
      return res.status(200).json(result);
    }

    //___________Check if it's time to switch turn to next user

    if (
      crntPlayer === undefined ||
      crntPlayer === null ||
      !crntPlayer ||
      snakeLadder.isGameStart === 0
    ) {
      let result = {
        currentTurn: snakeLadder.currentUserId,
        currentTime: new Date(),
        nextTurnTime: snakeLadder.nextTurnTime,
        updatedPlayers: updatedPlayersForRes,
        isGameOver: snakeLadder.isGameOver,
        gameEndTime: snakeLadder.gameEndTime,
      };
      console.log("Wait for the turn time====>",result.nextTurnTime);
      return res.status(200).json(result);
    } else {
      let result = {
        currentTurn: snakeLadder.currentUserId,
        currentTime: new Date(),
        nextTurnTime: snakeLadder.nextTurnTime,
        updatedPlayers: updatedPlayersForRes,
        isGameOver: snakeLadder.isGameOver,
        gameEndTime: snakeLadder.gameEndTime,
      };
      console.log("dicepoints and position of player with next turn time=====>", result.nextTurnTime);
      return res.status(200).json(result);
    }
  } catch (err) {
    console.log(err);
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
      "updatedPlayers.UserId": UserId,
    });
    if (!groupExist) {
      return res
        .status(200)
        .send({ status: false, message: "groupId is not present" });
    }
    if(groupExist.isGameOver){
      return res.status(200).send({sttaus:false, messge:"Game is Over"})
    }
    let isUserExist = groupExist.updatedPlayers.find(
      (players) => players.UserId === UserId
    );
    if(!isUserExist){
      return res.status(200).send({status:false, message:"User not found"});
    }
    let turn = isUserExist.turn;

    if (turn === false) {
      return res.status(200).send({ message: "not your turn" });
    }
    const updatedPlayers = groupExist.updatedPlayers;
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
    updatedPlayers[nextUserIndex].turn = true;

    groupExist.updatedPlayers = updatedPlayers;
    groupExist.nextTurnTime = new Date(Date.now() + 12 * 1000);
    groupExist.lastHitTime = new Date();
    groupExist.currentUserId = nextUserId;
    // if (
    //   newPosition === 2 ||
    //   newPosition === 8 ||
    //   newPosition === 19 ||
    //   newPosition === 25 ||
    //   newPosition === 41 ||
    //   newPosition === 49 ||
    //   newPosition === 74
    // ) {
    //   // groupExist.nextTurnTime = new Date(Date.now() + 15 * 1000); // 8+7
    //   groupExist.nextTurnTime = new Date(Date.now() + 11 * 1000); // 8+7
    // } else {
    //   // groupExist.nextTurnTime = new Date(Date.now() + 12 * 1000); //8+4
    //   groupExist.nextTurnTime = new Date(Date.now() + 11 * 1000); //8+4
    // }

    let updatedData = await groupExist.save();
    let botPlayer = updatedData.updatedPlayers.find(
      (player) => player.isBot && player.turn
    );
    if (botPlayer) {
      const updateDataForBot = await updateBotPoints(botPlayer, updatedData, groupModelForSnakeLadder, 'SnakeLadder');
      // console.log("updateDataForBot===>",updateDataForBot);
      const updatedPlayersForRes = updateDataForBot.updatedPlayers.map(
        ({ UserId, points, dicePoints }) => ({
          UserId,
          points,
          dicePoints,
        })
      );
      let result = {
        currentTurn: updateDataForBot.currentUserId,
        currentTime: new Date(),
        nextTurnTime: updateDataForBot.nextTurnTime,
        dicePointForPlayer: randomValue,
        updatedPlayers: updatedPlayersForRes,
        isGameOver: updateDataForBot.isGameOver,
        gameEndTime: updateDataForBot.gameEndTime,
      };
      console.log("response after tab the dice for bot=====>");
      return res.status(200).json(result);
    } else {
      const checkAndSetTimeout = await checkTurn(groupId, 'SnakeLadder',"called in updateUserPoints")
      setTimeout(checkAndSetTimeout, 12000)
      const updatedPlayersForRes = updatedData.updatedPlayers.map(
        ({ UserId, points, dicePoints }) => ({
          UserId,
          points,
          dicePoints,
        })
      );
      let result = {
        currentTurn: updatedData.currentUserId,
        currentTime: new Date(),
        nextTurnTime: updatedData.nextTurnTime,
        dicePointForPlayer: randomValue,
        updatedPlayers: updatedPlayersForRes,
        isGameOver: updatedData.isGameOver,
        gameEndTime: updatedData.gameEndTime,
      };
      console.log("response after tab the dice=====>");
      return res.status(200).json(result);
    }
    
  } catch (err) {
    console.log(err);
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
