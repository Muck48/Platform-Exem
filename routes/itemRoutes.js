const express = require('express');
const controller = require('../controllers/itemController');
const { validateId, validateItemInput } = require('../middleware/validation');

const router = express.Router();

router.post('/', validateItemInput, controller.create);
router.get('/', controller.list);
router.get('/:id', validateId, controller.readOne);
router.put('/:id', validateId, validateItemInput, controller.update);
router.delete('/:id', validateId, controller.remove);

module.exports = router;
