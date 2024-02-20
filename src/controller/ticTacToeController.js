const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const ticTacToeModel = require("../model/ticTacToeModel");
const ticTacToeTournamentModel = require("../model/ticTacToeTournamentModel");
const ticTacToeGroupModel = require("../model/ticTacToeGroupModel");
const { createGroupForticTacToe } = require("../reusableCodes/reusablecode");
const moment = require("moment");
const cron = require("node-cron");

//____________________________update Table_______________________________________

const updateTic = async function (req, res) {
  try {
    let updateData = req.query;
    let UserId = req.query.UserId;

    const matchData = await ticTacToeModel.findOneAndUpdate(
      { UserId: UserId },
      updateData,
      { new: true }
    );

    if (matchData.length == 0) {
      return res.status(404).send({
        status: false,
        message: "user not found",
      });
    }

    return res.status(200).send({
      status: true,
      message: "Success",
      data: matchData,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//____________________get All data of TicTacToeData_____________________________________

const getAllTic = async function (req, res) {
  try {
    let data = req.query;

    const ticTacToeData = await ticTacToeModel.find(data).sort({ ticWins: -1 });

    if (data.length == 0) {
      return res
        .status(404)
        .send({ status: false, message: " no data is  found " });
    }

    return res.status(200).send({
      status: true,
      message: "Success",
      data: ticTacToeData,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//____________________________________create ticTacToe tournaments by admin___________

// const ticTacToeTablesCreatedByAdmin = async function (req, res) {
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

//     let tableByAdmin1I = await ticTacToeTournamentModel.create(req.body);
//     let tableId1 = tableByAdmin1I._id;
//     console.log(tableId1, "--------------tableId1I");
//     setTimeout(function () {
//       createGroupForticTacToe(tableId1);
//       console.log(tableByAdmin1I,"===========create group setTimeOut");
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
const ticTacToeTablesCreatedByAdmin = async function (req, res) {
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
      time
    } = req.body;

    console.log(req.body, "============body data");

    entryFee = parseInt(entryFee);
    maxPlayers = parseInt(maxPlayers);
    maxTime = parseInt(maxTime);
    endTime = Date.now() + maxTime * 60 * 1000;
    req.body.endTime = endTime;

    // Use moment for flexible date and time parsing
    const tournamentStartTime = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm').toDate();

    // Calculate the delay in milliseconds until the tournament starts
    const delay = tournamentStartTime - Date.now();
    console.log(tournamentStartTime, "========tournamentStartTime====", delay);

    if (delay < 0) {
      return res.status(400).send({
        status: false,
        message: "Invalid date and time. Please provide a future date and time.",
      });
    }

    // Schedule the tournament creation using node-cron
    cron.schedule(moment(tournamentStartTime).format('mm HH DD MM *'), async () => {
      try {
        // Update request body with user-provided values
        console.log(tournamentStartTime, "========tournamentStartTime====", delay);
        req.body.tableByAdmin = true;
        req.body.maxPlayers = maxPlayers;
        req.body.entryFee = entryFee;

        let tableByAdmin1 = await ticTacToeTournamentModel.create(req.body);
        let tableId1 = tableByAdmin1._id;

        console.log('Tournament created successfully!==', tableId1);
        if(tableId1){
          console.log("calling the setTimeout function");
        setTimeout(function () {
            createGroupForticTacToe(tableId1);
            console.log(tableByAdmin1, "==========table for snk after setTimeOut===", new Date().getMinutes());
          }, maxTime + 60 * 1000);
        }
        
      } catch (error) {
        console.error('Error creating tournament:', error.message);
      }
    });

    return res.status(201).send({
      status: true,
      message: "Tournament creation scheduled",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

//____________________________________create ticTacToe tournaments___________

const createTicTacToeTables = async function (req, res) {
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
        createGroupForticTacToe(tableId1);
      }

      endTime = Date.now() + 1 * 20 * 1000;
      data1.endTime = req.query.endTime = endTime;

      tournamentTable1 = await ticTacToeTournamentModel.create(data1);
      tableId1 = tournamentTable1._id;
      console.log(tournamentTable1);
    }

    setInterval(createTournament1, 20000);

    createTournament1();

    //_______________________create table2 with setinterval an end time________________
    let tableId2;

    async function createTournament2() {
      if (tableId2 != undefined) {
        createGroupForticTacToe(tableId2);
      }

      endTime = Date.now() + 4 * 60 * 1000;
      data2.endTime = req.query.endTime = endTime;

      tournamentTable2 = await ticTacToeTournamentModel.create(data2);
      tableId2 = tournamentTable2._id;
      // console.log(tournamentTable2);
    }

    setInterval(createTournament2, 240000);
    createTournament2();

    //_______________________create table3 with setinterval an end time________________
    let tableId3;

    async function createTournament3() {
      if (tableId3 != undefined) {
        createGroupForticTacToe(tableId3);
      }

      let endTime = Date.now() + 5 * 60 * 1000;
      data3.endTime = req.query.endTime = endTime;
      tournamentTable3 = await ticTacToeTournamentModel.create(data3);
      tableId3 = tournamentTable3._id;
      // console.log(tournamentTable3);
    }
    setInterval(createTournament3, 300000);
    createTournament3();

    //  // _______________________create table4 with setinterval an end time________________
    let tableId4;

    async function createTournament4() {
      if (tableId4 != undefined) {
        createGroupForticTacToe(tableId4);
      }
      endTime = Date.now() + 10 * 60 * 1000;
      data4.endTime = req.query.endTime = endTime;
      tournamentTable4 = await ticTacToeTournamentModel.create(data4);
      tableId4 = tournamentTable4._id;
      // console.log(tournamentTable4);
    }
    setInterval(createTournament4, 600000);
    createTournament4();

    //_____________________________create table5 with setinterval an end time____
    let tableId5;

    async function createTournament5() {
      if (tableId5 != undefined) {
        createGroupForticTacToe(tableId5);
      }
      endTime = Date.now() + 15 * 60 * 1000;
      data5.endTime = req.query.endTime = endTime;
      tournamentTable5 = await ticTacToeTournamentModel.create(data5);
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


//____________________________________ getAllTicTacToe tournaments___________

const getAllTicTacToeData = async function (req, res) {
  try {
    let UserId = req.query.UserId;
    let currentTime = new Date();

    //______________only fetch that table which timing is running

    const data = await ticTacToeTournamentModel
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

    let userData = await ticTacToeTournamentModel.aggregate([
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
        let status = await ticTacToeGroupModel.findOne({
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

//____________________________________updateTicTacToeTournaments  ______________

const updateTicTacToeTournaments = async function (req, res) {
  try {
    let tableId = req.query.tableId;
    let UserId = req.query.UserId;
    let updateData = req.query;
    let { status } = updateData;

    if (Object.keys(updateData).length == 0) {
      return res.status(400).send({
        status: false,
        message: "For updating please enter atleast one key",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid tableId" });
    }

    let existTable = await ticTacToeTournamentModel.findById({ _id: tableId });
    if (!existTable) {
      return res.status(404).send({
        status: false,
        message: " This table is not present ",
      });
    }
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
      return res.status(400).send({ status: false, message: " Full " });
    }

    //________________________________find user,s Name _____________________________________

    let userExist = await userModel.findOne({ UserId: UserId, isDeleted:false });
    if (!userExist) {
      return res.status(404).send({
        status: false,
        message: " user not found",
      });
    }
    const { userName, isBot, credits } = userExist;

    if (credits < entryFee) {
      return res.status(404).send({
        status: false,
        message: " insufficient balance to play",
      });
    }

    //_______update table with userId and tableId (if user joined perticular table players incereses by 1 automatically)

    let userData = await ticTacToeTournamentModel.aggregate([
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
          return res.status(400).send({
            status: false,
            message: " You can not join",
          });
        }
      }
    }
    //_________________deduct the entryFee from the users credit when user want to join the table

    const tableUpdate = await ticTacToeTournamentModel
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

    let time = existTable.createdAt;
    let userHistory = await userModel.findOneAndUpdate(
      { UserId: UserId },
      {
        $push: {
          history: { gameType: "TicTacToe", tableId: tableId, time: time, result:"", win:0},
          transactionHistory:{date:new Date(), amount:entryFee, type:"Entry Fee",gameType: "TicTacToe"}
        },
        $inc: {
          credits: -entryFee, "ticTacToeData.0.playCount": 1    // Increment playCount by 1
        }, 
      },
      { new: true }
    );
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

//__________________________________get groups per UserId and tableId ____________________________________________

const getTicTacToeGroupsByUser = async function (req, res) {
  try {
    let tableId = req.query.tableId;
    let UserId = req.query.UserId;

    if (Object.keys(req.query).length <= 1) {
      return res.status(400).send({
        status: false,
        message: " Please provide both tableId and UserId ",
      });
    }
    let userExist = await userModel.findOne({ UserId: UserId });

    if (userExist == null) {
      return res.status(404).send({
        status: false,
        message: " User not found ",
      });
    }
    let userName = userExist.userName;

    const table = await ticTacToeGroupModel.find({ tableId: tableId });
    console.log("table>>>>>>>>>>>>>>", table);

    if (table.length === 0) {
      return res.status(404).send({
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
      return res.status(404).send({
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

//________________________get groupdata as per groupid__________________

const getGroupsOfTicTacToeAsPerGrpId = async function (req, res) {
  try {

    let groupId = req.query.groupId;
    let groupsData = await ticTacToeGroupModel.findOne({_id:groupId});

    if (groupsData.length === 0) {
      return res.status(404).send({
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

//_____________________________________micro api for getting players_________________________________________

const getPlayersOfTicTacToe = async function (req, res) {
  try {
    let players = await ticTacToeTournamentModel
      .find({ endTime: { $gt: new Date() } })
      .sort({ maxTime: 1 })
      .select({ _id: 1, players: 1 });

    if (players.length === 0) {
      return res.status(404).send({
        status: false,
        message: " Data not present",
      });
    }

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

const getAllGroupsOfTicTacToe = async function (req, res) {
  try {
    let groupsData = await ticTacToeGroupModel.find().sort({createdTime:-1});;

    if (groupsData.length === 0) {
      return res.status(404).send({
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
  updateTic,
  getAllTic,
  ticTacToeTablesCreatedByAdmin,
  createTicTacToeTables,
  getAllTicTacToeData,
  updateTicTacToeTournaments,
  getTicTacToeGroupsByUser,
  getPlayersOfTicTacToe,
  getAllGroupsOfTicTacToe,
  getGroupsOfTicTacToeAsPerGrpId,
};
