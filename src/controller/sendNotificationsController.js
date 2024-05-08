const fs = require("fs");
const path = require("path");
var FCM = require("fcm-node");
const userModel = require("../model/userModel");
const { validationResult } = require("express-validator");
const azureStorage = require('azure-storage');
const azureBlobStorage = require("../config/azureCredential");
const multer = require('multer');
// const path = require("path");
const azure = require('azure-storage');
const bannerModel = require('../model/bannersModel');
const sharp = require('sharp');
  // const fs = require('fs');
  const storageAccount = "storeimagesinazure";
  const storageAccessKey =
    "BTzBs36CoQOBrRsjeA+VViNVNiMIn1aH0QXN/KshGf2+qPGpMVcTbwCe8lo8ZcQUBBS+aOVzgRDs+ASt7/NMFw==";
  
  const blobService = azure.createBlobService(storageAccount, storageAccessKey);
//_________________compress for icon_____________________________
const compressAndUploadImageForNotification = async (imgIcon, name) => {
  try {
      const blobName = name;
      const containerName = 'notificationicon';
      const compressedImageBuffer = await sharp(imgIcon.path) // Read the uploaded image file
          .resize(256, 256) // Resize the image to 256x256
          .toBuffer(); // Convert the image to a Buffer
      
      await new Promise((resolve, reject) => {
          azureBlobStorage.blobService.createBlockBlobFromText(
              containerName,
              blobName,
              compressedImageBuffer, // Use the resized image buffer
              {
                  contentType: imgIcon.mimetype, // Set the content type based on the uploaded file type
              },
              async (error, result, response) => {
                  if (!error) {
                      console.log(`Image uploaded to Azure Blob Storage as ${blobName}.`);
                      resolve();
                  } else {
                      console.error(`Error uploading image to Azure Blob Storage.`);
                      reject(error);
                  }
              }
          );
      });

      // Get the URL of the uploaded image
      const imageUrl = azureBlobStorage.blobService.getUrl(containerName, blobName);
      console.log(`Image URL: ${imageUrl}`);
      return imageUrl;

  } catch (error) {
      console.error(`Error processing image: ${error}`);
      throw error;
  }
};

  
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
//_________________sending notification to all________________________
const sendingNotificationToAll = async function (req, res) {
  try {
    const containerName = "notificationicon";
        // Ensure that the container exists
        azureBlobStorage.createContainerIfNotExists(containerName);
    let { message, title } = req.body;
    // let imgIcon = req.file; // Uploaded icon file

     console.log("message===", title);
     const imgIcon = req.file; // Multer will add the uploaded file to req.file
     console.log("bannerImage====>", imgIcon);

    // console.log("imgIcon===", imgIcon);
    if (!message || !title || !imgIcon) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Message, title, and icon all are required",
        });
    }
    
    // Upload image to Azure Blob Storage and get the image URL
        const imageUrl = await compressAndUploadImageForNotification(imgIcon, title);
        console.log("return imageUrl===>",imageUrl);
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
              image: imageUrl,
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

  const compressAndUploadImage = async (bannerImage, name) => {
    try {
        const blobName = name;
        const containerName = 'score11banner'
        // Read the file content
        const fileContent = fs.readFileSync(bannerImage.path);

        await new Promise((resolve, reject) => {
            azureBlobStorage.blobService.createBlockBlobFromText(
                containerName,
                blobName,
                fileContent, // Pass the file content as a Buffer
                {
                    contentType: bannerImage.mimetype, // Set the content type based on the uploaded file type
                },
                async (error, result, response) => {
                    if (!error) {
                        console.log(
                            ` uploaded to Azure Blob Storage as ${blobName}.`
                        );
                        resolve();
                    } else {
                        console.error(
                            `Error uploading image to Azure Blob Storage.`
                        );
                        reject(error);
                    }
                }
            );
        });

        // Store image information in Azure Blob Storage and the database (imageModel)
        const imageUrl = azureBlobStorage.blobService.getUrl(containerName, blobName);
        console.log(`Image url ${imageUrl}.`);
        return imageUrl;

    } catch (error) {
        console.error(`Error processing image : ${error}`);
        throw error;
    }
};

const createBanner = async function (req, res){
    try {
        const containerName = "score11banner";
        // Ensure that the container exists
        azureBlobStorage.createContainerIfNotExists(containerName);

        // Fetch data 
        let {name} = req.body;
        console.log("name of the banner====>", name);
        const bannerImage = req.file; // Multer will add the uploaded file to req.file
        console.log("bannerImage====>", bannerImage);
        // Validate data
        if (!name || !bannerImage) {
            return res.status(400).send({ success: false, message: "Banner Image and name of the image are required" });
        }
        // Check if dish already exists
        const checkImage = await bannerModel.findOne({ name });

        if (checkImage) {
            return res.status(409).send({ success: false, message: "This Image is already exists" });
        }

        // Upload image to Azure Blob Storage and get the image URL
        const imageUrl = await compressAndUploadImage(bannerImage, name);

        // Create dish entry in the database with the Azure Blob Storage image link
        const createBanner = await bannerModel.create({
          bannerName:name,
            image:imageUrl
        });

        return res.status(201).send({
            success: true,
            message: "New Banner added successfully",
            data: createBanner
        });

    } catch (error) {
        console.log(error);
        return res.status(500).send({ success: false, message: error.message });
    }
};


//__________________________get images_________________________

const getBanner = async (req, res) => {
  try {
    const containerName = 'score11banner';
    console.log(`Fetching images for ${containerName} from Azure Blob Storage`);

    console.log(`Container ${containerName} exists, fetching images`);

    const fetchedImages = await new Promise((resolve, reject) => {
      blobService.listBlobsSegmented(
        containerName,
        null,
        (listError, listResult, listResponse) => {
          if (!listError) {
            const blobList = listResult.entries
              .filter((entry) => entry.name)
              .map((entry) => ({
                name: entry.name,
                link: blobService.getUrl(containerName, entry.name)
              }));
              // Log headers for debugging
            console.log('Response headers:', listResponse.headers);
            resolve(blobList);
          } else {
            console.error(
              `Error listing container images for ${containerName}: ${listError.message}`
            );
            reject(`Error listing container images for ${containerName}`);
          }
        }
      );
    });

    return res.status(200).send({ containerName, images: fetchedImages });

  } catch (error) {
    console.error(
      `Error fetching images for score11banner: ${error.message}`
    );
    return res.status(500).send({status:false, message:error.message});
  }
};

module.exports = {
  sendNotification,
  pushNotification,
  sendingNotificationToAll,
  createBanner,
  getBanner
};
