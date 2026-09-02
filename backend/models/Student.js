const mongoose = require('mongoose');
const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNo: { type: Number, required: true, unique: true },
  category: { type: String, enum: ['Orphan','Needy','General'], default: 'General' },
  guardianName: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
  address: { type: String, trim: true },
  admissionDate: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model('Student', StudentSchema);