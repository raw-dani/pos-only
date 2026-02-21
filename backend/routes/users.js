const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/', auth, userController.getUsers);
router.post('/', auth, userController.createUser);
router.put('/:id', auth, userController.updateUser);
router.put('/:id/reset-password', auth, userController.resetPassword);
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;
