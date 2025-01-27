const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  id: { type: String, unique: true },
  boardName: { type: String, required: true },
  userId: { type: String, required: true },
});

module.exports = mongoose.model("Board", schema);
