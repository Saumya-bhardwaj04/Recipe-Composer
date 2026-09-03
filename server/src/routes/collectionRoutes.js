const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { exportCollection, importCollection } = require('../controllers/collectionController');

router.use(requireAuth);

router.get('/export', exportCollection);
router.post('/import', importCollection);

module.exports = router;
