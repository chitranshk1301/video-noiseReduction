const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    link: {
        type: String,
        required: true
      }
})

module.exports = mongoose.model('Data', dataSchema)