const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    firstName: { type: String, required: true },
    city: { type: String, default: '' },
    isBlocked: { type: Boolean, default: false }
});

// For faster queries
userSchema.index({ chatId: 1 });
module.exports = mongoose.model('User', userSchema);
