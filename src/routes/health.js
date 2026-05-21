const router = require('express').Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

module.exports = router;
