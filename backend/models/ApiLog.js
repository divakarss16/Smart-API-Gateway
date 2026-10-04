const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  status: { type: Number, required: true },
}, { timestamps: true });

const ApiLog = mongoose.model('ApiLog', apiLogSchema);
module.exports = ApiLog;
