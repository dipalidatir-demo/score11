const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const cricketModel = require("../model/cricketModel");
const groupModel = require("../model/groupModel");
const { getPlayers } = require("./tournamentController");
const { log } = require("console");
const tournamentModel = require("../model/tournamentModel");
const { xorBy } = require("lodash");

//_______________________get All data of cricket for leaderBoard

const getAllCric = async function (req, res) {
  try {
    let data = req.query;

    const cricketData = await cricketModel.find(data).sort({ cricWins: -1 });

    if (data.length == 0) {
      return res
        .status(200)
        .send({ status: false, message: " no data is  found " });
    }
    return res.status(200).send({
      status: true,
      message: "Success",
      data: cricketData,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

// _______________________get cricket group by id data

const getCricByGroupId = async function (req, res) {
  try {
    let groupId = req.query.groupId;

    let cricket = await groupModel.findById({ _id: groupId });
    if (!cricket) {
      return res
        .status(200)
        .send({ status: false, message: "this groupId not found" });
    }

  if(cricket.isMatchOver === true){
    let resForWinners = {
      _id: cricket._id,
      createdTime: cricket.createdTime,
      tableId: cricket.tableId,
      updatedPlayers: cricket.updatedPlayers,
      ball: cricket.ball,
      start: cricket.start,
      currentBallTime: new Date(),
      nextBallTime: cricket.nextBallTime,
      ballSpeed: cricket.ballSpeed,
    };
    
    return res.status(200).json(resForWinners);   
  }
  if (cricket.nextBallTime - new Date() > 0) {
    if (cricket.updatedPlayers.length !== 0) {
      let cricket1 = {
        _id: cricket._id,
        createdTime: cricket.createdTime,
        tableId: cricket.tableId,
        updatedPlayers: cricket.updatedPlayers,
        ball: cricket.ball,
        start: cricket.start,
        currentBallTime: new Date(),
        nextBallTime: cricket.nextBallTime.toISOString(),
        ballSpeed: cricket.ballSpeed,
      };
      return res.status(200).json(cricket1);
    }
  } else {
    let cricket1 = {
      _id: cricket._id,
      createdTime: cricket.createdTime,
      tableId: cricket.tableId,
      updatedPlayers: cricket.updatedPlayers,
      ball: cricket.ball,
      start: cricket.start,
      currentBallTime: new Date(),
      nextBallTime: new Date(cricket.nextBallTime.getTime() + 1 * 7 * 1000).toISOString(),
      ballSpeed: cricket.ballSpeed,
    };
    return res.status(200).json(cricket1);
  }
  
  
    return res.status(200).json(cricket);
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

// _______________________get cricket group by id data for socket____________________

// const getCricByGroupIdUsingSocket = async function (req, res) {
//   try {
//     let groupId = req.query.groupId;
//     const UserId = req.query.UserId;
    
//     let cricket = await groupModel.findOneAndUpdate(
//       { _id: groupId, "updatedPlayers.UserId": UserId }, 
//       { $set: { "updatedPlayers.$.isBallThrow": true } },
//       { 
//         projection: {
//           'updatedPlayers.UserId': 1,
//           'updatedPlayers.run': 1,
//           'updatedPlayers.wicket': 1,
//           'updatedPlayers.isBallThrow': 1,
//           'ballSpeed': 1,
//           'isMatchOver': 1,
//           'nextBallTime': 1
//         },
//         new: true // Return the updated document
//       }
//     );

//     console.log("cricket using socket====>", cricket);
//     if (!cricket) {
//       return res.status(200).send({ status: false, message: "this groupId not found" });
//     }

//     // Calculate currentBallTime
//     let currentBallTime = Math.max(0, cricket.nextBallTime - new Date());

//     if (cricket.isMatchOver === true) {
//       let resForWinners = {
//         updatedPlayers: cricket.updatedPlayers,
//         currentBallTime: currentBallTime,
//         ballSpeed: cricket.ballSpeed,
//       };
//       return res.status(200).json(resForWinners);
//     }

//     if (currentBallTime > 0) {
//       if (cricket.updatedPlayers.length !== 0) {
//         let cricket1 = {
//           updatedPlayers: cricket.updatedPlayers,
//           currentBallTime: currentBallTime,
//           ballSpeed: cricket.ballSpeed,
//         };
//         return res.status(200).json(cricket1);
//       }
//     } else {
//       let cricket1 = {
//         updatedPlayers: cricket.updatedPlayers,
//         currentBallTime: 0,
//         ballSpeed: cricket.ballSpeed,
//       };
//       return res.status(200).json(cricket1);
//     }

//     return res.status(200).json(cricket);
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({
//       status: false,
//       error: err.message,
//     });
//   }
// };

// const getCricByGroupIdUsingSocket = async function (socket, req, res) {
//   try {
//     let groupId = req.groupId;
//     const UserId = req.UserId;

//     console.log("groupId====>",groupId,"======UserId=====>",UserId);

//     if(!groupId || !UserId){
//       return res.status(400).send({status:false, message:"Both UserId and groupId are required"});
//     }

//     let cricket = await groupModel.findOneAndUpdate(
//       { _id: groupId, "updatedPlayers.UserId": UserId }, 
//       { $set: { "updatedPlayers.$.isBallThrow": true } },
//       { 
//         projection: {
//           'updatedPlayers.UserId': 1,
//           'updatedPlayers.run': 1,
//           'updatedPlayers.wicket': 1,
//           'updatedPlayers.isBallThrow': 1,
//           'ballSpeed': 1,
//           'isMatchOver': 1,
//           'nextBallTime': 1
//         },
//         new: true // Return the updated document
//       }
//     );

//     console.log("cricket using socket====>", cricket);
//     if (!cricket) {
//       socket.emit('cricketData', { status: false, message: "this groupId not found" });
//       return;
//     }

//     // Calculate currentBallTime
//     let currentBallTime = Math.max(0, cricket.nextBallTime - new Date());

//     if (cricket.isMatchOver === true) {
//       let resForWinners = {
//         updatedPlayers: cricket.updatedPlayers,
//         currentBallTime: currentBallTime,
//         ballSpeed: cricket.ballSpeed,
//       };
//       socket.emit('cricketData', resForWinners);
//       return;
//     }

//     if (currentBallTime > 0) {
//       if (cricket.updatedPlayers.length !== 0) {
//         let cricket1 = {
//           updatedPlayers: cricket.updatedPlayers,
//           currentBallTime: currentBallTime,
//           ballSpeed: cricket.ballSpeed,
//         };
//         socket.emit('cricketData', cricket1);
//         return;
//       }
//     } else {
//       let cricket1 = {
//         updatedPlayers: cricket.updatedPlayers,
//         currentBallTime: 0,
//         ballSpeed: cricket.ballSpeed,
//       };
//       socket.emit('cricketData', cricket1);
//       return;
//     }

//     socket.emit('cricketData', cricket);
//   } catch (err) {
//     console.log(err);
//     socket.emit('cricketDataError', { status: false, error: err.message });
//   }
// };


//____________________________update table__________________________

const updateCric = async function (req, res) {
  try {
    let updateData = req.query;
    let UserId = req.query.UserId;
    let groupId = req.query.groupId;
    let currentTime = Date.now();

    //____________find the document and update the run for the specified user
    const groupExist = await groupModel
      .findOne({ _id: groupId })
      .select({ group: 0 });

    if (!groupExist) {
      console.error("No matching document found");
      return res.status(200).send({
        status: false,
        message: "No matching document found",
        data: null,
      });
    }
    let group = groupExist.updatedPlayers;
    const user = group.find((user) => user.UserId.includes(UserId));
    if (!user) {
      return res.status(200).send({
        status: true,
        message: "this user is not present in this group",
      });
    }
    let storedBallTime = groupExist.currentBallTime;
    let ballSpeed = groupExist.ballSpeed;
    console.log(storedBallTime, "time of ball");

    const index = groupExist.updatedPlayers.findIndex(
      (player) => player.UserId === UserId
    );

    if (index === -1) {
      console.error("User not found in the updatedPlayers array");
      return res.status(200).send({
        status: false,
        message: "User not found in the updatedPlayers array",
        data: null,
      });
    }

    //______________________check the time diff and calculate run per player

    let isRunUpdated = groupExist.updatedPlayers[index].isRunUpdated;
    let updatedRun = groupExist.updatedPlayers[index].run;
    let ballCount = groupExist.ball;
    let timeDiff = Math.abs(Math.floor((currentTime - storedBallTime) / 1000));

    console.log("isRunUpdated>>>>>>>>>>>>>>", isRunUpdated);
    console.log("timeDiff>>>>>>>>>>>>>>>>>>>", timeDiff);
    console.log("ballSpeed++++++++++++++++++", ballSpeed);
    console.log("updatedRun>>>>>>>>>>>>>>>>>>", updatedRun);
    if (isRunUpdated === false) {
      let currentRun = 1;
    
      // Calculate the adjusted timeDiff by introducing some randomness
      const adjustedTimeDiff = timeDiff + Math.floor(Math.random() * 5);
    
      // Logic to reduce the likelihood of 6 runs
      const overNumber = Math.floor(updatedRun / 6);
      const runsInOver = updatedRun % 6;
      let desiredSixes = overNumber >= 2 && overNumber <= 3 ? 1 : 2; // Allow 2 sixes in normal overs
    
      // Introduce a randomness factor to vary the frequency of sixes in each match
      const randomnessFactor = Math.random(); // Random value between 0 and 1
      if (randomnessFactor < 0.2) {
        // Reduce the desired sixes for this match if randomness factor is less than 0.2
        desiredSixes = 1;
      }
    
      if (runsInOver < 6 && desiredSixes > 0) {
        // Introduce randomness for sixes
        if (Math.random() < 0.2) {
          currentRun = 6;
          desiredSixes--;
        } else {
          // Introduce randomness for other run types
          const random = Math.random();
          if (random < 0.2) {
            currentRun = 4; // 20% chance of a four
          } else if (random < 0.4) {
            currentRun = 2; // 20% chance of a two
          } else if (random < 0.6) {
            currentRun = 1; // 20% chance of a one
          } else if (random < 0.8) {
            currentRun = 3; // 20% chance of a three
          } else {
            console.log("You just missed the ball");
          }
        }
      }
    
      console.log("run>>>>>>>>>>>>", currentRun);
      let playersUpdate = groupExist.updatedPlayers.find(
        (players) => players.UserId === UserId
      );
    
      updatedRun = updatedRun + currentRun;
      playersUpdate.hit = true;
      playersUpdate.isRunUpdated = true;
      playersUpdate.run = updatedRun;
    
      let updatedGroupFstHit = await groupModel.findOneAndUpdate(
        { _id: groupId, updatedPlayers: { $elemMatch: { UserId: UserId } } },
        { $set: { "updatedPlayers.$": playersUpdate } },
        { new: true }
      );
      //let wicket = groupExist.updatedPlayers[index].wicket;

      // if (ball === 0 && isWicketUpdated === true && wicket > 0) {
      //   groupExist.updatedPlayers[index].wicket -= 1;
      //   updatedGroupFstHit = await groupExist.save();
      // }

      let responseForFstHit = {
        _id: updatedGroupFstHit._id,
        createdTime: updatedGroupFstHit.createdTime,
        tableId: updatedGroupFstHit.tableId,
        updatedPlayers: updatedGroupFstHit.updatedPlayers,
        ball: updatedGroupFstHit.ball,
        start: updatedGroupFstHit.start,
        currentBallTime: new Date(),
        nextBallTime: updatedGroupFstHit.nextBallTime,
        ballSpeed: updatedGroupFstHit.ballSpeed,
        CurrentRun: currentRun,
      };

      console.log(
        "updatedRunwhen hit >>>>>>>>>>>>>>>>>>",
        updatedGroupFstHit.updatedPlayers[0].run
      );

      //___________________send the response when hit the api 1st time
      return res.status(200).json(responseForFstHit);
    }
    if (isRunUpdated === true) {
      let response = {
        _id: groupExist._id,
        createdTime: groupExist.createdTime,
        tableId: groupExist.tableId,
        updatedPlayers: groupExist.updatedPlayers,
        ball: groupExist.ball,
        start: groupExist.start,
        currentBallTime: new Date(),
        nextBallTime: groupExist.nextBallTime,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
        ballSpeed: groupExist.ballSpeed,
      };

      return res.status(200).json(response);
    }

  } catch (err) {
    console.log(err);
    return res.status(500).send({status:false,message:err.message})
  }
};


//__________________________declare the winner_______________________________(not used in this project)

const winTheGame = async function (req, res) {
  try {
    const groupId = req.query.groupId;

    /* lean() method on the groupModel.findById() query to return a plain JavaScript object instead of a Mongoose document.
     This can improve performance by avoiding the overhead of Mongoose document instantiation.*/

    const checkGroup = await groupModel.findById(groupId).lean();

    if (!checkGroup) {
      return res.status(200).send({
        status: false,
        message: "this group is not present in DB",
      });
    }

    let tableId = checkGroup.tableId;

    const checkTable = await tournamentModel.findById(tableId).lean();
    if (!checkTable) {
      return res.status(200).send({
        status: false,
        message: "this table is not present in DB",
      });
    }


    // const players = checkGroup.updatedPlayers.sort((a, b) => b.run - a.run);
    // console.log(players, "players>>>>>>>>>>>>>>>>");
    
    const players = checkGroup.updatedPlayers.sort((a, b) => {
      if (b.run !== a.run) {
          return b.run - a.run; // sort by runs in descending order
      } else {
          return a.wicket - b.wicket; // sort by wickets in ascending order for players with the same runs
      }
  });
  
  console.log(players, "players>>>>>>>>>>>>>>>>");
  
    const winner = players[0];
    //___________filter the players's run if these are equal
    const equalRun = players.filter((a) => a.run === winner.run);

    //__________find the player with the lowest wickets among those with equal runs.
    const winner2 = equalRun.reduce((a, b) => (b.wicket < a.wicket ? b : a));

    const finalWinner = winner2.run > winner.run ? winner2 : winner;
    //console.log(finalWinner);

    //_________________winner prize as per prize amount

    
    let totalEntryFee;

    totalEntryFee = checkTable.entryFee*5

    const prizes = checkTable.prizeAmount;
    players[0].prize = totalEntryFee * 0.35;
    players[1].prize = totalEntryFee * 0.25;
    players[2].prize = totalEntryFee * 0.15;
    players[3].prize = totalEntryFee * 0.05;

    const result = await groupModel.findByIdAndUpdate(
      { _id: groupId },
      { $set: { updatedPlayers: players } },
      { new: true }
    );

    //console.log(result);

    return res.status(200).json({ updatedPlayers: result.updatedPlayers });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};


//___________________________get all groups ______________________

const getAllGroups = async function(req,res){
  try{

    const getGroups = await groupModel.find().sort({createdTime:-1});
    if(getGroups.length === 0){
      return res.status(200).send({status:false, message:"data not found"});
    }
return res.status(200).json(getGroups);
  }catch(error){
    return res.status(500).send({status:false, message:error.message})
  }
}
module.exports = {
  updateCric,
  getAllCric,
  getCricByGroupId,
  winTheGame,
  getAllGroups,
  // getCricByGroupIdUsingSocket
};