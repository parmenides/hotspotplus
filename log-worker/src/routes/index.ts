import Router from 'express-promise-router';
import controller from '../controllers';

const router = Router();

router.get('/health', controller.health);
//router.post('/api/report/create', controller.createReport);
router.get('/api/netflow/search', controller.searchNetflow);

export default router;
