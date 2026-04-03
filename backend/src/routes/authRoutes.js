const router = require('express').Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.profile);

module.exports = router;
