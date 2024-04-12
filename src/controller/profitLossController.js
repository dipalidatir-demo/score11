const mongoose = require("mongoose");
const profitLossModel = require("../model/profitLossModel");
const moment = require("moment");
const cron = require("node-cron");

// Define your cron job to run at 12:00 am every day
cron.schedule("0 0 * * *", async () => {
  try {
    const currentDateFormat = moment().format("DD-MM-YYYY");

    const lastDayProfit = await profitLossModel
      .findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    const lastUpdatedDate = lastDayProfit.createdAt.getDate();
    const updatedMonth = lastDayProfit.createdAt.getMonth();
    const updatedYear = lastDayProfit.createdAt.getFullYear();
    if (!lastDayProfit) {
      // Your logic to calculate profit and loss goes here
      const profitData = {
        gameType: [],
        groupId: [],
        profit: 0,
        loss: 0,
        currentTime: currentDateFormat,
      };
      const createProfit = await profitLossModel.create(profitData);
      console.log(
        "Profit and loss document created successfully on:",
        currentDateFormat
      );
    } else if (currentYear !== updatedYear) {
      const profitData = {
        gameType: [],
        groupId: [],
        profit: 0,
        loss: 0,
        currentTime: currentDateFormat,
      };
      const createProfit = await profitLossModel.create(profitData);
    } else if (currentMonth !== updatedMonth) {
      const profitData = {
        gameType: [],
        groupId: [],
        profit: 0,
        loss: 0,
        currentTime: currentDateFormat,
        fullYearProfit: lastDayProfit.fullYearProfit,
        fullYearLoss: lastDayProfit.fullYearLoss,
        snkFullYearProfit: lastDayProfit.snkFullYearProfit,
        snkFullYearLoss: lastDayProfit.snkFullYearLoss,
        crickFullYearProfit: lastDayProfit.crickFullYearProfit,
        crickFullYearLoss: lastDayProfit.crickFullYearLoss,
        rktFullYearProfit:lastDayProfit.rktFullYearProfit,
        rktFullYearLoss:lastDayProfit.rktFullYearLoss
      };
      const createProfit = await profitLossModel.create(profitData);
    } else if (currentDate !== lastUpdatedDate) {
      const profitData = {
        gameType: [],
        groupId: [],
        profit: 0,
        loss: 0,
        currentTime: currentDateFormat,
        fullMonthProfit: lastDayProfit.fullMonthProfit,
        fullYearProfit: lastDayProfit.fullYearProfit,
        fullMonthLoss: lastDayProfit.fullMonthLoss,
        fullYearLoss: lastDayProfit.fullYearLoss,
        snkFullMonthProfit: lastDayProfit.snkFullMonthProfit,
        snkFullYearProfit: lastDayProfit.snkFullYearProfit,
        snkFullMonthLoss: lastDayProfit.snkFullMonthLoss,
        snkFullYearLoss: lastDayProfit.snkFullYearLoss,
        crickFullMonthProfit: lastDayProfit.crickFullMonthProfit,
        crickFullYearProfit: lastDayProfit.crickFullYearProfit,
        crickFullMonthLoss: lastDayProfit.crickFullMonthLoss,
        crickFullYearLoss: lastDayProfit.crickFullYearLoss,
        rktFullMonthProfit:lastDayProfit.rktFullMonthProfit,
        rktFullYearProfit:lastDayProfit.rktFullYearProfit,
        rktFullMonthLoss:lastDayProfit.rktFullMonthLoss,
        rktFullYearLoss:lastDayProfit.rktFullYearLoss
      };
      const createProfit = await profitLossModel.create(profitData);
    } else {
      console.log(
        "Profit and loss document has already been created for:",
        currentDateFormat
      );
    }
  } catch (error) {
    console.error("Error creating profit and loss document:", error);
  }
});

//_____________________________get profit and loss____________________
const getProfitData = async function (req, res) {
  try {
    const getProfitLoss = await profitLossModel
      .find()
      .select({
        gameType: 1,
        profit: 1,
        fullDayProfit: 1,
        fullMonthProfit: 1,
        fullYearProfit: 1,
        loss: 1,
        fullDayLoss: 1,
        fullMonthLoss: 1,
        fullYearLoss: 1,
        groupId: 1,
        updatedAt: 1,
        createdAt: 1,
        yaxis: 1,
        xaxis: 1,
      });
    console.log(getProfitLoss, "++++++getProfitLoss");

    const groupId = getProfitLoss.map((item) => item.groupId.join(""));
    const concatenatedGroupId = groupId.join("");
    console.log(concatenatedGroupId, "______________concatenatedGroupId");

    if (getProfitLoss.length == 0) {
      return res.status(404).send({
        status: false,
        message: "no data found",
      });
    }
    return res.status(200).json({ getProfitLoss, concatenatedGroupId });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

//____________________________________loss data______________

const getLossData = async function (req, res) {
  try {
    const getProfitLoss = await profitLossModel
      .find()
      .select({
        gameType: 1,
        loss: 1,
        fullDayLoss: 1,
        fullMonthLoss: 1,
        fullYearLoss: 1,
        groupId: 1,
        updatedAt: 1,
        createdAt: 1,
      });
    console.log(getProfitLoss, "++++++getProfitLoss");
    const groupId = getProfitLoss.map((item) => item.groupId.join(""));
    const concatenatedGroupId = groupId.join("");
    console.log(concatenatedGroupId, "______________concatenatedGroupId");

    if (getProfitLoss.length == 0) {
      return res.status(404).send({
        status: false,
        message: "no data found",
      });
    }
    return res.status(200).json({ getProfitLoss, concatenatedGroupId });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

//___________________________get daily profit__________________________

const getDailyProfit = async function (req, res) {
  try {
    const currentDateFormat = req.query.date;
    console.log(currentDateFormat, "==================querydata");
    // Use moment to format the date
    const formattedDate = moment(currentDateFormat, "YYYY-MM-DD").format(
      "DD-MM-YYYY"
    );

    // const currentDate = moment();
    // const currentDateFormat = currentDate.format("DD-MM-YYYY");
    const getDailyProfitAndLoss = await profitLossModel.findOne({
      currentTime: formattedDate,
    });
    console.log(
      getDailyProfitAndLoss,
      "=================getDailyProfitAndLoss"
    );
    if (!getDailyProfitAndLoss || getDailyProfitAndLoss == null) {
      console.log("not found");
      return res
        .status(200)
        .send({
          status: true,
          data: {
            fullDayProfit: 0,
            fullDayLoss: 0,
            crickFullDayProfit: 0,
            crickFullDayLoss: 0,
            snkFullDayProfit: 0,
            snkFullDayLoss: 0,
            tictactoeFullDayProfit: 0,
            tictactoeFullDayLoss: 0,
            airHocFullDayProfit: 0,
            airHocFullDayLoss: 0,
            rktFullDayProfit: 0,
            rktFullDayLoss: 0
          },
        });
    }
    return res.status(200).send({ status: true, data: getDailyProfitAndLoss });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

//_______________________profit loss chart_______________________________

const profitLossChart = async function (req, res) {
  try {
    const findData = await profitLossModel.find().sort({ createdAt: -1 }).select({time:0, yaxis:0, gameType:0, groupId:0}).limit(7);

    if (findData.length === 0) {
      // No documents found
      return res.status(404).send({ status: false, message: "No data found" });
    }

    // If less than 10 documents found, return all available documents
    return res.status(200).send({ status: true, data: findData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};


module.exports = { getProfitData, getLossData, getDailyProfit, profitLossChart };
