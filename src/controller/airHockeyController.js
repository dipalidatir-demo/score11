const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const airHockyTrnmtModel = require("../model/airHocTrnmtModel");
const airHockeyGroupModel = require("../model/airHocGrpModel");
const moment = require("moment");
const cron = require("node-cron");
// In rocketController.js
// delete require.cache[require.resolve("../reusableCodes/rocktReuCode")];
const {
  updateBotPoints,
  createGroupForSnakeLadder,
} = require("../reusableCodes/snkReus");
const { declareWinner } = require("../reusableCodes/airHocReus");

//____________________________________create snakeladder tournaments by admin___________
//---------------------using node crone---------------------------------
const airHockeyTablesCreatedByAdmin = async function (req, res) {
  try {
    let { entryFee, maxTime, maxPlayers, endTime, date, time } = req.body;

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

          let tableByAdmin1 = await airHockyTrnmtModel.create(req.body);
          let tableId1 = tableByAdmin1._id;

          console.log("AirHockey Tournament created successfully!==", tableId1);
          if (tableId1) {
            // Schedule the createGroupByAdmin function after maxTime
            console.log("calling the setTimeout function");
            setTimeout(function () {
              console.log();
              createGroupForSnakeLadder(tableId1,'AirHockey');
              console.log(
                tableByAdmin1,
                "==========table for rkt after setTimeOut===",
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

//______________________________________________get all data of SnakeLadder tournaments______________________________

const getAllAirHockey = async function (req, res) {
  try {
    let UserId = req.query.UserId;
    let currentTime = new Date();

    //______________only fetch that table which timing is running

    const data = await airHockyTrnmtModel
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
    console.log("data=======>", data);
    //__________fetch dataas per user id (it shows user joined in this table now)

    let userData = await airHockyTrnmtModel.aggregate([
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
    //   console.log(userData, "++++++++++++++++++++");
    if (userData.length > 0) {
      let tableId = userData.map((items) => items._id);
      console.log(tableId, "------------");
      let endTime = userData.map((items) => items.endTime);

      //______________________________check the match is started or not

      let gameStatus = [];

      for (let id = 0; id < tableId.length; id++) {
        let status = await airHockeyGroupModel.findOne({
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

const updateAirHockeyTournaments = async function (req, res) {
  try {
    let tableId = req.query.tableId;
    let UserId = req.query.UserId;
    let updateData = req.query;
    let { status } = updateData;
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

    let existTable = await airHockyTrnmtModel.findById({ _id: tableId });
    if (!existTable) {
      return res.status(200).send({
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
      return res.status(200).send({ status: false, message: " Full " });
    }

    //________________________________find user,s Name _____________________________________

    let userExist = await userModel.findOne({
      UserId: UserId,
      isDeleted: false,
    });
    if (!userExist) {
      return res.status(200).send({
        status: false,
        message: "user not found",
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

    let userData = await airHockyTrnmtModel.aggregate([
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

    // console.log("userData======>",userData);

    if (userData.length !== 0) {
      for (let i = 0; i < userData.length; i++) {
        let time = userData[i].endTime;
        console.log("time=======>", time);
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

    const tableUpdate = await airHockyTrnmtModel
      .findByIdAndUpdate(
        { _id: tableId },
        {
          $inc: { players: 1 },
          $push: {
            Users: {
              UserId: UserId,
              userName: userName,
              token: token,
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
              gameType: "airHockey",
              tableId: tableId,
              time: time,
              result: "",
              win: 0,
              entry:entryFee
            },
            transactionHistory: {
              date: new Date(),
              amount: entryFee,
              type: "Entry Fee",
              gameType: "airHockey",
            },
          },
          $inc: {
            credits: -entryFee,
            "airHockeyData.0.playCount": 1, // Increment playCount by 1
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
              gameType: "airHockey",
              tableId: tableId,
              time: time,
              result: "",
              win: 0,
              entry:entryFee
            },
            transactionHistory: {
              date: new Date(),
              amount: entryFee,
              type: "Entry Fee",
              gameType: "airHockey",
            },
          },
          $inc: {
            realMoney: -remainingAmount,
            "airHockeyData.0.playCount": 1, // Increment playCount by 1
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
    console.log(err);
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//__________________________________get groups per players and tableId ____________________________________________
const getGroupsByUserForAirHoc = async function (req, res) {
  try {
    let tableId = req.query.tableId;
    let UserId = req.query.UserId;
    console.log("input data=====>", tableId, "====>", UserId);
    if (!tableId || !UserId) {
      return res.status(200).send({
        status: false,
        message: " Please provide both tableId and UserId ",
      });
    }
    // let userExist = await userModel.findOne({ UserId: UserId });

    // if (userExist == null) {
    //   return res.status(200).send({
    //     status: false,
    //     message: " User not found ",
    //   });
    // }
    // let userName = userExist.userName;

    const table = await airHockeyGroupModel
      .findOne({ tableId: tableId, "group.UserId": UserId })
      .select({ group: 1, updatedPlayers: 1 })
      .lean();
    // console.log("table>>>>>>>>>>>>>>", table);

    if (!table) {
      return res.status(200).send({
        status: false,
        message: " This table is not present ",
      });
    }

    const usersName = table.group.map((items) => items.userName);
    const userId = table.group.map((items) => items.UserId);
    const usersIdInStr = userId.join(" ");
    let usersNameInStr = usersName.join(" ");
    const botData = table.updatedPlayers.find((player) => player.isBot);
    // console.log("botData=====>",botData);
    if (botData) {
      return res.status(200).send({
        status: true,
        message: "Success",
        groupId: table._id,
        botData: botData.UserId,
        usersNameInStr,
        usersIdInStr,
      });
    }
    return res.status(200).send({
      status: true,
      message: "Success",
      groupId: table._id,
      botData: null,
      usersNameInStr,
      usersIdInStr,
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
const getAirHocByGroupId = async function (req, res) {
  try {
    let groupId = req.query.groupId;
     console.log("inputgroupId===>",groupId);
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(200)
        .send({ status: false, message: "invalid groupId" });
    }
    let airHockey = await airHockeyGroupModel
      .findById({ _id: groupId })
      .select({ group: 0 })
      .lean();

    if (!airHockey) {
      return res
        .status(200)
        .send({ status: false, message: "this groupId not found" });
    }

    let timeDiff = airHockey.gameEndTime - new Date();
    console.log(timeDiff, "endtime of a group==========");
    let crntPlayer = airHockey.updatedPlayers.find(
      (players) => players.turn === true
    );

    const updatedPlayersForRes = airHockey.updatedPlayers.map(
      ({ UserId, points, userName }) => ({
        UserId,
        points,
        userName
      })
    );

    //_________________________winner declare_____________

    if (airHockey.isGameOver) {
      const DataAftrGameOver = airHockey.updatedPlayers.map(
        ({ UserId, points, prize, userName }) => ({
          UserId,
          userName,
          points,
          prize,
        })
      );
      let result = {
        message: "game is over",
        currentTime: new Date(),
        updatedPlayers: DataAftrGameOver,
        isGameOver: airHockey.isGameOver,
        gameEndTime: airHockey.gameEndTime,
      };
      console.log(result.updatedPlayers, "when winner is declared");
      return res.status(200).json(result);
    }

    //___________Check if it's time to switch turn to next user

    if (
      crntPlayer === undefined ||
      crntPlayer === null ||
      !crntPlayer ||
      airHockey.isGameStart === 0
    ) {
      let result = {
        currentTime: new Date(),
        updatedPlayers: updatedPlayersForRes,
        isGameOver: airHockey.isGameOver,
        gameEndTime: airHockey.gameEndTime,
      };
      console.log("Wait for the turn");
      return res.status(200).json(result);
    } else {
      let result = {
        currentTime: new Date(),
        updatedPlayers: updatedPlayersForRes,
        isGameOver: airHockey.isGameOver,
        gameEndTime: airHockey.gameEndTime,
      };
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

const updateAirHocPointOfUser = async function (req, res) {
  try {
    let { UserId, groupId, points} = req.query;

    if (!UserId || !groupId) {
      return res.status(200).send({
        status: false,
        message: "please provide groupId, UserId and points",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(200)
        .send({ status: false, message: "invalid groupId" });
    }

    let groupExist = await airHockeyGroupModel.findById({
      _id: groupId,
      "updatedPlayers.UserId": UserId,
    }).select({group:0});

    if (!groupExist) {
      return res
        .status(200)
        .send({ status: false, message: "groupId is not present" });
    }

    if (groupExist.isGameOver) {
      const winnerlayersForRes = groupExist.updatedPlayers.map(
        ({ UserId, points, prize, userName }) => ({
          UserId,
          points,
          prize,
          userName
        })
      );
      let result = {
        status: false,
        messge: "Game is Over",
        currentTime: new Date(),
        updatedPlayers: winnerlayersForRes,
        isGameOver: groupExist.isGameOver,
        gameEndTime: groupExist.gameEndTime,
      };
      console.log("response when game is over=====>");
      return res.status(200).json(result);
    }
    let maxPoints = groupExist.updatedPlayers.find(
      (players) => players.points === 3
    );
    if (maxPoints) {
      const resultDeclared = await declareWinner(groupExist, "AirHockey");
      const updatedPlayersForRes = resultDeclared.updatedPlayers.map(
        ({ UserId, points, prize, userName }) => ({
          UserId,
          points,
          prize,
          userName
        })
      );
      let result = {
        message: "Game is Over!",
        currentTime: new Date(),
        updatedPlayers: updatedPlayersForRes,
        isGameOver: resultDeclared.isGameOver,
        gameEndTime: resultDeclared.gameEndTime,
      };
      console.log("response when user point is 3=====>");
      return res.status(200).json(result);
    }
   

    const updatedGroup = await airHockeyGroupModel.findOneAndUpdate(
      {
        _id: groupId,
        isGameOver: false,
        updatedPlayers: {
          $elemMatch: {
            UserId: UserId,
          },
        },
      },
      {
        $set: {"updatedPlayers.$.points": parseInt(points)}
      },
      { new: true }
    );

    if(!updatedGroup){
      return res
      .status(200)
      .send({ status: false, message: "No matching document found" });
    }
    const maxPoibtsAfterUpdate = updatedGroup.updatedPlayers.find(
      (players) => players.points === 3
    );
    if (maxPoibtsAfterUpdate) {
      const resultDeclared = await declareWinner(updatedGroup, "AirHockey");
      console.log("resultDeclared======>", resultDeclared);
      const updatedPlayersForRes = resultDeclared.updatedPlayers.map(
        ({ UserId, points, prize, userName}) => ({
          UserId,
          points,
          prize,
          userName
        })
      );
      let result = {
        message:"Game is Over!",
        currentTime: new Date(),
        updatedPlayers: updatedPlayersForRes,
        isGameOver: resultDeclared.isGameOver,
        gameEndTime: resultDeclared.gameEndTime,
      };
      console.log("response when user point is 3=====>");
      return res.status(200).json(result);
    }

    const updatedPlayersForRes = updatedGroup.updatedPlayers.map(
      ({ UserId, points, userName }) => ({
        UserId,
        points,
        userName
      })
    );
    let result = {
      currentTime: new Date(),
      updatedPlayers: updatedPlayersForRes,
      isGameOver: updatedGroup.isGameOver,
      gameEndTime: updatedGroup.gameEndTime,
    };
    console.log("response after tab the dice for bot=====>");
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//___________________micro api for getting players__________________

const getPlayersOfAirHoc = async function (req, res) {
  try {
    let players = await airHockyTrnmtModel
      .find({ endTime: { $gt: new Date() } })
      .sort({ maxTime: 1 })
      .select({ _id: 1, players: 1 });

    if (players.length === 0) {
      return res.status(200).send({
        status: false,
        message: " Data not present",
      });
    }

    // players.forEach((item) => {
    //   item.players = item.playerWithBot;
    //   console.log(
    //     item.players,
    //     "==========data.players in ma=======",
    //     item.playerWithBot
    //   );
    // });

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

const getAllGroupsOfAirHoc = async function (req, res) {
  try {
    let groupsData = await airHockeyGroupModel.find().sort({ createdTime: -1 });

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

//________________check player is online or off line___________________
const playerActive = async function (req, res) {
  try {
    let groupId = req.query.groupId;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(200)
        .send({ status: false, message: "invalid groupId" });
    }
    let airHockey = await airHockeyGroupModel
      .findOneAndUpdate({ _id: groupId, isGameOver:false },{$set: {lastHitTime: new Date()}},{new:true});

    if (!airHockey) {
      return res
        .status(200)
        .send({ status: false, message: "this groupId not found" });
    }

  return res.status(200).send({status:true, mesage:"successfully updated"});

  } catch (err) {
    console.log(err);
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

module.exports = {
  airHockeyTablesCreatedByAdmin,
  updateAirHockeyTournaments,
  getAllAirHockey,
  getGroupsByUserForAirHoc,
  getAirHocByGroupId,
  updateAirHocPointOfUser,
  getPlayersOfAirHoc,
  getAllGroupsOfAirHoc,
  playerActive
};
