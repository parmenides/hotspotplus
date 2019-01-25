import Router from 'express-promise-router';
import controller from '../controllers';

const router = Router();

router.get('/health', controller.health);

export default router;
