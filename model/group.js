const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const groupSchema = new Schema({
    name : {
        required : true,
        type : String ,
        minlength : 3,        
    },
});
const Group = mongoose.model('Group',groupSchema);
module.exports = Group;