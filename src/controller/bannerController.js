// const azureStorage = require('azure-storage');
// const azureBlobStorage = require("../config/azureCredential");
// const multer = require('multer');
// const path = require("path");
// const bannerModel = require('../model/bannersModel');
//   const fs = require('fs');
//   const compressAndUploadImage = async (bannerImage, name) => {
//     try {
//         const blobName = name;
//         const containerName = 'score11banner'
//         // Read the file content
//         const fileContent = fs.readFileSync(bannerImage.path);

//         await new Promise((resolve, reject) => {
//             azureBlobStorage.blobService.createBlockBlobFromText(
//                 containerName,
//                 blobName,
//                 fileContent, // Pass the file content as a Buffer
//                 {
//                     contentType: bannerImage.mimetype, // Set the content type based on the uploaded file type
//                 },
//                 async (error, result, response) => {
//                     if (!error) {
//                         console.log(
//                             ` uploaded to Azure Blob Storage as ${blobName}.`
//                         );
//                         resolve();
//                     } else {
//                         console.error(
//                             `Error uploading image to Azure Blob Storage.`
//                         );
//                         reject(error);
//                     }
//                 }
//             );
//         });

//         // Store image information in Azure Blob Storage and the database (imageModel)
//         const imageUrl = azureBlobStorage.blobService.getUrl(containerName, blobName);
//         console.log(`Image url ${imageUrl}.`);
//         return imageUrl;

//     } catch (error) {
//         console.error(`Error processing image : ${error}`);
//         throw error;
//     }
// };

// const createBanner = async function (req, res){
//     try {
//         const containerName = "score11banner";
//         // Ensure that the container exists
//         azureBlobStorage.createContainerIfNotExists(containerName);

//         // Fetch data 
//         let {name} = req.body;
//         const bannerImage = req.file; // Multer will add the uploaded file to req.file
   
//         // Validate data
//         if (!name || !bannerImage) {
//             return res.status(400).send({ success: false, message: "Banner Image and name of the image are required" });
//         }

//         // Check if dish already exists
//         const checkImage = await bannerModel.findOne({ name });

//         if (checkImage) {
//             return res.status(409).send({ success: false, message: "This Image is already exists" });
//         }

//         // Upload image to Azure Blob Storage and get the image URL
//         const imageUrl = await compressAndUploadImage(bannerImage, name);

//         // Create dish entry in the database with the Azure Blob Storage image link
//         const createBanner = await bannerModel.create({
//             name,
//             image:imageUrl,
//             uploadedAt: new Date()
//         });

//         return res.status(201).send({
//             success: true,
//             message: "New Banner added successfully",
//             data: createBanner
//         });

//     } catch (error) {
//         console.log(error);
//         return res.status(500).send({ success: false, message: error.message });
//     }
// };

// module.exports = {createBanner}