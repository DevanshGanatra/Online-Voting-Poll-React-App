const mongoose = require('mongoose');
const voteSchema = new mongoose.Schema({
    ip: String,
    pollId: String
});

module.exports = mongoose.model('Vote', voteSchema);
