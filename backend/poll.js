const mongoose = require('mongoose');

// Define the option schema
const optionSchema = new mongoose.Schema({
  id: {
    type: String, // Change from Number to String for custom ID
    required: true
  },
  optionName: {
    type: String,
    required: true // Add required validation
  },
  optionCount: {
    type: Number,
    default: 0
  }
});

// Define the poll schema
const pollSchema = new mongoose.Schema({
  _id: {
    type: String, // Specify that the poll ID will be a string
    required: true // Ensure that the ID is required
  },
  pollTitle: {
    type: String,
    required: true // Add required validation for the poll title
  },
  options: [optionSchema]
});

// Export the Poll model
module.exports = mongoose.model('Poll', pollSchema);
