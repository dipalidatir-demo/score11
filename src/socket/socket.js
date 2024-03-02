// socket/socket.js

const socketIO = require("socket.io");
const userModel = require("../model/userModel");
const cricGroupModel = require("../model/groupModel");
const groupModelForSnakeLadder = require("../model/groupModelForSnakeLadder");
const cricketModel = require("../model/tournamentModel");
const snakeLadderModel = require("../model/snkTournamentModel");
const ticTacToeModel = require("../model/ticTacToeTournamentModel");
const cricketController = require("../controller/cricketController");

module.exports = (httpServer) => {
  const io = socketIO(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket.io connected:", socket.id);

    // Listen for "fetchUserData" event
    socket.on("fetchUserData", () => {
      emitUpdatedUserData(socket);
    });

    // Listen for "fetchCricGroupData" event
    socket.on("fetchCricGroupData", () => {
      emitUpdatedCricGroupData(socket);
    });

    // Listen for "fetchSnkGroupData" event
    socket.on("fetchSnkGroupData", () => {
      emitUpdatedSnkGroupData(socket);
    });

    // Listen for "fetchTournamentsData" event
    socket.on("fetchTournamentsData", () => {
      emitUpdatedTournamentsData(socket);
    });

    //Listen for "getCricByGroupIdInSocket" event
    socket.on("getCricByGroupIdInSocket", (req) => {
      console.log("getCricByGroupIdUsingSocket data=====>", req);
      getCricByGroupIdUsingSocket(socket, req);
    });

    // //listen for groupData
    // socket.on("getCricGroupDataInSocket", (req) => {
    //   console.log("getCricGroupDataUsingSocket data=====>", req);
    //   getCricGroupDataUsingSocket(socket,req);
    // })

    //------------ Listen for "getCricGroupDataInSocket" event----------------------------------
    socket.on("getCricGroupDataInSocket", async (req) => {
      try {
        const groupId = req.groupId;
        if (!groupId) {
          return socket.emit("cricketDataError", {
            status: false,
            message: "groupId is required",
          });
        }

        // Fetch initial data for the group
        const cricket = await cricGroupModel.findOne({ _id: groupId }).select({
          "updatedPlayers.UserId": 1,
          "updatedPlayers.run": 1,
          "updatedPlayers.wicket": 1,
          "updatedPlayers.isBallThrow": 1,
          ballSpeed: 1,
          isMatchOver: 1,
          nextBallTime: 1,
        });

        if (!cricket) {
          return socket.emit("cricketDataError", {
            status: false,
            message: "Group not found",
          });
        }
        console.log("response when api is hitted=====>",cricket);
        // Emit initial data to the client
        socket.emit("cricketData", cricket);

        // Create a change stream for the group collection
        const changeStream = cricGroupModel.watch({ _id: groupId });

        // Listen for change events
        changeStream.on("change", async (change) => {
          if (change.operationType === "update") {
            // Fetch updated data for the group
            const updatedCricket = await cricGroupModel
              .findOne({ _id: groupId })
              .select({
                "updatedPlayers.UserId": 1,
                "updatedPlayers.run": 1,
                "updatedPlayers.wicket": 1,
                "updatedPlayers.isBallThrow": 1,
                ballSpeed: 1,
                isMatchOver: 1,
                nextBallTime: 1,
              });
            if (updatedCricket) {
              console.log("response when changes occured=====>",cricket);
              // Emit updated data to the client
              socket.emit("cricketData", updatedCricket);
            }
          }
          // socket.emit('cricketData', cricket);
        });
      } catch (err) {
        console.error(err);
        socket.emit("cricketDataError", { status: false, error: err.message });
      }
    });

    // Emit updated user data to the client when a change occurs
    const emitUpdatedUserData = async (socket) => {
      try {
        const getUsers = await userModel
          .find({ isDeleted: false })
          .sort({ createdAt: -1 });

        if (getUsers.length === 0) {
          socket.emit("serverRespForUser", {
            status: false,
            message: "User not found",
          });
        } else {
          socket.emit("serverRespForUser", {
            status: true,
            message: "User data updated",
            data: getUsers,
          });
        }
      } catch (err) {
        socket.emit("serverRespForUser", {
          status: false,
          error: err.message,
        });
      }
    };

    // Emit updated cricket group data to the client when a change occurs
    const emitUpdatedCricGroupData = async (socket) => {
      try {
        const getGroups = await cricGroupModel.find().sort({ createdTime: -1 });
        if (getGroups.length === 0) {
          socket.emit("fetchCricketGroupData", {
            status: false,
            message: "Cricket Groups are not found",
          });
        } else {
          socket.emit("fetchCricketGroupData", {
            status: true,
            message: "Cricket Group data updated",
            data: getGroups,
          });
        }
      } catch (err) {
        socket.emit("fetchCricketGroupData", {
          status: false,
          error: err.message,
        });
      }
    };
    // Emit updated snakeLadder group data to the client when a change occurs
    const emitUpdatedSnkGroupData = async (socket) => {
      try {
        const getGroups = await groupModelForSnakeLadder
          .find()
          .sort({ createdTime: -1 });
        if (getGroups.length === 0) {
          socket.emit("fetchSnakeLadderGroupData", {
            status: false,
            message: "SnakeLadder Groups are not found",
          });
        } else {
          socket.emit("fetchSnakeLadderGroupData", {
            status: true,
            message: "SnakeLadder Group data updated",
            data: getGroups,
          });
        }
      } catch (err) {
        socket.emit("fetchSnakeLadderGroupData", {
          status: false,
          error: err.message,
        });
      }
    };
    // Emit updated all tournaments data to the client when a change occurs
    const emitUpdatedTournamentsData = async (socket) => {
      try {
        const cricketData = await cricketModel.aggregate([
          { $sort: { createdAt: -1, entryFee: 1 } },
          { $limit: 25 },
        ]);

        const snakeLadderData = await snakeLadderModel.aggregate([
          { $sort: { createdAt: -1, entryFee: 1 } },
          { $limit: 25 },
        ]);

        const ticTacToeData = await ticTacToeModel.aggregate([
          { $sort: { createdAt: -1, entryFee: 1 } },
          { $limit: 25 },
        ]);

        const allTournaments = [
          ...cricketData,
          ...snakeLadderData,
          ...ticTacToeData,
        ];

        if (allTournaments.length === 0) {
          socket.emit("fetchAllTournamentsData", {
            status: false,
            message: "Tournaments are not found",
          });
        } else {
          socket.emit("fetchAllTournamentsData", {
            status: true,
            message: "Tournament data updated",
            data: allTournaments,
          });
        }
      } catch (err) {
        socket.emit("fetchAllTournamentsData", {
          status: false,
          error: err.message,
        });
      }
    };

    //Emit Update cricket gorup with optimise response
    const getCricByGroupIdUsingSocket = async (socket, req, res) => {
      try {
        console.log("received req data from the client===>", req);
        let groupId = req.groupId;
        const UserId = req.UserId;

        console.log("groupId====>", groupId, "======UserId=====>", UserId);

        if (!groupId || !UserId) {
          return res
            .status(400)
            .send({
              status: false,
              message: "Both UserId and groupId are required",
            });
        }

        let cricket = await cricGroupModel.findOneAndUpdate(
          { _id: groupId, "updatedPlayers.UserId": UserId },
          { $set: { "updatedPlayers.$.isBallThrow": true } },
          {
            projection: {
              "updatedPlayers.UserId": 1,
              "updatedPlayers.run": 1,
              "updatedPlayers.wicket": 1,
              "updatedPlayers.isBallThrow": 1,
              ballSpeed: 1,
              isMatchOver: 1,
              nextBallTime: 1,
            },
            new: true, // Return the updated document
          }
        );

        console.log("cricket using socket====>", cricket);
        if (!cricket) {
          socket.emit("cricketData", {
            status: false,
            message: "this groupId not found",
          });
          return;
        }

        // Calculate currentBallTime
        let currentBallTime = Math.max(0, cricket.nextBallTime - new Date());

        if (cricket.isMatchOver === true) {
          let resForWinners = {
            updatedPlayers: cricket.updatedPlayers,
            currentBallTime: currentBallTime,
            ballSpeed: cricket.ballSpeed,
          };
          socket.emit("cricketData", resForWinners);
          return;
        }

        if (currentBallTime > 0) {
          if (cricket.updatedPlayers.length !== 0) {
            let cricket1 = {
              updatedPlayers: cricket.updatedPlayers,
              currentBallTime: currentBallTime,
              ballSpeed: cricket.ballSpeed,
            };
            socket.emit("cricketData", cricket1);
            return;
          }
        } else {
          let cricket1 = {
            updatedPlayers: cricket.updatedPlayers,
            currentBallTime: 0,
            ballSpeed: cricket.ballSpeed,
          };
          socket.emit("cricketData", cricket1);
          return;
        }

        socket.emit("cricketData", cricket);
      } catch (err) {
        console.log(err);
        socket.emit("cricketDataError", { status: false, error: err.message });
      }
    };

    //________________send data for particular groupId____________
    // const getCricGroupDataUsingSocket = async (socket, req) => {
    //   try {
    //     console.log("received req data from the client===>", req);
    //     let groupId = req.groupId;

    //     console.log("groupId====>", groupId);

    //     if (!groupId) {
    //       return socket.emit('cricketDataError', { status: false, message: "groupId is required" });
    //     }

    //     let cricket = await cricGroupModel.findOne({ _id: groupId }).select({
    //       'updatedPlayers.UserId': 1,
    //       'updatedPlayers.run': 1,
    //       'updatedPlayers.wicket': 1,
    //       'updatedPlayers.isBallThrow': 1,
    //       'ballSpeed': 1,
    //       'isMatchOver': 1,
    //       'nextBallTime': 1
    //     });

    //     console.log("cricket using socket====>", cricket);
    //     if (!cricket) {
    //       return socket.emit('cricketData', { status: false, message: "this groupId not found" });
    //     }

    //     let currentBallTime = Math.max(0, cricket.nextBallTime - new Date());

    //     if (cricket.isMatchOver === true) {
    //       let resForWinners = {
    //         status:true,
    //         updatedPlayers: cricket.updatedPlayers,
    //         currentBallTime: currentBallTime,
    //         ballSpeed: cricket.ballSpeed,
    //       };
    //       socket.emit('cricketData', resForWinners);
    //       return;
    //     }

    //     socket.emit('cricketData', cricket);

    //   } catch (err) {
    //     console.log(err);
    //     socket.emit('cricketDataError', { status: false, error: err.message });
    //   }
    // };

    // Emit updated data when a user connects
    emitUpdatedUserData(socket);
    emitUpdatedCricGroupData(socket);
    emitUpdatedSnkGroupData(socket);
    emitUpdatedTournamentsData(socket);
    // getCricByGroupIdUsingSocket(socket, req, res)

    socket.on("disconnect", () => {
      console.log("Socket.io disconnected:", socket.id);
    });
  });
};
