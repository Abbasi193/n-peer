const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const messageSchema = new Schema({
    message : {
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
const Message = mongoose.model('Message',messageSchema);
module.exports = Message;