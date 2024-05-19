const express = require("express");
const router = express.Router();
const defineUser = require("../../models/users");
const { DataTypes } = require("sequelize");
const roles = require("./roles");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = function (sequelize) {
  const User = defineUser(sequelize, DataTypes);

  router.post("/signup", async (req, res) => {
    try {
      const { email, password, username, avatarPath } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const userCount = await User.count();
      const initialRole =
        userCount > 0
          ? roles.findIndex((entry) => entry.uid === "user")
          : roles.findIndex((entry) => entry.uid === "admin");

      const user = await User.create({
        email,
        password: hashedPassword,
        username: username,
        role: initialRole,
        avatarPath: avatarPath,
      });

      const accessToken = jwt.sign({ userId: user.id }, "your-secret-key", {
        expiresIn: "1h",
      });

      user.password = undefined;
      res.status(200).json({ access_token: accessToken, user });
    } catch (error) {
      console.error(error);
      res.status(500).send("Sign up failed");
    }
  });

  return router;
};
