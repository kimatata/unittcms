import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectDeveloperFromFolderId } = editableMiddleware(db);

  async function _cloneFolderRecursive(sourceFolder, targetParent, transaction) {
    const folderToCreate = {
      name: sourceFolder.name,
      detail: sourceFolder.detail,
      parentFolderId: targetParent.id,
      projectId: targetParent.projectId,
    };

    const clonedFolder = await db.repos.folders.create(folderToCreate, { transaction });

    await _cloneCasesAndSteps(sourceFolder.id, clonedFolder.id, transaction);

    const childFolders = await db.repos.folders.findAll({
      where: { parentFolderId: sourceFolder.id },
    });

    for (const child of childFolders) {
      await _cloneFolderRecursive(child, clonedFolder, transaction);
    }

    return clonedFolder;
  }

  async function _cloneCasesAndSteps(folderId, targetFolderId, transaction) {
    const folderCases = await db.repos.cases.findAll({
      where: { folderId },
      include: [{ model: db.repos.steps, through: { attributes: ['stepNo'] } }],
    });

    if (folderCases.length === 0) return;

    const cases = folderCases.map((c) => c.get({ plain: true }));

    const clonedCases = cases.map((c) => {
      // eslint-disable-next-line no-unused-vars
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...clonedCase } = c;
      return { ...clonedCase, folderId: targetFolderId };
    });

    for (const c of clonedCases) {
      const newCase = await db.repos.cases.create(c, { transaction });

      if (c.Steps && c.Steps.length > 0) {
        const clonedSteps = c.Steps.map((s) => {
          // eslint-disable-next-line no-unused-vars
          const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...clonedStep } = s;
          return clonedStep;
        });

        const newSteps = await db.repos.steps.bulkCreate(clonedSteps, { transaction });
        const caseSteps = newSteps.map((step, index) => ({
          caseId: newCase.id,
          stepId: step.id,
          stepNo: clonedSteps[index].caseSteps.stepNo,
        }));

        await db.repos.caseSteps.bulkCreate(caseSteps, { transaction });
      }
    }
  }

  router.post('/:folderId/clone', verifySignedIn, verifyProjectDeveloperFromFolderId, async (req, res) => {
    const folderId = req.params.folderId;
    const { targetFolderId } = req.body;

    try {
      const sourceFolder = await db.repos.folders.findByPk(folderId);
      const targetFolder = await db.repos.folders.findByPk(targetFolderId);

      if (!sourceFolder || !targetFolder) {
        return res.status(404).send('Folder or target folder not found');
      }

      await db.sequelize.transaction(async (t) => {
        await _cloneFolderRecursive(sourceFolder, targetFolder, t);
      });

      res.status(201).send({ message: 'Folder cloned successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
