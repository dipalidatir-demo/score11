const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
    bannerName:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    // uploadedAt:{
    //     type:Date,
    //     // required:true
    // }
},{timestamps:true});

module.exports = mongoose.model('Banner', bannerSchema);