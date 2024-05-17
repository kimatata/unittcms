const express = require("express");
const router = express.Router();
const defineUser = require("../../models/users");
const { DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  const User = defineUser(sequelize, DataTypes);

  router.post("/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({
        where: {
          email: email,
        },
      });
      if (!user) {
        return res.status(401).json({ error: "Authentication failed" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Authentication failed" });
      }
      const token = jwt.sign({ userId: user.id }, "your-secret-key", {
        expiresIn: "1h",
      });
      res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).send("Sign up failed");
    }
  });

  return router;
};
