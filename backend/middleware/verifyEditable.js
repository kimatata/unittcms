import { memberRoles } from '../routes/users/authSettings.js';

export default function verifyEditableMiddleware(db) {
  async function verifyProjectOwner(req, res, next) {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await db.repos.projects.findByPk(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  }

  async function verifyProjectManagerFromProjectId(req, res, next) {
    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await db.repos.projects.findByPk(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    if (project.userId === req.userId) {
      next();
      return;
    }

    const member = await db.repos.members.findOne({
      where: { userId: req.userId, projectId: projectId },
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

  async function verifyProjectDeveloperFromFolderId(req, res, next) {
    const folderId = req.params.folderId || req.query.folderId;
    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    const folder = await db.repos.folders.findByPk(folderId);
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

  async function verifyProjectDeveloperFromCaseId(req, res, next) {
    const caseId = req.params.caseId || req.query.caseId;
    if (!caseId) {
      return res.status(400).json({ error: 'caseId is required' });
    }

    const testCase = await db.repos.cases.findByPk(caseId, {
      include: {
        model: db.models.Folder,
        include: db.models.Project,
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
    const project = await db.repos.projects.findOne({
      where: { id: projectId },
      include: [{ model: db.models.Member, where: { userId }, required: false }],
    });
    if (!project) return false;
    if (project.userId === userId) return true;

    const member = project.Members && project.Members[0];
    if (member) {
      const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
      const developerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'developer');
      if (member.role === managerRoleIndex || member.role === developerRoleIndex) return true;
    }

    return false;
  }

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

  async function verifyProjectReporterFromRunId(req, res, next) {
    const runId = req.params.runId || req.query.runId;
    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    const run = await db.repos.runs.findByPk(runId);
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

  async function verifyProjectReporterFromCommentableId(req, res, next) {
    const commentableType = req.params.commentableType || req.query.commentableType;
    const commentableId = req.params.commentableId || req.query.commentableId;
    if (!commentableType || !commentableId) {
      return res.status(400).json({ error: 'commentableType and commentableId are required' });
    }

    if (commentableType === 'Run' || commentableType === 'Case') {
      next();
      return;
    } else if (commentableType === 'RunCase') {
      const runCase = await db.repos.runCases.findByPk(commentableId);
      const runId = runCase && runCase.runId;
      if (!runId) return res.status(404).send('failed to find runId');

      const run = await db.repos.runs.findByPk(runId);
      const projectId = run && run.projectId;
      if (!projectId) return res.status(404).send('failed to find projectId');

      const isReporterRet = await isReporter(projectId, req.userId);
      if (isReporterRet) {
        next();
        return;
      }
    } else {
      return res.status(400).json({ error: 'unsupported commentableType' });
    }
  }

  async function isReporter(projectId, userId) {
    const project = await db.repos.projects.findOne({
      where: { id: projectId },
      include: [{ model: db.models.Member, where: { userId }, required: false }],
    });
    if (!project) return false;
    if (project.userId === userId) return true;

    const member = project.Members && project.Members[0];
    if (member) {
      const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
      const developerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'developer');
      const reporterRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'reporter');
      if (member.role === managerRoleIndex || member.role === developerRoleIndex || member.role === reporterRoleIndex) return true;
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
    verifyProjectReporterFromCommentableId,
  };
}
