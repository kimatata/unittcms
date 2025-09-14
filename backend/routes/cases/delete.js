import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCase from '../../models/cases';
import authMiddleware from '../../middleware/auth';
import editableMiddleware from '../../middleware/verifyEditable';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromProjectId } = editableMiddleware(sequelize);
  const Case = defineCase(sequelize, DataTypes);

  router.post('/bulkdelete', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    const { caseIds } = req.body;
    if (!caseIds || !Array.isArray(caseIds)) {
      return res.status(400).send('Invalid caseIds array');
    }

    try {
      await Case.destroy({ where: { id: caseIds } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
