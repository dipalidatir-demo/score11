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

      socket.on("getCricByGroupIdInSocket", (req) => {
        console.log("getCricByGroupIdUsingSocket data=====>", req);
        req.UserId = parseInt(req.UserId); // Parse UserId to integer
        req.groupId = parseInt(req.groupId); // Parse groupId to integer
        cricketController.getCricByGroupIdUsingSocket(socket, req);
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
        const getGroups = await cricGroupModel.find().sort({createdTime:-1});
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
    const getGroups = await groupModelForSnakeLadder.find().sort({createdTime:-1});
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
      { $sort: { createdAt: -1, entryFee:1 } },
      { $limit: 25 },
    ]);

    const snakeLadderData = await snakeLadderModel.aggregate([
      { $sort: { createdAt: -1, entryFee:1 } },
      { $limit: 25 },
    ]);

    const ticTacToeData = await ticTacToeModel.aggregate([
      { $sort: { createdAt: -1, entryFee:1 } },
      { $limit: 25 },
    ]);

    const allTournaments = [...cricketData, ...snakeLadderData, ...ticTacToeData];

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
    // Emit updated data when a user connects
    emitUpdatedUserData(socket);
    emitUpdatedCricGroupData(socket);
    emitUpdatedSnkGroupData(socket);
    emitUpdatedTournamentsData(socket);

    socket.on("disconnect", () => {
      console.log("Socket.io disconnected:", socket.id);
    });
  });
};
