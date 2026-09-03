const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getAll, create, update, remove, resolve } = require('../controllers/recipeController');

router.use(requireAuth);

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.get('/:id/resolve', resolve);

module.exports = router;
