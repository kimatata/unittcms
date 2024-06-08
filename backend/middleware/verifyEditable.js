const { memberRoles } = require('../routes/users/authSettings');
const { DataTypes } = require('sequelize');
const defineMember = require('../models/members');
const defineProject = require('../models/projects');
const defineFolder = require('../models/folders');
const defineCase = require('../models/cases');
const defineRun = require('../models/runs');

function verifyEditableMiddleware(sequelize) {
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
   * Verify user is manager of the project by projectId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectManagerFromProjectId(req, res, next) {
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
   * Verify user is developer of the project by projectId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectDeveloperFromProjectId(req, res, next) {
    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const isDeveloperRet = await isDeveloper(projectId, req.userId);
    if (isDeveloperRet) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  /**
   * Verify user is developer of the project by folderId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectDeveloperFromFolderId(req, res, next) {
    const Folder = defineFolder(sequelize, DataTypes);

    const folderId = req.params.folderId || req.query.folderId;
    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    // find project id from folderId
    const folder = await Folder.findByPk(folderId);
    const projectId = folder && folder.projectId;
    if (!projectId) {
      return res.status(404).send('failed to find projectId');
    }

    const isDeveloperRet = await isDeveloper(projectId, req.userId);
    if (isDeveloperRet) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  /**
   * Verify user is developer of the project by caseId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectDeveloperFromCaseId(req, res, next) {
    const Project = defineProject(sequelize, DataTypes);
    const Folder = defineFolder(sequelize, DataTypes);
    const Case = defineCase(sequelize, DataTypes);
    Project.hasMany(Folder, { foreignKey: 'projectId' });
    Folder.hasMany(Case, { foreignKey: 'folderId' });
    Folder.belongsTo(Project, { foreignKey: 'projectId' });
    Case.belongsTo(Folder, { foreignKey: 'folderId' });

    const caseId = req.params.caseId || req.query.caseId;
    if (!caseId) {
      return res.status(400).json({ error: 'caseId is required' });
    }

    // find project id from caseId
    const testCase = await Case.findByPk(caseId, {
      include: {
        model: Folder,
        include: Project,
      },
    });

    const projectId = testCase && testCase.Folder && testCase.Folder.Project && testCase.Folder.Project.id;
    if (!projectId) {
      return res.status(404).send('failed to find projectId');
    }

    const isDeveloperRet = await isDeveloper(projectId, req.userId);
    if (isDeveloperRet) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  async function isDeveloper(projectId, userId) {
    const Project = defineProject(sequelize, DataTypes);
    const Member = defineMember(sequelize, DataTypes);
    Project.hasMany(Member, { foreignKey: 'projectId' });
    Member.belongsTo(Project, { foreignKey: 'projectId' });

    const project = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: Member,
          where: { userId: userId },
          required: false,
        },
      ],
    });
    if (!project) {
      return false;
    }

    // owner has developer or higher authority
    if (project.userId === userId) {
      return true;
    }

    const member = project.Members && project.Members[0];
    if (member) {
      const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
      const developerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'developer');
      if (member.role === managerRoleIndex || member.role === developerRoleIndex) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verify user is reporter of the project by projectId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectReporterFromProjectId(req, res, next) {
    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const isReporterRet = await isReporter(projectId, req.userId);
    if (isReporterRet) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  /**
   * Verify user is reporter of the project by runId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectReporterFromRunId(req, res, next) {
    const Run = defineRun(sequelize, DataTypes);

    const runId = req.params.runId || req.query.runId;
    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    // find project id from runId
    const run = await Run.findByPk(runId);
    const projectId = run && run.projectId;
    if (!projectId) {
      return res.status(404).send('failed to find projectId');
    }

    const isReporterRet = await isReporter(projectId, req.userId);
    if (isReporterRet) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  async function isReporter(projectId, userId) {
    const Project = defineProject(sequelize, DataTypes);
    const Member = defineMember(sequelize, DataTypes);
    Project.hasMany(Member, { foreignKey: 'projectId' });
    Member.belongsTo(Project, { foreignKey: 'projectId' });

    const project = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: Member,
          where: { userId: userId },
          required: false,
        },
      ],
    });
    if (!project) {
      return false;
    }

    // owner has reporter or higher authority
    if (project.userId === userId) {
      return true;
    }

    const member = project.Members && project.Members[0];
    if (member) {
      const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
      const developerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'developer');
      const reporterRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'reporter');
      if (member.role === managerRoleIndex || member.role === developerRoleIndex || member.role === reporterRoleIndex) {
        return true;
      }
    }

    return false;
  }

  return {
    verifyProjectOwner,
    verifyProjectManagerFromProjectId,
    verifyProjectDeveloperFromProjectId,
    verifyProjectDeveloperFromFolderId,
    verifyProjectDeveloperFromCaseId,
    verifyProjectReporterFromProjectId,
    verifyProjectReporterFromRunId,
  };
}

module.exports = verifyEditableMiddleware;
