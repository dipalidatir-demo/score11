// const azure = require('azure-storage');

// const storageAccount = 'storeimagesinazure';
// const storageAccessKey = 'BTzBs36CoQOBrRsjeA+VViNVNiMIn1aH0QXN/KshGf2+qPGpMVcTbwCe8lo8ZcQUBBS+aOVzgRDs+ASt7/NMFw==';

// const blobService = azure.createBlobService(storageAccount, storageAccessKey);

// const createContainerIfNotExists = (containerName) => {
//   blobService.createContainerIfNotExists(containerName, { publicAccessLevel: 'blob' }, (error, result, response) => {
//     if (!error) {
//       console.log(`Container "${containerName}" exists or was created successfully.`);
//     } else {
//       console.error(`Error creating container: ${error}`);
//     }
//   });
// };

// module.exports = { createContainerIfNotExists, blobService};