const express = require("express");

const adminController = require("../controller/adminController")
const userController = require("../controller/userController");
const cricketController = require("../controller/cricketController");
const hockyController = require("../controller/hockyController");
const snakeLadderController = require("../controller/snakeLadderController");
const ticTacToeController = require("../controller/ticTacToeController");
const balanceController = require("../controller/balanceController");
const tournamentController = require("../controller/tournamentController");
const botPlayersController = require("../controller/dummyUsers");
const sendNotificatinController = require("../controller/sendNotificationsController");
const botController = require("../controller/botController");
const razorpayController = require("../controller/razorpayController");
const profitLossController = require("../controller/profitLossController");
const { 
  rktTablesCreatedByAdmin,
  createRocketTables,
  updateRocketTournaments,
  getAllRocket,
  getGroupsByUserForRkt,
  getRktByGroupId,
  updateRktPointOfUser,
  getPlayersOfRocket,
  getAllGroupsOfRocket }  = require("../controller/rocketController");

  const { airHockeyTablesCreatedByAdmin,
    updateAirHockeyTournaments,
    getAllAirHockey,
    getGroupsByUserForAirHoc,
    getAirHocByGroupId,
    updateAirHocPointOfUser,
    getPlayersOfAirHoc,
    getAllGroupsOfAirHoc} = require("../controller/airHockeyController");

const Razorpay = require("razorpay");
const crypto = require("crypto");
const Router = express.Router();

//_____________________________razorpay api________________

Router.post("/orders", razorpayController.createOrder);

Router.post("/verify", razorpayController.verifyOrder);

Router.post("/withdrawals", razorpayController.initiateWithdrawal);

// Router.post("/verifyWithdrawals", razorpayController.verifyWithdrawals);

//__________________________Admin_____________________

Router.post("/registerOfAdmin", adminController.createAdmin);

Router.get("/login", adminController.adminLoggedin);

Router.get("/getAllTable", adminController.getAllTable);

Router.put("/updateUsersRefAmount", userController.updateUsersRefAmountByAdmin);

//_____________________________________User______________

Router.get("/register", userController.createUsers);

Router.put("/updateUser", userController.updateUser);

Router.get("/profile", userController.getUser);

Router.get("/getAllUser", userController.getAllUser);

Router.get("/getUserHistory", userController.userHistory)

Router.get("/getleadderBoardData",userController.leadderBoard)

Router.get("/transactionHistory", userController.transactionHistory);

Router.put("/updateHistory", userController.updateHistory);

Router.put("/deleteUserAccount", userController.deleteUserAccount);
//_________________bot players______________

Router.get("/registerBot", botController.createBot);

Router.get("/getBotData", botController.getBotData);

Router.get("/getAllBotData", botController.getAllBot);


//_____________________ Cricket________________________

Router.get("/updateCricket", cricketController.updateCric);

Router.get("/getAllCricketData", cricketController.getAllCric);

Router.get("/getCricGrp", cricketController.getCricByGroupId);

Router.get("/getGameEndTimeAsPerGrpId", cricketController.getGameEndTime);

Router.get("/getPlayersData", cricketController.getPlayersData);

// Router.get("/getCricketDataUsingSocket", cricketController.getCricByGroupIdUsingSocket);

Router.get("/getAllGroupsOfCric", cricketController.getAllGroups);

Router.get("/winner", cricketController.winTheGame);

//_______________________Cricket tournaments__________________

Router.post("/tournamentsByAdmin", tournamentController.tournamentsByAdmin);

Router.post("/tournaments", tournamentController.createTournaments);

Router.get("/tables", tournamentController.getAllTables);

Router.put("/tournament", tournamentController.updateTournament);

Router.get("/groups", tournamentController.getGroups);

Router.put("/updategroupsBotType", tournamentController.updategroupsBotType);

Router.get("/players", tournamentController.getPlayers);

Router.get("/getAllGroupAsPerTableId", tournamentController.allGroupAsPerTableId);

Router.get("/getTotalPlayerAndBot", tournamentController.getTotalPlayerAndBot);

Router.get("/getNextBallTimeAsPerTableId",tournamentController.getNextBallTimeAsPerTableId);

