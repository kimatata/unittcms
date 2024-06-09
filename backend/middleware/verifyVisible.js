const { DataTypes } = require('sequelize');
const defineMember = require('../models/members');
const defineProject = require('../models/projects');
const defineFolder = require('../models/folders');
const defineCase = require('../models/cases');
const defineRun = require('../models/runs');

function verifyVisibleMiddleware(sequelize) {
  /**
   * Verify user can read project by projectId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectVisibleFromProjectId(req, res, next) {
    let projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const isVisble = await isVisible(projectId, req.userId);
    if (isVisble) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  /**
   * Verify user can read project by folderId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectVisibleFromFolderId(req, res, next) {
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

    const isVisble = await isVisible(projectId, req.userId);
    if (isVisble) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  async function verifyProjectVisibleFromCaseId(req, res, next) {
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

    const isVisble = await isVisible(projectId, req.userId);
    if (isVisble) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  /**
   * Verify user can read project by runId
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyProjectVisibleFromRunId(req, res, next) {
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

    const isVisble = await isVisible(projectId, req.userId);
    if (isVisble) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  async function isVisible(projectId, userId) {
    const Project = defineProject(sequelize, DataTypes);
    const Member = defineMember(sequelize, DataTypes);
    Project.hasMany(Member, { foreignKey: 'projectId' });
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

    // if project is public, everyone can see
    if (project.isPublic) {
      return true;
    }

    // if project is private, owner and project member can see
    if (project.userId === userId) {
      return true;
    }

    const member = project.Members && project.Members[0];
    if (member) {
      return true;
    }

    return false;
  }

  return {
    verifyProjectVisibleFromProjectId,
    verifyProjectVisibleFromFolderId,
    verifyProjectVisibleFromCaseId,
    verifyProjectVisibleFromRunId,
  };
}

module.exports = verifyVisibleMiddleware;
