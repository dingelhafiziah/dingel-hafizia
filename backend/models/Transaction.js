const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['INCOME','EXPENSE'], required: true },
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  donorName: { type: String, trim: true },
  description: { type: String, trim: true },
  receiptNo: { type: String, unique: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model('Transaction', TransactionSchema);