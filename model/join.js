const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const joinSchema = new Schema({
    userId : {
        required : true,
        type : String ,     
    },
    groupId : {
        required : true,
        type : String ,
    }

});
const Join = mongoose.model('Join',joinSchema);
module.exports = Join;