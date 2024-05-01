const fs = require("fs");
const path = require("path");
var FCM = require("fcm-node");
const userModel = require("../model/userModel");
const { validationResult } = require("express-validator");

const sendNotification = async (req, res) => {
  try {
    const { userId, message } = req.query;
    console.log("User Id:- " + userId);
    console.log("message:- " + message);

    fs.readFile(
      path.join(__dirname, "../firebaseService.json"),
      "utf8",
      async (err, jsonString) => {
        if (err) {
          console.log("Error reading file from disk:", err);
          return err;
        }
        try {
          //firebase push notification send
          const data = JSON.parse(jsonString);
          var serverKey = data.SERVER_KEY;
          var fcm = new FCM(serverKey);

          var push_tokens = await userModel
            .findOne({ UserId: userId })
            .select({ UserId: 1, token: 1 });
          if (!push_tokens) {
            return res.status(200).send({ message: "User not found" });
          }

          // var reg_ids = [];
          // push_tokens.forEach(token => {
          //   reg_ids.push(token.fcm_token)
          // })
          var reg_ids = [push_tokens.token];
          console.log("user=====>", push_tokens, "===reg_ids ==>", reg_ids);

          if (reg_ids.length > 0) {
            var pushMessage = {
              //this may vary according to the message type (single recipient, multicast, topic, et cetera)
              registration_ids: reg_ids,
              content_available: true,
              mutable_content: true,
              notification: {
                body: message,
                icon: "myicon", //Default Icon
                sound: "mySound", //Default sound
                // badge: badgeCount, example:1 or 2 or 3 or etc....
              },
              // data: {
              //   notification_type: 5,
              //   conversation_id:inputs.user_id,
              // }
            };

            fcm.send(pushMessage, function (err, response) {
              if (err) {
                console.log("Something has gone wrong!", err);
                return res
                  .status(500)
                  .send({
                    status: false,
                    message: "Failed to send notification",
                    error: err,
                  });
              } else {
                console.log("Push notification sent.", response);
                return res
                  .status(200)
                  .send({
                    status: true,
                    message: "Notification sent successfully",
                    response: response,
                  });
              }
            });
          }
        } catch (err) {
          console.log("Error parsing JSON string:", err);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

//_______________________create pushNotifiaction function_______________________
const pushNotification = async (userTokens, message) => {
  try {
    console.log("User Ids:", userTokens);
    console.log("Message:", message);

    fs.readFile(
      path.join(__dirname, "../firebaseService.json"),
      "utf8",
      async (err, jsonString) => {
        if (err) {
          console.log("Error reading file from disk:", err);
          throw err; // Throw error for proper handling
        }
        try {
          // Parse JSON data
          const data = JSON.parse(jsonString);
          const serverKey = data.SERVER_KEY;

          // Fetch user tokens from database
          // const pushTokens = await userModel.find({ UserId: { $in: userIds } }).select({ UserId: 1, token: 1 });

          if (userTokens.length === 0) {
            throw new Error("No users found");
          }

          // const regIds = pushTokens.map(token => token.token);

          if (userTokens.length > 0) {
            const fcm = new FCM(serverKey);
            const pushMessage = {
              registration_ids: userTokens, //_ids most imp
              priority: "high", // Set priority to 'high'
              content_available: true,
              mutable_content: true,
              notification: {
                body: message,
                icon: "myicon", // Default Icon
                sound: "mySound", // Default sound
              },
            };

            // Send push notifications
            fcm.send(pushMessage, function (err, response) {
              if (err) {
                console.log("Failed to send notification:", err);
                // Handle error accordingly
              } else {
                console.log("Notification sent successfully:", response);
                // Handle success accordingly
              }
            });
          }
        } catch (err) {
          console.log("Error:", err.message);
          // Handle error accordingly
        }
      }
    );
  } catch (error) {
    console.log("Error:", error.message);
    // Handle error accordingly
  }
};

//_______________________sending notification to all ___________________________

//  const sendingNotificationToAll = async function (req, res) {
//    try {
//      let message  = req.body;
//      console.log("message===", req.body);
//      if (!message) {
//        return res
//          .status(400)
//          .send({ status: false, message: "Message is required" });
//      }
//      message = message.message ;

//      fs.readFile(
//        path.join(__dirname, "../firebaseService.json"),
//        "utf8",
//        async (err, jsonString) => {
//          if (err) {
//            console.log("Error reading file from disk:", err);
//            throw err; // Throw error for proper handling
//          }
//          try {
//            // Parse JSON data
//            const data = JSON.parse(jsonString);
//            const serverKey = data.SERVER_KEY;

//            // Fetch user tokens from database
//            const pushTokens = await userModel
//              .find()
//              .select({ _id: 0, token: 1 });

//            if (pushTokens.length === 0) {
//              return res
//                .status(400)
//                .send({ status: false, message: "No users found" });
//            }

//            // const regIds = pushTokens.map(token => token.token);

//            if (pushTokens.length > 0) {
//              const fcm = new FCM(serverKey);
//              const pushMessage = {
//                registration_ids: pushTokens.map((token) => token.token),
//                priority: "high",
//                content_available: true,
//                mutable_content: true,
//                notification: {
//                  body: message,
//                 icon: 'myicon', // Default Icon
//                  sound: "default",
//                },
//              };

//              // Send push notifications
//              fcm.send(pushMessage, function (err, response) {
//                if (err) {
//                  console.log("Failed to send notification:", err);
//                  return res
//                    .status(500)
//                    .send({
//                      status: false,
//                      message: "Failed to send notification",
//                    });
//                } else {
//                  console.log("Notification sent successfully:", response);
//                  return res
//                    .status(200)
//                    .send({
//                      status: true,
//                      message: "Notification sent successfully",
//                    });
//                }
//              });
//            }
//          } catch (err) {
//            console.log("Error:", err.message);
//            // Handle error accordingly
//          }
//        }
//      );
//    } catch (error) {
//      console.log("Error:", error.message);
//      // Handle error accordingly
//    }
//  };

//  const sendingNotificationToAll = async function (req, res) {
//   try {
//     let {message, title, imgIcon} = req.body;
//     console.log("message===", req.body);
//     if (!message || !title || !imgIcon) {
//       return res
//         .status(400)
//         .send({ status: false, message: "Message, title and icon all are required" });
//     }
//     // message = message.message;

//     fs.readFile(
//       path.join(__dirname, "../firebaseService.json"),
//       "utf8",
//       async (err, jsonString) => {
//         if (err) {
//           console.log("Error reading file from disk:", err);
//           throw err; // Throw error for proper handling
//         }
//         try {
//           // Parse JSON data
//           const data = JSON.parse(jsonString);
//           const serverKey = data.SERVER_KEY;

//           // Fetch user tokens from database
//           const pushTokens = await userModel
//             .find()
//             .select({ _id: 0, token: 1 });

//           if (pushTokens.length === 0) {
//             return res
//               .status(400)
//               .send({ status: false, message: "No users found" });
//           }

//           if (pushTokens.length > 0) {
//             const fcm = new FCM(serverKey);
//             const pushMessage = {
//               registration_ids: pushTokens.map((token) => token.token),
//               priority: "high",
//               content_available: true,
//               mutable_content: true,
//               notification: {
//                 title: title, // Header
//                 body: message, // Content
//                 icon: imgIcon, // Modified Icon URL
//                 sound: "default",
//               },
//             };

//             // Send push notifications
//             fcm.send(pushMessage, function (err, response) {
//               if (err) {
//                 console.log("Failed to send notification:", err);
//                 return res
//                   .status(500)
//                   .send({
//                     status: false,
//                     message: "Failed to send notification",
//                   });
//               } else {
//                 console.log("Notification sent successfully:", response);
//                 return res
//                   .status(200)
//                   .send({
//                     status: true,
//                     message: "Notification sent successfully",
//                   });
//               }
//             });
//           }
//         } catch (err) {
//           console.log("Error:", err.message);
//           // Handle error accordingly
//         }
//       }
//     );
//   } catch (error) {
//     console.log("Error:", error.message);
//     // Handle error accordingly
//   }
// };

// const multer = require('multer');
// const sharp = require('sharp');

// // Multer configuration for file upload
// // const upload = multer({ dest: 'uploads/' });

const sendingNotificationToAll = async function (req, res) {
  try {
    let { message, title, imgIcon } = req.body;
    // let imgIcon = req.file; // Uploaded icon file

    // console.log("message===", req.body);
    // console.log("imgIcon===", imgIcon);
    if (!message || !title || !imgIcon) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Message, title, and icon all are required",
        });
    }
    // Read Firebase service account JSON
    fs.readFile(
      path.join(__dirname, "../firebaseService.json"),
      "utf8",
      async (err, jsonString) => {
        if (err) {
          console.log("Error reading file from disk:", err);
          throw err;
        }
        try {
          const data = JSON.parse(jsonString);
          const serverKey = data.SERVER_KEY;

          // Fetch user tokens from the database
          const pushTokens = await userModel
            .find()
            .select({ _id: 0, token: 1 });

          if (pushTokens.length === 0) {
            return res
              .status(400)
              .send({ status: false, message: "No users found" });
          }

          // Create FCM instance
          const fcm = new FCM(serverKey);

          // Prepare push message with resized icon
          const pushMessage = {
            registration_ids: pushTokens.map((token) => token.token),
            priority: "high",
            content_available: true,
            mutable_content: true,
            notification: {
              title: title,
              body: message,
              image: imgIcon,
              sound: "default",
            },
          };
          // Send push notifications
          fcm.send(pushMessage, function (err, response) {
            if (err) {
              console.log("Failed to send notification:", err);
              return res.status(500).send({
                status: false,
                message: "Failed to send notification",
              });
            } else {
              console.log("Notification sent successfully:", response);
              return res.status(200).send({
                status: true,
                message: "Notification sent successfully",
              });
            }
          });
        } catch (err) {
          console.log("Error:", err.message);
          // Handle error accordingly
        }
      }
    );
  } catch (error) {
    console.log("Error:", error.message);
    // Handle error accordingly
  }
};

// Update your route to handle file uploads
// app.post('/send-notification', upload.single('icon'), sendingNotificationToAll);

module.exports = {
  sendNotification,
  pushNotification,
  sendingNotificationToAll,
};
