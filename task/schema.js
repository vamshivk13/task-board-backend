const mongoose = require("mongoose");

const task = new mongoose.Schema({
  task: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  note: { type: String, required: true },
  isDone: { type: Boolean, required: true },
  createdAt: { type: Date, required: true },
});
const taskSchema = new mongoose.Schema({
  tasksListId: { type: String, required: true, unique: true },
  taskName: { type: String, required: true },
  tasks: { type: [task], default: [], required: false },
  userId: { type: String, required: true },
});

module.exports = mongoose.model("Task", taskSchema);
