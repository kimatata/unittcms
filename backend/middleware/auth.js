const jwt = require('jsonwebtoken');
const { defaultDangerKey } = require('../routes/auth/authSettings');
const defineProject = require('../models/projects');
const { DataTypes } = require('sequelize');

function authMiddleware(sequelize) {
  /**
   * Verify user sined in
   *
   * If verification is successful, set userId in req.userId.
   */
  function verifySignedIn(req, res, next) {
    const authHeader = req.header('Authorization');
    const secretKey = process.env.SECRET_KEY || defaultDangerKey;

    const token = authHeader.split(' ')[1]; // delete 'Bearer '
    if (!token) {
      return res.status(401).json({ error: 'Access denied' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      req.userId = decoded.userId;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  /**
   * Verify user can access project
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectVisible(req, res, next) {
    const Project = defineProject(sequelize, DataTypes);

    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    // if project is private, only project owner can access
    if (!project.isPublic && project.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  }

  /**
   * Verify user has project
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectOwner(req, res, next) {
    const Project = defineProject(sequelize, DataTypes);

    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  }

  return { verifySignedIn, verifyProjectVisible, verifyProjectOwner };
}

module.exports = authMiddleware;
