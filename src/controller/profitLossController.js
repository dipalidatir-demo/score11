const mongoose = require("mongoose");
const profitLossModel = require("../model/profitLossModel")
const moment = require("moment");

const getProfitData = async function (req, res) {
  try {
    const getProfitLoss = await profitLossModel.find().select({gameType:1,profit:1,fullDayProfit:1,fullMonthProfit:1, fullYearProfit:1,loss:1,fullDayLoss:1,fullMonthLoss:1, fullYearLoss:1,groupId:1,updatedAt:1,createdAt:1,yaxis:1,xaxis:1});
    console.log(getProfitLoss,"++++++getProfitLoss");

    const groupId = getProfitLoss.map((item) => item.groupId.join(""));
    const concatenatedGroupId = groupId.join("");
    console.log(concatenatedGroupId,"______________concatenatedGroupId");

     
    if(getProfitLoss.length == 0){
    return res.status(404).send({
      status: false,
      message: "no data found",
    });
  } 
  return res.status(200).json({getProfitLoss,concatenatedGroupId});
    }
 catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
}

//____________________________________loss data______________


const getLossData = async function (req, res) {
  try {
    const getProfitLoss = await profitLossModel.find().select({gameType:1,loss:1,fullDayLoss:1,fullMonthLoss:1, fullYearLoss:1,groupId:1,updatedAt:1,createdAt:1});
    console.log(getProfitLoss,"++++++getProfitLoss");
    const groupId = getProfitLoss.map((item) => item.groupId.join(""));
    const concatenatedGroupId = groupId.join("");
    console.log(concatenatedGroupId,"______________concatenatedGroupId");

     
    if(getProfitLoss.length == 0){
    return res.status(404).send({
      status: false,
      message: "no data found",
    });
  } 
  return res.status(200).json({getProfitLoss,concatenatedGroupId});
    }
 catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }

}

//___________________________get daily profit__________________________

const getDailyProfit = async function(req,res){
  try{
    const currentDateFormat = req.query.date;
    console.log(currentDateFormat, "==================querydata");
     // Use moment to format the date
     const formattedDate = moment(currentDateFormat, 'YYYY-MM-DD').format('DD-MM-YYYY');

    // const currentDate = moment();
    // const currentDateFormat = currentDate.format("DD-MM-YYYY");
    const getDailyProfitAndLoss = await profitLossModel.findOne({currentTime:formattedDate});
    console.log(getDailyProfitAndLoss,"=================getDailyProfitAndLoss");
    if(!getDailyProfitAndLoss || getDailyProfitAndLoss == null){
      console.log("not found");
      return res.status(200).send({status:true,data:{fullDayProfit:0}})
    }
    return res.status(200).send({status:true, data:getDailyProfitAndLoss})
  }catch(error){
    console.log(error);
    return res.status(500).send({status:false, message:error.message});
  }
}
module.exports = {getProfitData,getLossData,getDailyProfit};
