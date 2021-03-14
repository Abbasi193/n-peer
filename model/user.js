const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    name : {
        required : true,
        type : String ,
        minlength : 3,        
    },
    phoneNo : {
        required : true,
        unique : true,
        type : String ,
        minlength : 11,
    },
    password : {
        required : true,
        type : String ,
        minlength : 8,
    },

});
const User = mongoose.model('User',userSchema);
module.exports = User;