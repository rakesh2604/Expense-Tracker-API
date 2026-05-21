const { Prisma } = require('@prisma/client');
const prisma = require('../config/db');

function dateFilter(query) {
  const filter = {};
  if (query.dateFrom) filter.gte = new Date(query.dateFrom);
  if (query.dateTo) filter.lte = new Date(query.dateTo);
  return Object.keys(filter).length ? filter : undefined;
}

async function summary(req, res, next) {
  try {
    const dateRange = dateFilter(req.query);
    const where = { userId: req.user.id };
    if (dateRange) where.date = dateRange;

    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpense = Number(expense._sum.amount ?? 0);

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function byCategory(req, res, next) {
  try {
    const dateRange = dateFilter(req.query);
    const where = { userId: req.user.id };
    if (dateRange) where.date = dateRange;
    if (req.query.type) where.type = req.query.type;

    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    if (!grouped.length) {
      return res.json({ success: true, data: [] });
    }

    const categoryIds = [...new Set(grouped.map((g) => g.categoryId))];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, type: true },
    });

    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    const data = grouped.map((g) => ({
      categoryId: g.categoryId,
      category: categoryMap[g.categoryId]?.name ?? 'Unknown',
      type: g.type,
      total: Number(g._sum.amount ?? 0),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function monthly(req, res, next) {
  try {
    const dateRange = dateFilter(req.query);
    const dateFromClause = dateRange?.gte ? Prisma.sql`AND date >= ${dateRange.gte}` : Prisma.empty;
    const dateToClause = dateRange?.lte ? Prisma.sql`AND date <= ${dateRange.lte}` : Prisma.empty;

    const rows = await prisma.$queryRaw`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        type,
        SUM(amount)::float AS total
      FROM "Transaction"
      WHERE "userId" = ${req.user.id}
        ${dateFromClause}
        ${dateToClause}
      GROUP BY TO_CHAR(date, 'YYYY-MM'), type
      ORDER BY month ASC
    `;

    const monthMap = {};
    for (const row of rows) {
      if (!monthMap[row.month]) {
        monthMap[row.month] = { month: row.month, income: 0, expense: 0 };
      }
      if (row.type === 'INCOME') monthMap[row.month].income = row.total;
      if (row.type === 'EXPENSE') monthMap[row.month].expense = row.total;
    }

    const data = Object.values(monthMap).map((m) => ({
      ...m,
      net: m.income - m.expense,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, byCategory, monthly };
