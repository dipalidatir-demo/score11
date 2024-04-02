/** @format */

const mongoose = require("mongoose");
const userModel = require("../model/userModel");
const cricketModel = require("../model/cricketModel");
const hockyModel = require("../model/hockyModel");
const snakeLadderModel = require("../model/snakeLadderModel");
const ticTacToeModel = require("../model/ticTacToeModel");
const adminModel = require("../model/adminModel");
const rocketModel = require("../model/rocketModel");
const airHockeyModel = require("../model/airHockeyModel");
const { log } = require("console");
const logger = require("../logger");

let referralAmountForUser = 11 ;

const createUsers = async function (req, res) {
  try {
    let queryData = req.query;

    let {
      UserId,
      userName,
      email,
      phone,
      token,
      referralCode,
    } = queryData;

    if (Object.keys(queryData).length == 0) {
      return res.status(200).send({
        status: false,
        message:
          "Body should  not be Empty please enter some data to create user",
      });
    }
    // if(!token){
    //   return res.status(200).send({sttaus:false, message:"token is required"});
    // }
    // queryData.token = token ;
    let checkUserId = await userModel
      .findOneAndUpdate({ UserId: UserId },{token:token},{new:true})
      .select({ _id: 0 });
    console.log("checkUserId========>",checkUserId);
    if (checkUserId != null && checkUserId != undefined) {
      if (checkUserId.banned === true) {
        return res.status(200).send({
          status: false,
          message: "User is banned ",
        });
      }
      return res.status(200).send({
        status: true,
        message: "UserId already exists",
        data: checkUserId,
      });
    }
    if (!userName) {
      if (email) {
        userName = await generateRandomUsername(email);
      } else if (phone) {
        userName = generateUsernameFromPhoneNumber(phone);
      }
      queryData.userName = userName;
    }

    let userNameAlreadyExist = await userModel.findOne({ userName: userName });

    if (userNameAlreadyExist) {
      userName = await generateUniqueUsername(userName);
      queryData.userName = userName;
    }

    queryData.cricketData = [{ playCount: 0, winCount: 0 }];
    queryData.snkLadderData = [{ playCount: 0, winCount: 0 }];
    queryData.ticTacToeDataData = [{ playCount: 0, winCount: 0 }];
    queryData.airHockeyData = [{ playCount: 0, winCount: 0 }];
    queryData.rocketData = [{ playCount: 0, winCount: 0 }];
    queryData.isActive = true;

    // Generate a unique referral code for the new user
    const referral_Code = Math.random().toString(36).substring(2);
    queryData.referralCode = referral_Code;
    if(referralAmountForUser){
      queryData.referralAmount = parseInt(referralAmountForUser) ;
    }

    if (referralCode) {
      // Find the referrer by their referral code
      const referrer = await userModel.findOne({ referralCode: referralCode });

      // If the referrer is found, add credits to the referrer's accounts
      if (referrer) {
        const isAlredyUsedRefCode = referrer.referralHistory.filter(
          (user) => user.UserId === UserId
        );
        if (isAlredyUsedRefCode.length !== 0) {
          return res
            .status(200)
            .send({
              status: false,
              message: "You already used this referral code",
            });
        }
        referrer.credits += parseInt(referrer.referralAmount);
        referrer.referralHistory.push({ referTo: UserId, date: new Date() });
        await referrer.save();
        queryData.referredBy = referrer.UserId;
      } else {
        return res.status(200).json({ error: "Invalid referral code" });
      }
    }

    const userCreated = await userModel.create(queryData);
    const CricTable = await cricketModel.create(queryData);
    const airHockeyTable = await airHockeyModel.create(queryData);
    const SnakeTable = await snakeLadderModel.create(queryData);
    const TicTable = await ticTacToeModel.create(queryData);
    const rocketTable = await rocketModel.create(queryData);

    // const updateIsActive = await userModel.findOneAndUpdate(
    //   {UserId:UserId},
    //   {isActive:true},
    //   {new:true}
    // );

    return res.status(201).send({
      status: true,
      message: "success",
      data: userCreated,
      CricTable,
      airHockeyTable,
      SnakeTable,
      TicTable,
      rocketTable
    });
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

async function generateUniqueUsername(userName) {
  let newUserName = userName;
  let user = await userModel.findOne({ userName: newUserName });

  while (user) {
    newUserName = userName + randomString(5);
    user = await userModel.findOne({ userName: newUserName });
  }
  return newUserName;
}

async function generateRandomUsername(email) {
  // Remove "mailto:" prefix if it exists
  email = email.replace(/^mailto:/i, '');

  let newUserName = email.split("@")[0].substring(0, 14);
  let user = await userModel.findOne({ userName: newUserName });

  while (user) {
    newUserName = email.split("@")[0].substring(0, 9) + randomString(5);
    user = await userModel.findOne({ userName: newUserName });
  }

  return newUserName;
}


function randomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateUsernameFromPhoneNumber(phone) {
  const firstTwoDigits = phone.substring(0, 2);
  const lastTwoDigits = phone.substring(phone.length - 2);
  return `${firstTwoDigits}xxxxxx${lastTwoDigits}`;
}

// ___________________________________________________find by query params

const getUser = async function (req, res) {
  try {
    let UserId = req.query.UserId;

    const getNewUser = await userModel
      .findOne({ UserId: UserId, isDeleted: false })
      .select({ _id: 0 });

    if (!getNewUser) {
      return res.status(200).send({
        status: false,
        message: "user not found",
      });
    }

    let cricket = await cricketModel.findOne({ UserId: UserId });
    let hocky = await hockyModel.findOne({ UserId: UserId });
    let snakeLadder = await snakeLadderModel.findOne({ UserId: UserId });
    let ticTacToe = await ticTacToeModel.findOne({ UserId: UserId });
    // const getNewUser = await userModel.findOne({ UserId: UserId, isDeleted: false }).select({ _id: 0 });

    // const sportsData = await userModel.aggregate([
    //   {
    //     $match: { UserId: UserId, isDeleted: false }
    //   },
    //   {
    //     $lookup: {
    //       from: 'cricketModel', // Replace with the actual collection name
    //       localField: 'UserId',
    //       foreignField: 'UserId',
    //       as: 'cricket'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'hockyModel', // Replace with the actual collection name
    //       localField: 'UserId',
    //       foreignField: 'UserId',
    //       as: 'hocky'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'snakeLadderModel', // Replace with the actual collection name
    //       localField: 'UserId',
    //       foreignField: 'UserId',
    //       as: 'snakeLadder'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'ticTacToeModel', // Replace with the actual collection name
    //       localField: 'UserId',
    //       foreignField: 'UserId',
    //       as: 'ticTacToe'
    //     }
    //   }
    // ]);

    // const [userSportsData] = sportsData;

    // const cricket = userSportsData.cricket ? userSportsData.cricket[0] : null;
    // const hocky = userSportsData.hocky ? userSportsData.hocky[0] : null;
    // const snakeLadder = userSportsData.snakeLadder ? userSportsData.snakeLadder[0] : null;
    // const ticTacToe = userSportsData.ticTacToe ? userSportsData.ticTacToe[0] : null;

    return res.status(200).send({
      status: true,
      message: "user already exist",
      data: getNewUser,
      cricket,
      hocky,
      snakeLadder,
      ticTacToe,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//__________________get All Uer__________________

const getAllUser = async function (req, res) {
  try {
    const getUsers = await userModel
      .find({ isDeleted: false })
      .sort({ createdAt: -1 });

    if (getUsers.length == 0) {
      return res.status(200).send({
        status: false,
        message: "user not found",
      });
    }

    return res.status(200).json(getUsers);
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

// ___________________________________________update user

const updateUser = async function (req, res) {
  try {
    let UserId = req.query.UserId;
    let updateData = req.query;

    let {
      userName,
      email,
      phone,
      credits,
      status,
      realMoney,
      banned,
      referralAmount,
    } = updateData;

    console.log(updateData, "========updateData");

    if (Object.keys(updateData).length == 0) {
      return res.status(200).send({
        status: false,
        message: "For updating please enter atleast one field",
      });
    }
    const checkUser = await userModel.findOne({
      UserId: UserId,
      isDeleted: false,
    });

    if (!checkUser) {
      return res
        .status(200)
        .send({ atatus: false, message: "UserId is not present" });
    }
    if (banned === "false") {
      banned = false;
    } else if (banned === "true") {
      banned = true;
    }
    //______________________________________convert string to number______________________
    let data = {};
    if (credits) {
      credits = parseInt(credits);
      data.credits = credits;
    } else if (realMoney) {
      realMoney = Number(realMoney);
      data.realMoney = realMoney;
    }

    if (referralAmount) {
      referralAmount = parseInt(referralAmount);
      data.referralAmount = referralAmount;
    }

    data.userName = userName;
    data.email = email;
    data.phone = phone;
    data.status = status;
    data.banned = banned;

    const userUpdate = await userModel.findOneAndUpdate(
      { UserId: UserId },
      { $set: data },
      { new: true }
    );

    if (userUpdate.length == 0) {
      return res.status(200).send({
        status: false,
        message: "user not found",
      });
    }

    if (userUpdate.length == UserId) {
      return res.status(200).send({
        status: false,
        message: "you can't update UserId",
      });
    }
    console.log("after updating tble data", userUpdate);
    return res.status(200).send({
      status: true,
      message: "Success",
      data: userUpdate,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};

//_____________________________________update user refferal amount as per admin_____________
const updateUsersRefAmountByAdmin = async function (req, res) {
  try {
    let queryData = req.query;
    let {referralAmount, email}= queryData;
 console.log(queryData,"===============queryData");
    if (!referralAmount || !email) {
      return res.status(200).send({
        status: false,
        message: "admin email and referralAmount both are required",
      });
    }

    referralAmount = parseInt(referralAmount);

    const checkAdmin = await adminModel.findOne({
      email: email,
    });

    if (!checkAdmin) {
      return res
        .status(200)
        .send({ atatus: false, message: "admin is not present" });
    }
    
    console.log(referralAmountForUser,"=========== before updated by admin");
    referralAmountForUser = parseInt(referralAmount);
    const userUpdate = await userModel.updateMany(
      {isDeleted : false },
      { $set:{
        referralAmount :referralAmount
      }
     },
      { new: true }
    );
    console.log(referralAmountForUser,"=========== after updated by admin");
    if (userUpdate.length == 0) {
      return res.status(200).send({
        status: false,
        message: "user not found",
      });
    }

    return res.status(200).send({
      status: true,
      message: "Success",
      // data: userUpdate,
    });
  } catch (err) {
    return res.status(500).send({
      status: false,
      error: err.message,
    });
  }
}
//____________________________________api for leaderBoard___________________

const leadderBoard = async function (req, res) {
  try {
    let queryData = req.query;
    const { cricket, snakeLadder, ticTacToe, airHockey } = queryData;
    // logger.info(`inputs: ${cricket},${snakeLadder}, ${ticTacToe},${airHockey}`)
    let resp = {
      status: true,
      message: "Leaderboard",
    };
    let selectFields = {};
    let sortField = "cricketWinAmount"; // Default sort field, we can change this based on the selected game

    if (cricket) {
      selectFields = {
        UserId: 1,
        userName: 1,
        cricketData: 1,
        cricketWinAmount: 1,
        _id: 0,
      };
      resp.message = "Cricket Leaderboard";
      sortField = "cricketWinAmount";
    } else if (snakeLadder) {
      selectFields = {
        UserId: 1,
        userName: 1,
        snkLadderData: 1,
        snkLadderWinAmount: 1,
        _id: 0,
      };
      resp.message = "snakeLadder Leaderboard";
      sortField = "snkLadderWinAmount";
    } else if (ticTacToe) {
      selectFields = {
        UserId: 1,
        userName: 1,
        ticTacToeData: 1,
        ticTacToeWinAmount: 1,
        _id: 0,
      };
      resp.message = "ticTacToe Leaderboard";
      sortField = "ticTacToeWinAmount";
    } else if (airHockey) {
      selectFields = {
        UserId: 1,
        userName: 1,
        airHockeyData: 1,
        airHockeyWinAmount: 1,
        _id: 0,
      };
      resp.message = "airHockey Leaderboard";
      sortField = "airHockeyWinAmount";
    }

    const leaderBoardData = await userModel
      .find({ isDeleted: false }, selectFields)
      .sort({ [sortField]: -1 }) // Sort in descending order based on the chosen field
      .limit(100);

    if (leaderBoardData.length === 0) {
      return res.status(200).send({ status: false, message: "Data not found" });
    }

    // Modify the leaderBoardData to include only playCount and winCount
    if (cricket) {
      resp.users = leaderBoardData
        .filter(
          (user) =>
            user.cricketData &&
            user.cricketData[0] &&
            user.cricketData[0].playCount !== 0
        )
        .map((user) => ({
          userName: user.userName,
          matches: user.cricketData[0].playCount || 0, // Use 0 if playCount is undefined
          // wins: user.cricketData[0].winCount || 0, // Uncomment this line if needed
          Total: user.cricketWinAmount || 0, // Use 0 if cricketWinAmount is undefined
        }));
    } else if (snakeLadder) {
      resp.users = leaderBoardData
        .filter(
          (user) =>
            user.snkLadderData &&
            user.snkLadderData[0] &&
            user.snkLadderData[0].playCount !== 0
        ) // Filter out users with playCount = 0
        .map((user) => ({
          userName: user.userName,
          matches: user.snkLadderData[0].playCount || 0,
          // wins: user.snkLadderData[0].winCount,
          Total: user.snkLadderWinAmount || 0,
        }));
    } else if (ticTacToe) {
      resp.users = leaderBoardData
        .filter(
          (user) =>
            user.ticTacToeData &&
            user.ticTacToeData[0] &&
            user.ticTacToeData[0].playCount !== 0
        ) // Filter out users with playCount = 0
        .map((user) => ({
          userName: user.userName,
          matches: user.ticTacToeData[0].playCount || 0,
          // wins: user.ticTacToeData[0].winCount,
          Total: user.ticTacToeWinAmount || 0,
        }));
    } else if (airHockey) {
      resp.users = leaderBoardData
        .filter(
          (user) =>
            user.airHockeyData &&
            user.airHockeyData[0] &&
            user.airHockeyData[0].playCount !== 0
        ) // Filter out users with playCount = 0
        .map((user) => ({
          userName: user.userName,
          matches: user.airHockeyData[0].playCount || 0,
          // wins: user.airHockeyData[0].winCount,
          Total: user.airHockeyWinAmount || 0,
        }));
    }

    logger.info("Document fetched successfully");
    return res.status(200).json(resp);
  } catch (error) {
    console.log("Detected some error:", error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

//_________________________api for user history__________________________

const userHistory = async function (req, res) {
  try {
    let UserId = req.query.UserId;

    if (!UserId) {
      return res
        .status(200)
        .send({ status: false, message: "User id is required" });
    }
    const findUserData = await userModel
      .findOne({ UserId: UserId, isDeleted: false })
      .select({ history: 1, _id: 0 }) // Select the 'history' field only
      .lean();

    if (!findUserData) {
      return res
        .status(200)
        .send({ status: false, message: "Data not found for this UserId" });
    }

    // Sort the 'history' array in descending order based on the combined 'date' and 'time' fields
    findUserData.history.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateB - dateA;
    });

    const result = { history: findUserData.history };
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//_______________________transaction history_____________________

const transactionHistory = async function (req, res) {
  try {
    const UserId = req.query.UserId;
    if (!UserId) {
      return res
        .status(200)
        .send({ status: false, message: "User id is required" });
    }
    let findUser = await userModel
      .findOne({ UserId: UserId, isDeleted: false })
      .select({ transactionHistory: { $slice: -50 }, _id: 0 })
      .lean();
    if (!findUser) {
      return res
        .status(200)
        .send({ status: false, message: "data not found  as per this UserId" });
    }
    const result = {
      transactionHistory: findUser.transactionHistory,
      Bonus: 1000,
    };
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

//_________________only for local_____________________
const updateHistory = async function (req, res) {
  // const UserId = req.body.UserId;
  let { history, UserId } = req.body;
  let find = await userModel.findOne({ UserId: UserId, isDeleted: false });
  find.history = history;
  const update = await find.save();
  return res.send(update);
};

//____________delete user account _________________
const deleteUserAccount = async function (req, res) {
  try {
    const UserId = req.query.UserId;
    console.log(UserId, "_____UserId");
    const checkUser = await userModel.findOne({ UserId: UserId });
    if (!checkUser || checkUser.isDeleted === true) {
      return res.status(200).send({ status: true, message: "user not found " });
    }

    const deleteUser = await userModel.findOneAndUpdate(
      { UserId: UserId },
      { $set: { isDeleted: true } },
      { new: true }
    );

    return res
      .status(200)
      .send({
        status: true,
        message: `User of ${UserId} account is successfully deleted`,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, error: error.message });
  }
};

module.exports = {
  createUsers,
  getUser,
  updateUser,
  getAllUser,
  leadderBoard,
  userHistory,
  transactionHistory,
  updateHistory,
  deleteUserAccount,
  updateUsersRefAmountByAdmin
};
