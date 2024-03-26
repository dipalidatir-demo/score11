const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const tournamentModel = require("../model/tournamentModel");
const cricketModel = require("../model/cricketModel");
const _ = require("lodash");
const fakeUsers = require("./dummyUsers");
const { find } = require("lodash");
const groupModel = require("../model/groupModel");
const cron = require("node-cron");
const botModel = require("../model/botModel");
const {
  createGroup,
  createGroupByAdmin,
} = require("../reusableCodes/cricketReu");
const moment = require("moment");
let currentDate = new Date();
let totalBot = 9;
//________________________________________create tournaments for admin panel________________
//_______________________using node crone__________________________
const tournamentsByAdmin = async function (req, res) {
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
      return res.status(200).send({
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

          let tableByAdmin1 = await tournamentModel.create(req.body);
          let tableId1 = tableByAdmin1._id;

          console.log("Tournament created successfully!==", tableId1);
          setTimeout(function () {
            createGroupByAdmin(tableId1);
            console.log(
              tableByAdmin1,
              "===========create cricket group setTimeOut",
              new Date().getMinutes()
            );
          }, maxTime + 60 * 1000);
          // }
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

//__________________________________________________create all Tournaments

const createTournaments = async function (req, res) {
  try {
    // Define tournament data
    let data1 = {
      entryFee: 1,
      prizeAmount: 1 * 4,
      maxTime: 1,
    };

    let data2 = {
      entryFee: 10,
      prizeAmount: 10 * 4,
      maxTime: 4,
    };

    // let data3 = {
    //   entryFee: 20,
    //   prizeAmount: 20 * 4,
    //   maxTime: 5,
    // };

    // let data4 = {
    //   entryFee: 50,
    //   prizeAmount: 50 * 4,
    //   maxTime: 10,
    // };

    // let data5 = {
    //   entryFee: 100,
    //   prizeAmount: 100 * 4,
    //   maxTime: 15,
    // };
    let tableId1;
    // Define functions to create tournaments
    async function createTournament1() {
      if (tableId1 != undefined) {
        createGroup(tableId1);
      }

      endTime = Date.now() + 1 * 60 * 1000;
      data1.endTime = req.query.endTime = endTime;

      tournamentTable1 = await tournamentModel.create(data1);
      tableId1 = tournamentTable1._id;
      console.log(tournamentTable1);
    }
    let tableId2;
    async function createTournament2() {
      if (tableId2 != undefined) {
        createGroup(tableId2);
      }

      endTime = Date.now() + 4 * 60 * 1000;
      data2.endTime = req.query.endTime = endTime;

      tournamentTable2 = await tournamentModel.create(data2);
      tableId2 = tournamentTable2._id;
      console.log(tournamentTable2);
    }

    // let tableId3;
    // async function createTournament3() {
    //   if (tableId3 != undefined) {
    //     createGroup(tableId3);
    //   }

    //   let endTime = Date.now() + 5 * 60 * 1000;
    //   data3.endTime = req.query.endTime = endTime;
    //   tournamentTable3 = await tournamentModel.create(data3);
    //   tableId3 = tournamentTable3._id;
    //   console.log(tournamentTable3);
    // }
    // let tableId4;
    // async function createTournament4() {
    //   if (tableId4 != undefined) {
    //     createGroup(tableId4);
    //   }
    //   endTime = Date.now() + 10 * 60 * 1000;
    //   data4.endTime = req.query.endTime = endTime;
    //   tournamentTable4 = await tournamentModel.create(data4);
    //   tableId4 = tournamentTable4._id;
    //   console.log(tournamentTable4);
    // }
    // let tableId5 ;
    // async function createTournament5() {
    //   if (tableId5 != undefined) {
    //     createGroup(tableId5);
    //   }
    //   endTime = Date.now() + 15 * 60 * 1000;
    //   data5.endTime = req.query.endTime = endTime;
    //   tournamentTable5 = await tournamentModel.create(data5);
    //   tableId5 = tournamentTable5._id;
    //   console.log(tournamentTable5);
    // }

    // Schedule each tournament creation independently
    cron.schedule("*/1 * * * *", createTournament1);
    // cron.schedule('*/4 * * * *', createTournament2);
    // cron.schedule('*/5 * * * *', createTournament3);
    // cron.schedule('*/10 * * * *', createTournament4);
    // cron.schedule('*/15 * * * *', createTournament5);

    // Send the success response
    return res.status(201).send({
      status: true,
      message: "Tournaments scheduled successfully.",
    });
  } catch (error) {
    // Handle errors and send an error response
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

//_____________________________________getAll Tables _____________________________

const getAllTables = async function (req, res) {
  try {
    let UserId = req.query.UserId;
    let currentTime = new Date();
    //______________only fetch that table which timing is running

    let data = await tournamentModel
      .find({ endTime: { $gt: new Date() } })
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

    let userData = await tournamentModel.aggregate([
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

    if (userData.length > 0) {
      let tableId = userData.map((items) => items._id);
      console.log(tableId, "------------");
      let endTime = userData.map((items) => items.endTime);

      //______________________________check the match is started or not

      let matchStatus = [];

      for (let id = 0; id < tableId.length; id++) {
        let status = await groupModel.findOne({ tableId: tableId[id] }).select({tableId:1, start:1, isMatchOver:1});
        if (status) {
          //check match is running or finshed.
          if (status.isMatchOver === false) {
            matchStatus.push({
              tableId: status.tableId,
              start: status.start,
            });
          }
        } else {
          // push data if group is not created
          matchStatus.push({ tableId: tableId[id], start: false });
        }
      }
      if (matchStatus.length !== 0) {
        return res.status(200).send({
          status: true,
          message: "Success",
          matchStatus: matchStatus,
          endTime: endTime,
          joined: true,
          currentTime: currentTime,
          data: data,
        });
      }
    }

    data.forEach((item) => {
      item.players = item.playerWithBot;
      console.log(
        item.players,
        "==========data.players=======",
        item.playerWithBot
      );
    });

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

//_______________________________________________________update tournament____________________

const updateTournament = async function (req, res) {
  try {
    let tableId = req.query.tableId;
    let UserId = req.query.UserId;
    let updateData = req.query;
    let { status } = updateData;
    const currentTime = new Date();
    if (Object.keys(updateData).length == 0) {
      return res.status(200).send({
        status: false,
        message: "For updating please enter atleast one key",
      });
    }

    let existTable = await tournamentModel.findById({ _id: tableId });
    if (!existTable) {
      return res.status(200).send({
        status: false,
        message: " This table is not present ",
      });
    }

    if (currentDate != currentTime) {
      const botCount = await botModel.find().count();
      totalBot = botCount;
    }
    let ExistPlayers = existTable.players;
    let entryFee = existTable.entryFee;
    let maxPlayers = existTable.maxPlayers;

    if (ExistPlayers < maxPlayers) {
      status = "in_progress";
    }
    if (ExistPlayers === maxPlayers - 1) {
      status = "full";
    }
    if (ExistPlayers > maxPlayers - 1) {
      return res.status(200).send({ status: false, message: " Full " });
    }

    //________________________________find user's Name _____________________________________

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

    let userData = await tournamentModel.aggregate([
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
        console.log("time diff=====>", time - existTable.endTime);
        if (Math.abs(time - existTable.endTime) < 300000) {
          // 5 minutes 5*60*1000
          return res.status(200).send({
            status: false,
            message: " You can not join",
          });
        }
      }
    }
    //deduct the entryFee from the users credit when user want to join the table

    // let userName = userExist.userName;
    // let isBot = userExist.isBot;
    // let credits = userExist.credits

    const tableUpdate = await tournamentModel
      .findByIdAndUpdate(
        { _id: tableId },
        {
          $inc: { players: 1, playerWithBot: 1 },
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
console.log("tableUpdate token=====>",tableUpdate.Users);
    //_________________________update playerWithBot in table________________
    if (existTable.playerWithBot === 0) {
      setTimeout(() => {
        existTable.playerWithBot = totalBot;
        existTable.save();
      }, 1 * 10 * 1000);
    }

    //_______store user's tournament history in user profile

    let time = existTable.createdAt;
    // let userHistory = await userModel.findOneAndUpdate(
    //   { UserId: UserId },
    //   {
    //     $push: {
    //       history: {
    //         gameType: "cricket",
    //         tableId: tableId,
    //         time: time,
    //         result: "",
    //         win: 0,
    //       },
    //       transactionHistory: {
    //         date: new Date(),
    //         amount: entryFee,
    //         type: "Entry Fee",
    //         gameType: "cricket",
    //       },
    //     },
    //     $inc: {
    //       credits: -entryFee,
    //       "cricketData.0.playCount": 1,
    //     },
    //     // $inc: {  } // Increment playCount by 1
    //   },
    //   { new: true }
    // );
    // console.log("users data after deduct the credit >>>>>>>>>>>>>",userHistory)
    let userHistory;
    if (userExist.credits >= entryFee) {
      // Sufficient credits, deduct from credits
      userHistory = await userModel.findOneAndUpdate(
        { UserId: UserId },
        {
          $push: {
            history: {
              gameType: "cricket",
              tableId: tableId,
              time: time,
              result: "",
              win: 0,
            },
            transactionHistory: {
              date: new Date(),
              amount: entryFee,
              type: "Entry Fee",
              gameType: "cricket",
            },
          },
          $inc: {
            credits: -entryFee,
            "cricketData.0.playCount": 1,
          },
          // $inc: {  } // Increment playCount by 1
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
              gameType: "cricket",
              tableId: tableId,
              time: time,
              result: "",
              win: 0,
            },
            transactionHistory: [
              {
                date: new Date(),
                amount: entryFee,
                type: "Entry Fee",
                gameType: "cricket",
              },
            ],
          },
          $inc: {
            realMoney: -remainingAmount,
            "cricketData.0.playCount": 1,
          },
          $set: {
            credits: 0,
          },
        },
        { new: true }
      );
    }
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

const getGroups = async function (req, res) {
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

    const table = await groupModel
      .findOne({ tableId: tableId, "group.UserId": UserId })
      .select({ group: 1, updatedPlayers: 1 })
      .lean();
    // console.log("groupAsper tableid====", table);

    if (!table) {
      return res.status(200).send({
        status: false,
        message: " This table is not present ",
      });
    }
    const usersName = table.group.map((items) => items.userName);
    const userId = table.group.map((items) => items.UserId);
    const usersIdInStr = userId.join();
    let usersNameInStr = usersName.join(" ");
    console.log(
      "usersNameInStr=======>",
      usersNameInStr,
      "=============>",
      usersIdInStr
    );
    let updatedPlayers = [];
    if (table.updatedPlayers && table.updatedPlayers.length !== 0) {
      updatedPlayers = table.updatedPlayers
        .filter((player) => player.isBot)
        .map(({ UserId, runWithWicket }) => ({
          UserId,
          runWithWicket: runWithWicket.join(),
        }));
    }

    return res.status(200).send({
      status: true,
      message: "Success",
      groupId: table._id,
      usersNameInStr,
      usersIdInStr,
      botsData: updatedPlayers,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//________________________________get players with tournamentTableId____________________________________

const getPlayers = async function (req, res) {
  try {
    let players = await tournamentModel
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
    console.log(players, "==============players in mirc api");
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

//___________________________get all groups as per tableId__________________

const allGroupAsPerTableId = async function (req, res) {
  try {
    let tableId = req.query.tableId;

    const getGroups = await groupModel.find({ tableId: tableId });

    if (getGroups.length === 0) {
      return res
        .status(200)
        .send({ status: false, message: "data not found as per this tableId" });
    }

    return res.status(200).json(getGroups);
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//_____________________change bot type of group_____________________

const updategroupsBotType = async function (req, res) {
  try {
    const { groupId, UserId, botType } = req.query;

    const updatedGroup = await groupModel.findOneAndUpdate(
      { _id: groupId, "group.UserId": UserId },
      {
        $set: {
          "group.$.botType": botType,
          "updatedPlayers.$.botType": botType,
        },
      },
      { new: true }
    );

    console.log(
      "____________________updatedGroup",
      updatedGroup,
      "____________________updatedGroup"
    );
    if (!updatedGroup) {
      return res
        .status(200)
        .send({ status: false, message: "Group or User not found" });
    }

    return res
      .status(200)
      .json({
        status: true,
        message: "Bot type updated successfully",
        group: updatedGroup,
      });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//_____________________________________totalPlayer and bot in table___________________________

const getTotalPlayerAndBot = async function (req, res) {
  try {
    let tableId = req.query.tableId;
    let bot = 0;
    let player = 0;
    let groupData = await groupModel
      .find({ tableId: tableId })
      .select({ totalPlayerInGrp: 1, totalBotInGrp: 1 });

    console.log(groupData, "_______groupData____");

    if (groupData.length === 0) {
      return res.status(200).send({
        status: false,
        message: " Data not present",
      });
    }
    let players = groupData.map((items) => (player += items.totalPlayerInGrp));
    // player += players[0]
    console.log(players, "players");

    let bots = groupData.map((items) => (bot += items.totalBotInGrp));
    // bot += bots[0]
    console.log(bots, "bots");

    let updateCricket = await tournamentModel.findByIdAndUpdate(
      { _id: tableId },
      { totalPlayersInTable: player, totalBotInTable: bot },
      { new: true }
    );
    console.log(updateCricket);

    let totalBAndP = {
      totalPlayersInTable: updateCricket.totalPlayersInTable,
      totalBotInTable: updateCricket.totalBotInTable,
      _id: updateCricket._id,
    };

    return res.status(200).send({
      status: true,
      message: "Success",
      data: totalBAndP,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//___________________get Time for next ball_______________
//___________________for table1________
let nextBallTimeForTable1 = 10;
let intervalIdForTable1 = null;
let intervalActiveForTable1 = false;

// Function to start the interval
function startIntervalForTable1() {
  if (!intervalActiveForTable1) {
    console.log("<======start interval===>");
    intervalActiveForTable1 = true;
    intervalIdForTable1 = setInterval(() => {
      if (nextBallTimeForTable1 > 0) {
        nextBallTimeForTable1--; // Decrement remaining time
        console.log("nextBallTimeForTable1===>", nextBallTimeForTable1);
      } else {
        console.log("<===stope interval====>");
        clearInterval(intervalIdForTable1); // Stop the interval
        nextBallTimeForTable1 = 10; // Reset to 10
        intervalActiveForTable1 = false; // Reset interval flag
      }
    }, 1000); // Run every second
  }
}
//_______________for table2___________
let nextBallTimeForTable2 = 10;
let intervalIdForTable2 = null;
let intervalActiveForTable2 = false;

// Function to start the interval
function startIntervalForTable2() {
  if (!intervalActiveForTable2) {
    console.log("<======start interval 2===>");
    intervalActiveForTable2 = true;
    intervalIdForTable2 = setInterval(() => {
      if (nextBallTimeForTable2 > 0) {
        nextBallTimeForTable2--;
        console.log("nextBallTimeForTable2===>", nextBallTimeForTable2);
      } else {
        console.log("<===stope interval====>");
        clearInterval(intervalIdForTable2);
        nextBallTimeForTable2 = 10;
        intervalActiveForTable2 = false;
      }
    }, 1000);
  }
}

//_____________for table 3___________________

let nextBallTimeForTable3 = 10;
let intervalIdForTable3 = null;
let intervalActiveForTable3 = false;

// Function to start the interval
function startIntervalForTable3() {
  if (!intervalActiveForTable3) {
    console.log("<======start interval 3===>");
    intervalActiveForTable3 = true;
    intervalIdForTable3 = setInterval(() => {
      if (nextBallTimeForTable3 > 0) {
        nextBallTimeForTable3--;
        console.log("nextBallTimeForTable3===>", nextBallTimeForTable3);
      } else {
        console.log("<===stope interval====>");
        clearInterval(intervalIdForTable3);
        nextBallTimeForTable3 = 10;
        intervalActiveForTable3 = false;
      }
    }, 1000);
  }
}

//____________________for table 4___________
let nextBallTimeForTable4 = 10;
let intervalIdForTable4 = null;
let intervalActiveForTable4 = false;

// Function to start the interval
function startIntervalForTable4() {
  if (!intervalActiveForTable4) {
    console.log("<======start interval 4===>");
    intervalActiveForTable4 = true;
    intervalIdForTable4 = setInterval(() => {
      if (nextBallTimeForTable4 > 0) {
        nextBallTimeForTable4--;
        console.log("nextBallTimeForTable4===>", nextBallTimeForTable4);
      } else {
        console.log("<===stope interval====>");
        clearInterval(intervalIdForTable4);
        nextBallTimeForTable4 = 10;
        intervalActiveForTable4 = false;
      }
    }, 1000);
  }
}
//___________________for table 5________________
let nextBallTimeForTable5 = 10;
let intervalIdForTable5 = null;
let intervalActiveForTable5 = false;

// Function to start the interval
function startIntervalForTable5() {
  if (!intervalActiveForTable5) {
    console.log("<======start interval 5===>");
    intervalActiveForTable5 = true;
    intervalIdForTable5 = setInterval(() => {
      if (nextBallTimeForTable5 > 0) {
        nextBallTimeForTable5--;
        console.log("nextBallTimeForTable5===>", nextBallTimeForTable5);
      } else {
        console.log("<===stope interval====>");
        clearInterval(intervalIdForTable5);
        nextBallTimeForTable5 = 10;
        intervalActiveForTable5 = false;
      }
    }, 1000); // Run every second
  }
}
//_____________________api for fetching ballcount__________

const getNextBallTimeAsPerTableId = async function (req, res) {
  try {
    const table = req.query.table;

    if (table == 1) {
      if (!intervalActiveForTable1) {
        console.log("<=====active interval for table 1====>");
        startIntervalForTable1();
      }
      console.log("ball for table 1=====", nextBallTimeForTable1);
      res.status(200).json({ nextBallTime: nextBallTimeForTable1 });
    } else if (table == 2) {
      if (!intervalActiveForTable2) {
        console.log("<=====active interval for table 2====>");
        startIntervalForTable2();
      }
      console.log("ball for table 2=====", nextBallTimeForTable2);
      res.status(200).json({ nextBallTime: nextBallTimeForTable2 });
    } else if (table == 3) {
      if (!intervalActiveForTable3) {
        console.log("<=====active interval for table 3====>");
        startIntervalForTable3();
      }
      console.log("ball for table 3=====", nextBallTimeForTable3);
      res.status(200).json({ nextBallTime: nextBallTimeForTable3 });
    } else if (table == 4) {
      if (!intervalActiveForTable4) {
        console.log("<=====active interval for table 4====>");
        startIntervalForTable4();
      }
      console.log("ball for table 4=====", nextBallTimeForTable4);
      res.status(200).json({ nextBallTime: nextBallTimeForTable4 });
    } else if (table == 5) {
      if (!intervalActiveForTable5) {
        console.log("<=====active interval for table 5====>");
        startIntervalForTable5();
      }
      console.log("ball for table 5=====", nextBallTimeForTable5);
      res.status(200).json({ nextBallTime: nextBallTimeForTable5 });
    } else {
      res.status(404).json({ message: "invalid table nuber" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  tournamentsByAdmin,
  createTournaments,
  updateTournament,
  getAllTables,
  getGroups,
  getPlayers,
  allGroupAsPerTableId,
  updategroupsBotType,
  getTotalPlayerAndBot,
  getNextBallTimeAsPerTableId,
};
