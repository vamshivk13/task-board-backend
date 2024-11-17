const express = require("express");
const router = express.Router();
const TaskList = require("./schema.js");

router.post("/create/list", async (req, res) => {
  const taskList = req.body;
  try {
    const newTaskList = new TaskList(taskList);
    const savedTaskList = newTaskList.save();
    if (savedTaskList) res.status(201).json(savedTaskList);
  } catch (err) {
    res.status(500).send("Error saving List");
  }
});

router.post("/create/task", async (req, res) => {
  const task = req.body.task;
  const tasksListId = req.body.tasksListId;

  try {
    const newTask = await TaskList.updateOne(
      { tasksListId: tasksListId },
      { $push: { tasks: task } }
    );
    if (newTask) {
      res.status(201).json(newTask);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error saving new Task");
  }
});

router.post("/lists", async (req, res) => {
  const userId = req.body.userId;
  try {
    const lists = await TaskList.find({ userId: userId });
    if (lists) {
      res.status(200).json(lists);
    }
  } catch (err) {
    console.log(error);
    res.status(500).send("Error getting lists");
  }
});

router.post("/update", async (req, res) => {
  const task = req.body.task;
  const tasksListId = req.body.tasksListId;
  try {
    const updatedTask = await TaskList.updateOne(
      { tasksListId: tasksListId, "tasks.id": task.id },
      { $set: { "tasks.$": task } }
    );
    if (updatedTask) {
      res.status(200).json(updatedTask);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating Task");
  }
});

router.post("/update/list", async (req, res) => {
  const tasksListId = req.body.tasksListId;
  const taskName = req.body.taskName;

  try {
    const updatedTask = await TaskList.updateOne(
      { tasksListId: tasksListId },
      { $set: { taskName: taskName } }
    );
    if (updatedTask) {
      res.status(200).json(updatedTask);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating Task");
  }
});

router.post("/update/task", async (req, res) => {
  const tasksListId = req.body.tasksListId;
  const updatedTasks = req.body.updatedTasks;
  console.log("updateList", req.body);
  try {
    const updatedTask = await TaskList.updateMany(
      { tasksListId: tasksListId },
      { $set: { tasks: updatedTasks } }
    );
    if (updatedTask) {
      res.status(200).json(updatedTask);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating Task");
  }
});

router.post("/delete", async (req, res) => {
  const task = req.body.task;
  const tasksListId = req.body.tasksListId;

  try {
    const updatedTask = await TaskList.updateOne(
      { tasksListId: tasksListId, "tasks.id": task.id },
      { $pull: { tasks: task } }
    );
    if (updatedTask) {
      res.status(200).send("Delete success");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating Task");
  }
});

module.exports = router;
