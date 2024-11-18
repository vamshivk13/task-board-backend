const express = require("express");

const router = express.Router();
const qs = require("qs");
const axios = require("axios");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");
const User = require("./schema.js");

//get email, password, confirm password
router.post("/register", async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).send("Error while registering the user");
  }
});

//get email, password
router.post("/login", async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).send("Error while logging in");
  }
});

const secret = process.env.SECRET;
const redirectUrl = process.env.AUTH_REDIRECT_URL + "user/auth/google/callback";
const clientId = process.env.CLIENTID;
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
  try {
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
  } catch {
    res.status(500).send("Error logging in via google");
  }
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
      newUser.save();
      res.cookie("user", JSON.stringify(newUser), {
        sameSite: "none",
        secure: true,
        path: "/",
        // domain: "task-board-backend-cbnz.onrender.com",
      });
    } else {
      res.cookie("user", JSON.stringify(userInfo), {
        sameSite: "none",
        secure: true,
        path: "/",
        // domain: "task-board-backend-cbnz.onrender.com",
      });
    }

    res.status(200).redirect(process.env.REDIRECT_URL);
  } catch (error) {
    console.error("Error during Google OAuth:", error.message);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;
