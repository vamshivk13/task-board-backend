const express = require("express");
const router = express.Router();
const Board = require("./boardSchema");

router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    const findResponse = await Board.find({ userId: userId });
    console.log("Find Response", findResponse);
    return res.status(200).json(findResponse);
  } catch (err) {
    return res.status(500).send("Error retrieving board details of user");
  }
});

router.post("/create", async (req, res) => {
  try {
    const boardData = req.body;
    const board = new Board(boardData);
    const savedResponse = await board.save();
    console.log("Save Response", savedResponse);
    return res.status(201).send("SUCCESS");
  } catch (err) {
    console.log("Error saving board ", err);
    res.status(500).send("Error saving Board Details");
  }
});
router.delete("/delete", async (req, res) => {
  try {
    const boardId = req.query.id;
    const deletedResponse = await Board.deleteOne({ id: boardId });
    if (deletedResponse.deletedCount == 1) {
      return res.status(200).send("Successfully deleted");
    } else {
      return res.status(404).send("Not Found");
    }
  } catch (err) {
    console.log("Error deleting board ", err);
    res.status(500).send("Error deleting Board Details");
  }
});

router.put("/update", async (req, res) => {
  try {
    const updatedBoard = req.body;
    const updatedResponse = await Board.updateOne(
      { id: updatedBoard?.id },
      updatedBoard
    );
    console.log("Updated Response", updatedResponse);
    if (updatedResponse.modifiedCount == 1) {
      return res.status(200).send("Successfully updated");
    } else {
      return res.status(404).send("Not Found");
    }
  } catch (err) {
    console.log("Error updating board ", err);
    res.status(500).send("Error updating Board Details");
  }
});

module.exports = router;
