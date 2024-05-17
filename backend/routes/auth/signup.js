const express = require("express");
const router = express.Router();
const defineUser = require("../../models/users");
const { DataTypes } = require("sequelize");
const roles = require("./roles");

module.exports = function (sequelize) {
  const User = defineUser(sequelize, DataTypes);

  router.post("/auth/signup", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const userCount = await User.count();
      const initialRole =
        userCount > 0
          ? roles.findIndex((entry) => entry.uid === "user")
          : roles.findIndex((entry) => entry.uid === "admin");

      await User.create({
        email,
        password: hashedPassword,
        username: username,
        role: initialRole,
        avatarPath: null,
      });
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).send("Sign up failed");
    }
  });

  return router;
};
