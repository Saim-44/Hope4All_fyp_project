import express from 'express';
import { addProgress, getOrphanProgress, deleteProgress } from '../controllers/progressController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/add', upload.single('achievementImage'), addProgress);
router.get('/orphan/:orphanId', getOrphanProgress);
router.delete('/:id', deleteProgress);

export default router;
