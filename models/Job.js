const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  payment: { type: Number, required: true },
  location: { type: String, required: true },
  acceptedBy: { type: String, default: '' },
});

module.exports = mongoose.model('Job', jobSchema);