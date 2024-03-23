const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const tournamentModel = require("../model/tournamentModel");
const cricketModel = require("../model/cricketModel");
const _ = require("lodash");
const fakeUsers = require("../controller/dummyUsers");
const { find } = require("lodash");
const groupModel = require("../model/groupModel");
const snkTournamentModel = require("../model/snkTournamentModel");
const groupModelForSnakeLadder = require("../model/groupModelForSnakeLadder");
const rocketTournamentModel = require("../model/rocketTournamentModel");
delete require.cache[require.resolve("../controller/rocketController")];
const rktGroupModel = require("../controller/rocketController");
const ticTacToeTournamentModel = require("../model/ticTacToeTournamentModel");
const ticTacToeGroupModel = require("../model/ticTacToeGroupModel");
const Decimal = require("decimal.js");
const profitLossModel = require("../model/profitLossModel");
const botModel = require("../model/botModel");
const moment = require("moment");
const cron = require("node-cron");




//_______________________________for TicTacToe_____________________________________________

const createGroupForticTacToe = async function (tableId) {
  console.log(tableId, "============create gorup in tictactoe");
  if (tableId != undefined) {
    let table = await ticTacToeTournamentModel.findOne({ _id: tableId });

    if (table != undefined || table != null) {
      let players = table.players;
      let users = table.Users;

      if (users.length !== 0) {
        users = users.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        });
        //________________________________import dummyusers and add as per need to complete groups

        let dummyUsers = fakeUsers.fakeUsers;
        dummyUsers = dummyUsers.map((user) => {
          return {
            UserId: user.UserId,
            userName: user.userName,
            isBot: user.isBot,
          };
        });
        const groups = _.chunk(players, 2);

        let completePlayers = [
          ...users,
          ...dummyUsers.slice(0, 2 - (users.length % 2)),
        ];

        let completeGroups = _.chunk(completePlayers, 2);

        for (let i = 0; i < completeGroups.length; i++) {
          let createGrp = await ticTacToeGroupModel.create({
            group: completeGroups[i],
            tableId: tableId,
          });
          let grpId = createGrp._id;
          let group = createGrp.group;
          console.log(createGrp);
          // setTimeout(function () {
          startMatchForticTacToe(grpId, group);
          //  }, 5000);
        }
      }
    }
  }
};

async function startMatchForticTacToe(grpId, group) {
  console.log("grpid>>>>>>>>>>>", grpId);
  console.log("groups>>>>>>>>>>>>>>>>>", group);
  if (grpId !== undefined) {
    const result = group.map((name) => ({
      UserId: name.UserId,
      userName: name.userName,
      isBot: name.isBot,
      positions: [],
      turn: name.turn,
      movement: "",
    }));
    console.log("result", result);

    let totalBot = result.filter((players) => players.isBot === true);
    totalBot = totalBot.length;
    let totalRealPlayres = result.filter((players) => players.isBot === false);
    totalRealPlayres = totalRealPlayres.length;

    let matchData = await ticTacToeGroupModel.findOneAndUpdate(
      { _id: grpId },
      {
        updatedPlayers: result,
        $set: {
          totalBotInGrp: totalBot,
          totalPlayerInGrp: totalRealPlayres,
          start: true,
          gameEndTime: Date.now() + 3 * 60 * 1000,
        },
      },
      { new: true, setDefaultsOnInsert: true }
    );

    await new Promise((resolve) => {
      setTimeout(async function () {
        let updatedPlayers = matchData.updatedPlayers;
        let currentPlayerIndex = Math.floor(
          Math.random() * updatedPlayers.length
        );
        matchData.updatedPlayers[currentPlayerIndex].turn = true;
        matchData.lastHitTime = new Date();
        matchData.isGameStart = 1;
        matchData.currentUserId = updatedPlayers[currentPlayerIndex].UserId;

        const updatedGroupFst = await matchData.save();

        resolve();
      }, 6000);
    });

    // Rest of your code here...
  }
}

module.exports = {
  
  createGroupForticTacToe,
 
};
