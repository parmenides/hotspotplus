import Router from 'express-promise-router';
import controller from '../controllers';

const router = Router();

router.get('/health', controller.health);
router.get('/api/netflow/search', controller.searchNetflow);
router.get('/api/dns/search', controller.searchDns);
router.get('/api/webproxy/search', controller.searchWebproxy);

export default router;
