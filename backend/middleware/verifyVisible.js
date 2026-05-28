export default function verifyVisibleMiddleware(db) {
  async function verifyProjectVisibleFromProjectId(req, res, next) {
    let projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const visible = await isVisible(projectId, req.userId);
    if (visible) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  async function verifyProjectVisibleFromFolderId(req, res, next) {
    const folderId = req.params.folderId || req.query.folderId;
    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    const folder = await db.repos.folders.findByPk(folderId);
    const projectId = folder && folder.projectId;
    if (!projectId) {
      return res.status(404).send('failed to find projectId');
    }

    const visible = await isVisible(projectId, req.userId);
    if (visible) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  async function verifyProjectVisibleFromCaseId(req, res, next) {
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

    const visible = await isVisible(projectId, req.userId);
    if (visible) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  async function verifyProjectVisibleFromRunId(req, res, next) {
    const runId = req.params.runId || req.query.runId;
    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    const run = await db.repos.runs.findByPk(runId);
    const projectId = run && run.projectId;
    if (!projectId) {
      return res.status(404).send('failed to find projectId');
    }

    const visible = await isVisible(projectId, req.userId);
    if (visible) {
      next();
      return;
    }

    return res.status(403).json({ error: 'Forbidden' });
  }

  async function verifyProjectVisibleFromCommentableId(req, res, next) {
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

      const visible = await isVisible(projectId, req.userId);
      if (visible) {
        next();
        return;
      }
    } else {
      return res.status(400).json({ error: 'unsupported commentableType' });
    }
  }

  async function isVisible(projectId, userId) {
    const project = await db.repos.projects.findOne({
      where: { id: projectId },
      include: [{ model: db.models.Member, where: { userId }, required: false }],
    });
    if (!project) return false;
    if (project.isPublic) return true;
    if (project.userId === userId) return true;
    if (project.Members && project.Members[0]) return true;
    return false;
  }

  return {
    verifyProjectVisibleFromProjectId,
    verifyProjectVisibleFromFolderId,
    verifyProjectVisibleFromCaseId,
    verifyProjectVisibleFromRunId,
    verifyProjectVisibleFromCommentableId,
  };
}
