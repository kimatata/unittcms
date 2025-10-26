import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineFolder from '../../models/folders.js';
import defineCase from '../../models/cases.js';
import defineStep from '../../models/steps.js';
import defineCaseStep from '../../models/caseSteps.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromFolderId } = editableMiddleware(sequelize);

  const Folder = defineFolder(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  const Step = defineStep(sequelize, DataTypes);
  const CaseStep = defineCaseStep(sequelize, DataTypes);
  Case.belongsTo(Folder);
  Case.belongsToMany(Step, { through: 'caseSteps' });
  Step.belongsToMany(Case, { through: 'caseSteps' });

  async function _cloneFolderRecursive(sourceFolder, targetParent, transaction) {
    const folderToCreate = {
      name: sourceFolder.name,
      detail: sourceFolder.detail,
      parentFolderId: targetParent.id,
      projectId: targetParent.projectId,
    };

    const clonedFolder = await Folder.create(folderToCreate, { transaction });

    await _cloneCasesAndSteps(sourceFolder.id, clonedFolder.id, transaction);

    const childFolders = await Folder.findAll({
      where: { parentFolderId: sourceFolder.id },
    });

    for (const child of childFolders) {
      await _cloneFolderRecursive(child, clonedFolder, transaction);
    }

    return clonedFolder;
  }

  async function _cloneCasesAndSteps(folderId, targetFolderId, transaction) {
    const folderCases = await Case.findAll({
      where: { folderId },
      include: [{ model: Step, through: { attributes: ['stepNo'] } }],
    });

    if (folderCases.length === 0) return;

    const cases = folderCases.map((c) => c.get({ plain: true }));

    const clonedCases = cases.map((c) => {
      // eslint-disable-next-line no-unused-vars
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...clonedCase } = c;
      return { ...clonedCase, folderId: targetFolderId };
    });

    for (const c of clonedCases) {
      const newCase = await Case.create(c, { transaction });

      if (c.Steps && c.Steps.length > 0) {
        const clonedSteps = c.Steps.map((s) => {
          // eslint-disable-next-line no-unused-vars
          const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...clonedStep } = s;
          return clonedStep;
        });

        const newSteps = await Step.bulkCreate(clonedSteps, { transaction });
        const caseSteps = newSteps.map((step, index) => ({
          caseId: newCase.id,
          stepId: step.id,
          stepNo: clonedSteps[index].caseSteps.stepNo,
        }));

        await CaseStep.bulkCreate(caseSteps, { transaction });
      }
    }
  }

  router.post('/:folderId/clone', verifySignedIn, verifyProjectDeveloperFromFolderId, async (req, res) => {
    const folderId = req.params.folderId;
    const { targetFolderId } = req.body;

    try {
      const sourceFolder = await Folder.findByPk(folderId);
      const targetFolder = await Folder.findByPk(targetFolderId);

      if (!sourceFolder || !targetFolder) {
        return res.status(404).send('Folder or target folder not found');
      }

      await sequelize.transaction(async (t) => {
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
