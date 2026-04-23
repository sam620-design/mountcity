import express from 'express';
import { getPlotsByProject } from '../controllers/plotControllers.js';

const router = express.Router();

router.get('/:projectId', getPlotsByProject);

export default router;
