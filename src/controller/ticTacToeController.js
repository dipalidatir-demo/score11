const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const ticTacToeModel = require("../model/ticTacToeModel");
const ticTacToeTournamentModel = require("../model/ticTacToeTournamentModel");
const ticTacToeGroupModel = require("../model/ticTacToeGroupModel");
const { createGroupForticTacToe, updateBotPosition } = require("../reusableCodes/reusablecode");
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
      maxTime,
      maxPlayers,
      endTime,
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

          let tableByAdmin1 = await ticTacToeTournamentModel.create(req.body);
          let tableId1 = tableByAdmin1._id;

          console.log("Rocket Tournament created successfully!==", tableId1);
          if (tableId1) {
            // Schedule the createGroupByAdmin function after maxTime
            console.log("calling the setTimeout function");
            setTimeout(function () {
              console.log();
              createGroupForticTacToe(tableId1,'TicTacToe');
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

//_________________________________________________createSnakeLadder tournaments____________________________________

const createTicTacToeTables = async function (req, res) {
  try {
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
    let tournamentTable1;
    let tournamentTable2;
    //_______________________create table1 with setinterval an end time___________
    let tableId1;
    async function createTournament1() {
      if (tableId1 != undefined) {
        createGroupForticTacToe(tableId1,'TicTacToe');
      }

      endTime = Date.now() + 1 * 60 * 1000;
      data1.endTime = req.query.endTime = endTime;

      tournamentTable1 = await ticTacToeTournamentModel.create(data1);
      tableId1 = tournamentTable1._id;
      console.log(tournamentTable1);
    }

    setInterval(createTournament1, 60000);

    createTournament1();

    //_______________________create table2 with setinterval an end time________________
    let tableId2;

    async function createTournament2() {
      if (tableId2 != undefined) {
        createGroupForticTacToe(tableId1,'TicTacToe');
      }

      endTime = Date.now() + 4 * 60 * 1000;
      data2.endTime = req.query.endTime = endTime;

      tournamentTable2 = await ticTacToeTournamentModel.create(data2);
      tableId2 = tournamentTable2._id;
      // console.log(tournamentTable2);
    }

    setInterval(createTournament2, 240000);
    createTournament2();

    return res.status(201).send({
      status: true,
      message: "Rocket tournament created Successfully"
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//______________________________________________get all data of SnakeLadder tournaments______________________________

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
console.log("data=======>",data);
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
//___________________________________________________update snakeLaddertournament_______________________________

const updateTicTacToeTournaments = async function (req, res) {
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

    let existTable = await ticTacToeTournamentModel.findById({ _id: tableId });
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
    let { userName, isBot, credits, realMoney,token } = userExist;
    credits = credits + parseInt(realMoney);
    if (credits < entryFee) {
      return res.status(200).send({
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

    // console.log("userData======>",userData);

    if (userData.length !== 0) {
      for (let i = 0; i < userData.length; i++) {
        let time = userData[i].endTime;
        console.log("time=======>",time);
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

    const tableUpdate = await ticTacToeTournamentModel
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
              gameType: "ticTacToe",
              tableId: tableId,
              time: time,
              result: "",
              win: 0,
            },
            transactionHistory: {
              date: new Date(),
              amount: entryFee,
              type: "Entry Fee",
              gameType: "ticTacToe",
            },
          },
          $inc: {
            credits: -entryFee,
            "ticTacToeData.0.playCount": 1, // Increment playCount by 1
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
              gameType: "ticTacToe",
              tableId: tableId,
              time: time,
              result: "",
              win: 0,
            },
            transactionHistory: {
              date: new Date(),
              amount: entryFee,
              type: "Entry Fee",
              gameType: "ticTacToe",
            },
          },
          $inc: {
            realMoney: -remainingAmount,
            "ticTacToeData.0.playCount": 1, // Increment playCount by 1
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
const getTicTacToeGroupsByUser = async function (req, res) {
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
    const table = await ticTacToeGroupModel.findOne({ tableId: tableId,"group.UserId": UserId })
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
    const botData = table.updatedPlayers.find(player => player.isBot);
    // console.log("botData=====>",botData);
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
const getGroupsOfTicTacToeAsPerGrpId = async function (req, res) {
  try {
    let groupId = req.query.groupId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(200)
        .send({ status: false, message: "invalid groupId" });
    }
    let ticTacToe = await ticTacToeGroupModel
      .findById({ _id: groupId })
      .select({ group: 0 })
      .lean();

    if (!ticTacToe) {
      return res
        .status(200)
        .send({ status: false, message: "this groupId not found" });
    }

    let timeDiff = ticTacToe.gameEndTime - new Date();
    console.log(timeDiff, "endtime of a group==========");
    let crntPlayer = ticTacToe.updatedPlayers.find(
      (players) => players.turn === true
    );

    const updatedPlayersForRes = ticTacToe.updatedPlayers.map(
      ({ UserId,userName, points,dicePoints,prevPoint }) => ({
        UserId,
        points,
        dicePoints,
        prevPoint,
        userName
      })
    );

    //_________________________winner declare_____________

    if (ticTacToe.isGameOver) {
      const DataAftrGameOver = ticTacToe.updatedPlayers.map(
        ({ UserId, points,dicePoints, prize, userName,prevPoint }) => ({
          UserId,
          userName,
          points,
          dicePoints,
          prize,
          prevPoint
        })
      );
      let result = {
        message:"game is over",
        currentTurn:ticTacToe.currentUserId,
        currentTime: new Date(),
        nextTurnTime: ticTacToe.nextTurnTime,
        updatedPlayers: DataAftrGameOver,
        isGameOver: ticTacToe.isGameOver,
        gameEndTime: ticTacToe.gameEndTime,
      };
      console.log(result.updatedPlayers, "when winner is declared");
      return res.status(200).json(result);
    }

    //___________Check if it's time to switch turn to next user

    if (
      crntPlayer === undefined ||
      crntPlayer === null ||
      !crntPlayer ||
      ticTacToe.isGameStart === 0
    ) {
      let result = {
        currentTurn: ticTacToe.currentUserId,
        currentTime: new Date(),
        nextTurnTime: ticTacToe.nextTurnTime,
        updatedPlayers: updatedPlayersForRes,
        isGameOver: ticTacToe.isGameOver,
        gameEndTime: ticTacToe.gameEndTime,
      };
      console.log("Wait for the turn");
      return res.status(200).json(result);
    } else {
      let result = {
        currentTurn: ticTacToe.currentUserId,
        currentTime: new Date(),
        nextTurnTime: ticTacToe.nextTurnTime,
        updatedPlayers: updatedPlayersForRes,
        isGameOver: ticTacToe.isGameOver,
        gameEndTime: ticTacToe.gameEndTime,
      };
      console.log("dicepoints and position of player");
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
//______________________update tic tac toe data by user __________________

const  makeMovenForPlayer = async function (req, res) {
  try{
    const {groupId, row, col, UserId} = req.query ;

    if(!groupId || !row || !col || !UserId){
      return res.status(200).send({status:false, message:"Please provide groupId, row, col, UserId"});
    }
  // Find the game group in the database
  const group = await ticTacToeGroupModel.findOne({_id:groupId, "updatedPlayers.UserId":UserId});

  if (!group) {
    throw new Error("Group not found");
  }

  // Check if it's the player's turn
  const currentPlayerIndex = group.updatedPlayers.findIndex(player => player.UserId === UserId && player.turn);
  if (currentPlayerIndex === -1) {
    throw new Error("It's not your turn");
  }
  const nextUserIndex = ( currentPlayerIndex + 1 ) % 2;
  const nextUserId = updatedPlayers[nextUserIndex].UserId;
  // Check if the move is valid
  if (row < 0 || row > 2 || col < 0 || col > 2 || group.board[row][col] !== '') {
    throw new Error("Invalid move");
  }

  // Update the game board
  group.board[row][col] = group.updatedPlayers[currentPlayerIndex].sign;
   
  // Check for a winner or draw
  const winner = checkWinner(group.board);
  if (winner) {
    const overGameforWinner = await declareWinner(ticTacToe,gameName, false);  
      const updatedPlayersForRes = overGameforWinner.updatedPlayers.map(
        ({ UserId, points, dicePoints, prevPoint }) => ({
          UserId,
          points,
          dicePoints,
          prevPoint
        })
      );
      let result = {
        message:"Game is Over !",
        currentTurn: overGameforWinner.currentUserId,
        currentTime: new Date(),
        nextTurnTime: overGameforWinner.nextTurnTime,
        updatedPlayers: updatedPlayersForRes,
        isGameOver: overGameforWinner.isGameOver,
        gameEndTime: overGameforWinner.gameEndTime,
      };
      console.log("response when winner declared====>");
      return res.status(200).json(result);
  } else if (isDraw(group.board)) {
    const overGame = await declareWinner(ticTacToe,gameName, false);  
    const updatedPlayersForRes = overGame.updatedPlayers.map(
      ({ UserId, points, dicePoints, prevPoint }) => ({
        UserId,
        points,
        dicePoints,
        prevPoint
      })
    );
    let result = {
      message:"Game is Over !",
      currentTurn: overGame.currentUserId,
      currentTime: new Date(),
      nextTurnTime: overGame.nextTurnTime,
      updatedPlayers: updatedPlayersForRes,
      isGameOver: overGame.isGameOver,
      gameEndTime: overGame.gameEndTime,
    };
    console.log("response when match is draw====>");
    return res.status(200).json(result);
  } else {
   group.updatedPlayers[currentPlayerIndex].turn = false;
   group.nextTurnTime = new Date( Date.now() + 12 * 1000 ); 
   group.currentUserId = group.updatedPlayers[nextUserIndex].UserId;
   group.updatedPlayers[nextUserIndex].turn = true;
   group.lastHitTime = new Date();
   // Save the updated game group
   const updatedData =  await group.save();
    // If it's the bot's turn, make a move for the bot
    let botPlayer = updatedData.updatedPlayers.find(
      ( player ) => player.isBot && player.UserId === nextUserId
    );
    if (botPlayer) {
      const updateDataForBot = updateBotPosition( botPlayer, updatedData, 'TicTacToe');
      const updatedPlayersForRes = updateDataForBot.updatedPlayers.map(
        ({ UserId, points, dicePoints, prevPoint }) => ({
          UserId,
          points,
          dicePoints,
          prevPoint
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
    }else{
      const updatedPlayersForRes = updatedData.updatedPlayers.map(
        ({ UserId, points, dicePoints, prevPoint }) => ({
          UserId,
          points,
          dicePoints,
          prevPoint
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
   
   
 
  }

  
}catch(error){
  console.log("error in update tictac toe===",error);
  return res.status(500).send({status:false, message:error.message});
}
}

//___________________micro api for getting players__________________

const getPlayersOfTicTacToe = async function (req, res) {
  try {
    let players = await ticTacToeTournamentModel
      .find({ endTime: { $gt: new Date() } })
      .sort({ maxTime: 1 })
      .select({ _id: 1, players: 1});

    if (players.length === 0) {
      return res.status(200).send({
        status: false,
        message: "Data not present",
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

const getAllGroupsOfTicTacToe = async function (req, res) {
  try {
    let groupsData = await ticTacToeGroupModel
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
  makeMovenForPlayer
};
