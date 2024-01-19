const mongoose = require("mongoose");
const adminModel = require("../model/adminModel");
const cricketModel = require("../model/tournamentModel");
const snakeLadderModel = require("../model/snkTournamentModel");
const ticTacToeModel = require("../model/ticTacToeTournamentModel");
const { db } = require("../model/userModel");

const createAdmin = async function (req, res) {
  try {
    let bodyData = req.body;
    let { adminName, email, password } = bodyData;
    console.log(typeof(adminExist));
    if (Object.keys(bodyData).length === 0) {
      return res.status(400).send({
        status: false,
        message: "please provide all the field name,email, password ",
      });
    }
    const adminExist = await adminModel.findOne({
      email: email,
      password: password,
    });
    if (adminExist) {
      return res.status(200).send({
        status: true,
        message: "admin is already register",
        data: adminExist,
      });
    }
    const adminCreated = await adminModel.create(bodyData);
    return res.status(201).json(adminCreated);
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const adminLoggedin = async function (req, res) {
  try {
    let { email, password } = req.query;
    
    if (!email || !password) {
      return res
      .status(400)
      .send({
        status: false,
        message: "please provide both email and password ",
      });
    }
    const checkAdmin = await adminModel.findOne({ email: email, password:password });

    if (checkAdmin) {
     return res.status(200).json({ success: true, data: checkAdmin });
    } else {
      return res.status(200).json({ success: false, message: "credential failed" });
    }
  } catch (error) {
    return res.status(500).send({ status: "false", message: error.message });
  }
};

const getAllTable = async function (req, res) {
  try {
    let cricketData = await cricketModel.aggregate([
      { $sort: { createdAt: -1, entryFee: 1 } },
      { $limit: 25 },
    ]);

    // cricketData = cricketData.map(table => ({ ...table, gameType: "Cricket" }));

    let snakeLadderData = await snakeLadderModel.aggregate([
      { $sort: { createdAt: -1, entryFee: 1 } },
      { $limit: 25 },
    ]);

    // snakeLadderData = snakeLadderData.map(table => ({ ...table, gameType: "SnakeLadder" }));

    let ticTacToeData = await ticTacToeModel.aggregate([
      { $sort: { createdAt: -1, entryFee: 1 } },
      { $limit: 25 },
    ]);

    // ticTacToeData = ticTacToeData.map(table => ({ ...table, gameType: "TicTacToe" }));

    const allTournaments = [...cricketData, ...snakeLadderData, ...ticTacToeData];

    // console.log(allTournaments, "=======allTournaments");
    return res.status(200).send(allTournaments);
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// module.exports = getAllTable;
module.exports = { createAdmin, adminLoggedin, getAllTable};
