const express = require("express");

const router = express.Router();
const qs = require("qs");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");
const User = require("./schema.js");

//get email, password, confirm password
router.post("/register", async (req, res) => {
  if (checkIfUserExist(req.body.email)) {
    res.send(400).send("User already exist");
  }
  const userInfo = {
    ...req.body,
  };
  const userId = uuid();
  const newUser = new User({
    ...userInfo,
    authMethod: "custom",
    userId: userId,
  });
  newUser.save();
  // res.cookie("user", JSON.stringify(userInfo));
  res.json(userInfo);
});

//get email, password
router.post("/login", async (req, res) => {
  const user = req.body;
  const userExist = await checkIfUserExist(user.email);

  if (userExist) {
    const matchingUser = await authenticateUser(user);
    if (matchingUser) {
      console.log("USER", matchingUser);
      res.json(matchingUser);
    } else res.status(401).send("User Not Authorised");
  } else {
    res.status(404).send("User not found");
  }
});

const secret = "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";
const redirectUrl = "http://localhost:3000/user/auth/google/callback";
const clientId =
  "1095927862364-4lbd0q4ui5j6dcq9pep2au8ho5uv0qb2.apps.googleusercontent.com";

async function checkIfUserExist(email) {
  try {
    const user = await User.findOne({ email });
    if (user) {
      return true;
    } else return false;
  } catch (err) {
    console.error("Error fetching user:", err);
  }
}

async function authenticateUser(user) {
  const email = user.email;
  const password = user.password;
  const userWithMatchingCredentials = await User.findOne({
    email: email,
    password: password,
  });
  console.log("matching user", userWithMatchingCredentials);
  if (userWithMatchingCredentials) {
    return userWithMatchingCredentials;
  } else {
    return null;
  }
}

router.get("/auth", (req, res) => {
  const oauthURL = `https://accounts.google.com/o/oauth2/v2/auth?${qs.stringify(
    {
      client_id: clientId,
      redirect_uri: redirectUrl,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
    }
  )}`;
  console.log("URL", oauthURL);
  res.redirect(oauthURL);
});

router.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code not provided");
  }

  try {
    // Exchange code for tokens
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: clientId,
        client_secret: secret,
        redirect_uri: redirectUrl,
        grant_type: "authorization_code",
        code,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // Retrieve user information
    const { access_token, id_token } = data;
    const { data: userInfo } = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const userExist = await checkIfUserExist(userInfo.email);
    // Set user info in cookies (optional)
    if (!userExist) {
      const newUser = new User({
        name: userInfo.name,
        email: userInfo.email,
        password: null,
        authMethod: "google",
        userId: uuid(),
      });
      res.cookie("user", JSON.stringify(newUser));
      newUser.save();
    }
    // Display user info
    res.redirect("http://localhost:5173/");
  } catch (error) {
    console.error("Error during Google OAuth:", error.message);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;
