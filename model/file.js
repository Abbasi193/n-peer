const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const fileSchema = new Schema({
    name : {
        required : true,
        type : String      
    },
    type : {
        required : true,
        type : String      
    },
    recipient : {
        required : true,
        type : String      
    },
    sender : {
        required : true,
        type : String      
    },

});

const File = mongoose.model('File', fileSchema);
module.exports = File;