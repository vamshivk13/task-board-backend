const express = require("express");

const router = express.Router();
const qs = require("qs");
const axios = require("axios");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");
const User = require("./schema.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;
const secret = process.env.SECRET;
const redirectUrl = process.env.AUTH_REDIRECT_URL + "user/auth/google/callback";
const clientId = process.env.CLIENTID;

// auth via token
router.post("/auth/token", async (req, res) => {
  try {
    const token = req.body.token;
    const response = jwt.verify(token, jwtSecret);
    return res.json(response);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

//get email, password, confirm password
router.post("/register", async (req, res) => {
  try {
    if ((await checkIfUserExist(req.body.email)) != null) {
      return res.status(400).send("User already exist");
    }

    const userInfo = {
      ...req.body,
    };
    const userId = uuid();
    const hashedPassword = await bcrypt.hash(userInfo.password, 10);
    const newUser = new User({
      ...userInfo,
      password: hashedPassword,
      authMethod: "custom",
      userId: userId,
    });
    newUser.save();
    const updatedUserInfo = {
      name: newUser.name,
      email: newUser.email,
      userId: userId,
      authMethod: newUser.authMethod,
      createdAt: newUser.createdAt,
    };
    const jwtToken = jwt.sign({ ...updatedUserInfo }, jwtSecret);
    return res.json({ token: jwtToken, user: updatedUserInfo });
  } catch (err) {
    console.log("REGISTRATION ERROR", err);
    return res.status(500).send("Error while registering the user");
  }
});

//get email, password
router.post("/login", async (req, res) => {
  try {
    const user = req.body;
    const userExist = await checkIfUserExist(user.email);

    if (userExist) {
      const matchingUser = await authenticateUserWithCredentials(user);
      if (matchingUser) {
        const userDetails = {
          userId: matchingUser.userId,
          email: matchingUser.email,
          name: matchingUser.name,
          authMethod: matchingUser.authMethod,
          createdAt: matchingUser.createdAt,
        };
        const jwtToken = jwt.sign(userDetails, jwtSecret);
        return res.json({ token: jwtToken, user: userDetails });
      } else res.status(401).send("User Not Authorised");
    } else {
      return res.status(404).send("User not found");
    }
  } catch (err) {
    console.log("Login Error", err);
    return res.status(500).send("Error while logging in");
  }
});

async function checkIfUserExist(email) {
  try {
    const user = await User.findOne({ email });
    console.log("USER CHECK", user);
    if (user) {
      return user;
    } else return null;
  } catch (err) {
    console.error("Error fetching user:", err);
  }
}

async function authenticateUserWithCredentials(user) {
  const email = user.email;
  const password = user.password;
  const userWithMatchingCredentials = await User.findOne({
    email: email,
  });
  const isAuthenticatedUser =
    userWithMatchingCredentials &&
    bcrypt.compare(password, userWithMatchingCredentials.password);
  if (isAuthenticatedUser) {
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

    let userExist = await checkIfUserExist(userInfo.email);
    // Set user info in cookies (optional)
    if (!userExist) {
      const newUser = new User({
        name: userInfo.name,
        email: userInfo.email,
        password: null,
        authMethod: "google",
        userId: uuid(),
      });
      const user = newUser.save();
      userExist = user;
      res.cookie("user", JSON.stringify(user), {
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

    res
      .status(200)
      .redirect(
        `${process.env.REDIRECT_URL + "?user=" + JSON.stringify(userExist)}`
      );
  } catch (error) {
    console.error("Error during Google OAuth:", error.message);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;
