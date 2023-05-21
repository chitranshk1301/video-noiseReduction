const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    link: {
        required: true,
        type: String
    }
})

module.exports = mongoose.model('Data', dataSchema)