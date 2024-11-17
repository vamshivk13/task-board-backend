const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); // Allow methods
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow headers
  next();
});
const userRoute = require("./user/user.js");
const taskRoute = require("./task/task.js");

app.use("/user", userRoute);
app.use("/task", taskRoute);

app.get("/", (req, res) => {
  console.log("get at ", req.path);
  return res.send("Hello this is a test");
});

//setting server on a port
app.listen("3000", () => {
  console.log("APP running on port 3000");
});

//setting mongodb
const uri =
  "mongodb+srv://taskBoardUser:vk123456$@cluster0.nziuj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(uri)
  .then((res) => {
    console.log("Successfully connected to mongodb");
  })
  .catch((err) => {
    console.log("Error connecting to Mongodb database", err);
  });
