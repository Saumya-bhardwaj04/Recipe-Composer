const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getAll, create, update, remove } = require('../controllers/ingredientController');

router.use(requireAuth);

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
