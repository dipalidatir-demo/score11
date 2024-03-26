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

    if (cricket.isMatchOver === true) {
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
        nextBallTime: new Date(
          cricket.nextBallTime.getTime() + 1 * 7 * 1000
        ).toISOString(),
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

//____________________________update table__________________________

const updateCric = async function (req, res) {
  try {
    let { UserId, groupId, run, wicket, ball } = req.query;
    console.log("req.query============>",req.query);
    if (!UserId || !groupId || !run || !wicket || !ball) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }
    run = parseInt(run);
    wicket = parseInt(wicket);
    ball = parseInt(ball);

    if (run > 6 || run < 0 || run === 5) {
      return res.status(400).json({
        status: false,
        message: "Invalid Run",
      });
    }

    const groupExist = await groupModel.findById(groupId);

    if (!groupExist) {
      return res.status(404).json({
        status: false,
        message: "Group not found",
      });
    }

    if (groupExist.isMatchOver) {
      return res.status(400).json({
        status: false,
        message: "The match is over",
        currentTime: new Date(),
        nextBallTime: groupExist.nextBallTime,
        remainingBalls: groupExist.ball,
      });
    }

    if (groupExist.ball !== ball) {
      return res.status(400).json({
        status: false,
        message: "Ball count mismatch",
        currentTime: new Date(),
        nextBallTime: groupExist.nextBallTime,
        remainingBalls: groupExist.ball,
      });
    }

    const playerIndex = groupExist.updatedPlayers.findIndex(player => player.UserId === UserId);

    if (playerIndex === -1) {
      return res.status(404).json({
        status: false,
        message: "Player not found in the group",
      });
    }

    if (groupExist.updatedPlayers[playerIndex].isRunUpdated) {
      return res.status(200).json({
        status: true,
        message: "Run already updated",
        currentTime: new Date(),
        nextBallTime: groupExist.nextBallTime,
        remainingBalls: groupExist.ball,
      });
    }

    groupExist.updatedPlayers[playerIndex].hit = true;
    groupExist.updatedPlayers[playerIndex].isRunUpdated = true;
    groupExist.updatedPlayers[playerIndex].run += run;
    groupExist.updatedPlayers[playerIndex].wicket = wicket;
    if(run === 0){
      groupExist.updatedPlayers[playerIndex].runWithWicket.push("W");
    }else{
      groupExist.updatedPlayers[playerIndex].runWithWicket.push(run);
    }
    console.log( "runwithwicket array before updatein====>",groupExist.updatedPlayers[playerIndex].runWithWicket);
    const updatedGroup = await groupExist.save();
    console.log( "runwithwicket array after updatein====>",updatedGroup.updatedPlayers[playerIndex].runWithWicket);
    return res.status(200).json({
      status: true,
      message: "Run and wicket updated successfully",
      currentTime: new Date(),
      nextBallTime: updatedGroup.nextBallTime,
      remainingBalls: updatedGroup.ball,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
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

    totalEntryFee = checkTable.entryFee * 5;

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

const getAllGroups = async function (req, res) {
  try {
    const getGroups = await groupModel.find().sort({ createdTime: -1 });
    if (getGroups.length === 0) {
      return res.status(200).send({ status: false, message: "data not found" });
    }
    return res.status(200).json(getGroups);
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//_____________________get game end time_________________
const getGameEndTime = async function (req, res) {
  try {
    const groupId = req.query.groupId;
    if (!groupId) {
      return res
        .status(200)
        .send({ status: false, message: "Group id is required" });
    }
    const checkGorup = await groupModel
      .findById({ _id: groupId })
      .select({ nextBallTime: 1, ball: 1, start: 1 });

    if (!checkGorup) {
      return res
        .status(200)
        .send({ status: false, message: "Group not found" });
    }
    if (!checkGorup.start) {
      // console.log("time for nextball is start is false===>",checkGorup.nextBallTime - Date.now());
      console.log("start or not ====>", checkGorup.start);
      const remainingTime = Math.max(0, checkGorup.nextBallTime - Date.now());
      if (remainingTime == 0) {
        return res
          .status(200)
          .send({
            status: true,
            currentTime: new Date(),
            nextBallTime: checkGorup.nextBallTime,
            RemainingBall: checkGorup.ball,
          });
      } else {
        return res
          .status(200)
          .json({ status: true, matchStartTime: remainingTime });
      }
    }

    return res
      .status(200)
      .send({
        status: true,
        currentTime: new Date(),
        nextBallTime: checkGorup.nextBallTime,
        RemainingBall: checkGorup.ball,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};
//__________________fetch ball count ________________

const getPlayersData = async function (req, res) {
  try {
    let groupId = req.query.groupId;

    if (!groupId) {
      return res.status(400).send({
        status: false,
        message: "groupId is required",
      });
    }

    // Find the document and update the run for the specified user
    const groupExist = await groupModel
      .findOne({ _id: groupId })
      .select({ updatedPlayers: 1, start: 1, ball: 1 })
      .lean(); // Convert to plain JavaScript object

    if (!groupExist) {
      console.error("No matching document found");
      return res.status(404).send({
        status: false,
        message: "No matching document found",
        data: null,
      });
    }
    const updatedPlayers = groupExist.updatedPlayers.map((player) => {
      const {
        userName,
        botType,
        isBallThrow,
        isBot,
        isRunUpdated,
        hit,
        ...rest
      } = player;
      return rest;
    });

    let response = {
      _id: groupExist._id,
      updatedPlayers: updatedPlayers,
      start: groupExist.start,
      RemainingBall: groupExist.ball,
    };
    console.log("response====>", response);
    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};
module.exports = {
  updateCric,
  getAllCric,
  getCricByGroupId,
  winTheGame,
  getAllGroups,
  getGameEndTime,
  getPlayersData,
};
