const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, // Người gửi
  text: String,
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  isDelete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const MessageModel = mongoose.model("message", MessageSchema);
module.exports = MessageModel 
