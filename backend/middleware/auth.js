const jwt = require('jsonwebtoken');
const { roles, memberRoles, defaultDangerKey } = require('../routes/users/authSettings');
const { DataTypes } = require('sequelize');
const defineUser = require('../models/users');
const defineMember = require('../models/members');
const defineProject = require('../models/projects');
const defineFolder = require('../models/folders');

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
   * Verify user is admin
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyAdmin(req, res, next) {
    const User = defineUser(sequelize, DataTypes);
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // if project is private, only project owner can access
    const adminRoleIndex = roles.findIndex((entry) => entry.uid === 'administrator');
    if (user.role !== adminRoleIndex) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  }

  /**
   * Verify user can access project
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectVisible(req, res, next) {
    const Project = defineProject(sequelize, DataTypes);

    const projectId = req.params.projectId || req.query.projectId;
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

  /**
   * Verify user has permission of project management
   * (User must be the owner or manager of the project)
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectManager(req, res, next) {
    const Project = defineProject(sequelize, DataTypes);

    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    if (project.userId === req.userId) {
      next();
      return;
    }

    // check the user is manager of the project
    const Member = defineMember(sequelize, DataTypes);
    const member = await Member.findOne({
      where: {
        userId: req.userId,
        projectId: projectId,
      },
    });
    if (member) {
      const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
      if (member.role === managerRoleIndex) {
        next();
        return;
      }
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  /**
   * Verify user has permission of project development
   * (User must be the owner or manager or developer of the project)
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectDeveloper(req, res, next) {
    const Project = defineProject(sequelize, DataTypes);
    const Folder = defineFolder(sequelize, DataTypes);

    let projectId = req.params.projectId || req.query.projectId;
    const folderId = req.params.folderId || req.query.folderId;
    if (!projectId && !folderId) {
      return res.status(400).json({ error: 'projectId or folderId is required' });
    }

    if (!projectId) {
      // find project id from folderId
      const folder = await Folder.findByPk(folderId);
      if (folder && folder.projectId) {
        projectId = folder.projectId;
      } else {
        return res.status(404).send('failed to find project from folderId');
      }
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    if (project.userId === req.userId) {
      next();
      return;
    }

    // check the user is manager or developer of the project
    const Member = defineMember(sequelize, DataTypes);
    const member = await Member.findOne({
      where: {
        userId: req.userId,
        projectId: projectId,
      },
    });
    if (member) {
      const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
      const developerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'developer');
      if (member.role === managerRoleIndex || member.role === developerRoleIndex) {
        next();
        return;
      }
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  return {
    verifySignedIn,
    verifyAdmin,
    verifyProjectVisible,
    verifyProjectOwner,
    verifyProjectManager,
    verifyProjectDeveloper,
  };
}

module.exports = authMiddleware;
