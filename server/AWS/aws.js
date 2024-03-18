// const dotenv = require('dotenv');
// dotenv.config();
// // const { s3 } = require("../AWS/aws");


// // AWS
// const multer = require("multer");
// const AWS = require("aws-sdk");
// const path = require("path");

// process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

// AWS.config.update({
//     accessKeyId: process.env.ACCESS_KEY_ID,
//     secretAccessKey: process.env.SECRET_ACCESS_KEY,
//     region: process.env.REGION
// });

// const s3 = new AWS.S3();
// const dynamodb = new AWS.DynamoDB.DocumentClient();

// const bucketName = process.env.S3_BUCKET_NAME;
// const tableName = process.env.DYNAMODB_TABLE_NAME;
// const storage = multer.memoryStorage({
//     destination: function (req, file, callback) {
//         callback(null, "");
//     }
// });

// const upload = multer({
//     storage,
//     limits: { fileSize: 5000000 },
//     fileFilter: function (req, file, callback) {
//         checkFileType(file, callback);
//     },
// });

// function checkFileType(file, callback) {
//     const fileTypes = /jpeg|jpg|png|gif/;
//     const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimeType = fileTypes.test(file.mimetype);
//     if (extname && mimeType) {
//         return callback(null, true);
//     }
//     return callback("Chỉ chấp nhận file ảnh /jpeg|jpg|png|gif/!");
// }




// module.exports = { upload, s3, bucketName };