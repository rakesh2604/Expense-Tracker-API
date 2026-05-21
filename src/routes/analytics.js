const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { summary, byCategory, monthly } = require('../controllers/analytics');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Financial analytics
 */

/**
 * @swagger
 * /analytics/summary:
 *   get:
 *     summary: Total income, expenses and net balance
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Summary totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpense:
 *                       type: number
 *                     netBalance:
 *                       type: number
 */
router.get('/summary', summary);

/**
 * @swagger
 * /analytics/by-category:
 *   get:
 *     summary: Totals grouped by category
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Category breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryId:
 *                         type: integer
 *                       category:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [INCOME, EXPENSE]
 *                       total:
 *                         type: number
 */
router.get('/by-category', byCategory);

/**
 * @swagger
 * /analytics/monthly:
 *   get:
 *     summary: Month-over-month income and expense summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Monthly breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2024-01"
 *                       income:
 *                         type: number
 *                       expense:
 *                         type: number
 *                       net:
 *                         type: number
 */
router.get('/monthly', monthly);

module.exports = router;