//__________________Hocky___________________

Router.put("/updateHocky", hockyController.updateHoc);

Router.get("/getAllHockyData", hockyController.getAllHoc);

//__________________snakeLadder Tournaments___________________

Router.post("/snktournamentsByAdmin", snakeLadderController.snkTablesCreatedByAdmin);

Router.post("/snktournaments", snakeLadderController.createSnakeLadderTables);

Router.get("/getAllSnakeLadderData", snakeLadderController.getAllSnak);

Router.put("/updateSnakeLadder", snakeLadderController.updateSnakLdrTournaments);

Router.get("/getGroupsByUserId", snakeLadderController.getGroupsByUser);

Router.get("/getGroup", snakeLadderController.getSnkByGroupId);

Router.put("/updateSnakeLadderPerPlayer", snakeLadderController.updatePointOfUser);

Router.get("/playersOfSnkLdr", snakeLadderController.getPlayersOfSnkLadder);

Router.get("/getAllGroupsOfSnk", snakeLadderController.getAllGroupsOfSnk);

//_________________________________Rocket______________________________________________________

Router.post("/rkttournamentsByAdmin", rktTablesCreatedByAdmin);

Router.post("/rkttournaments", createRocketTables);

Router.get("/getAllRocketData", getAllRocket);

Router.put("/updateRocket", updateRocketTournaments);

Router.get("/getRktGroupsByUserId", getGroupsByUserForRkt);

Router.get("/getRktGroup", getRktByGroupId);

Router.get("/updateRocketPerPlayer", updateRktPointOfUser);

Router.get("/playersOfRocket", getPlayersOfRocket);

Router.get("/getAllGroupsOfRkt", getAllGroupsOfRocket);


//_________________________________airHockey_________________________________

Router.post("/airHoctournamentsByAdmin", airHockeyTablesCreatedByAdmin);

Router.get("/getAllAirHocData", getAllAirHockey);

Router.put("/updateAirHocey", updateAirHockeyTournaments);

Router.get("/getAirHocGroupsByUserId", getGroupsByUserForAirHoc);

Router.get("/getAirHocGroup", getAirHocByGroupId);

Router.get("/updateAirHocPerPlayer", updateAirHocPointOfUser);

Router.get("/playersOfAirHoc", getPlayersOfAirHoc);

Router.get("/getAllGroupsOfAirHoc", getAllGroupsOfAirHoc);

//__________________ticTacToe___________________

Router.post("/ticTacToetournamentsByAdmin", ticTacToeController.ticTacToeTablesCreatedByAdmin);

Router.post("/createTicTacToetournaments", ticTacToeController.createTicTacToeTables);

Router.get("/getAllticTacToeTournaments", ticTacToeController.getAllTicTacToeData);

Router.get("/getPlayersOfTicTacToe", ticTacToeController.getPlayersOfTicTacToe);

Router.put("/updateTicTacToetournaments", ticTacToeController.updateTicTacToeTournaments);

Router.get("/getTicTacToeGroupByUserId", ticTacToeController.getTicTacToeGroupsByUser);

Router.get("/getGroupsOfTicTacToeAsPerGrpId", ticTacToeController.getGroupsOfTicTacToeAsPerGrpId);

Router.get("/getAllGroupsOfTicTacToe", ticTacToeController.getAllGroupsOfTicTacToe);

//______________________extra routes__________________

Router.put("/updateTicTacToe", ticTacToeController.updateTic);

Router.get("/getAllTicTacToeData", ticTacToeController.getAllTic);


//_________________credits_____________________

Router.put("/updateBalance", balanceController.updatecredits);

Router.get("/sendNotification", sendNotificatinController.sendNotification );

//___________________________profit loss_________________

Router.get("/getProfitData", profitLossController.getProfitData);

Router.get("/getLossData", profitLossController.getLossData);

Router.get("/getDailyProfitAndLoss", profitLossController.getDailyProfit);

Router.get("/getprofitLossChart", profitLossController.profitLossChart);

//************ checking your end point valid or not */

Router.all("/**", function (req, res) {
  res.status(404).send({
    status: false,
    message: "Make Sure Your Endpoint is Correct or Not!",
  });
});

module.exports = Router;
