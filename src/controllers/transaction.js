const prisma = require('../config/db');

const VALID_SORT_FIELDS = ['date', 'amount', 'createdAt'];
const VALID_ORDER = ['asc', 'desc'];

const include = {
  category: { select: { id: true, name: true, type: true } },
};

function buildWhere(userId, query) {
  const where = { userId };

  if (query.type) where.type = query.type;
  if (query.categoryId) where.categoryId = parseInt(query.categoryId);

  if (query.dateFrom || query.dateTo) {
    where.date = {};
    if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
    if (query.dateTo) where.date.lte = new Date(query.dateTo);
  }

  return where;
}

async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const sortBy = VALID_SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'date';
    const order = VALID_ORDER.includes(req.query.order) ? req.query.order : 'desc';

    const where = buildWhere(req.user.id, req.query);

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include,
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      success: true,
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      include,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { amount, type, categoryId, note, date } = req.body;

    if (!amount || !type || !categoryId || !date) {
      return res.status(400).json({ success: false, message: 'amount, type, categoryId and date are required' });
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be INCOME or EXPENSE' });
    }

    const category = await prisma.category.findFirst({
      where: { id: parseInt(categoryId), OR: [{ userId: req.user.id }, { userId: null }] },
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        note: note || null,
        date: new Date(date),
        userId: req.user.id,
        categoryId: parseInt(categoryId),
      },
      include,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { amount, type, categoryId, note, date } = req.body;

    if (type && !['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be INCOME or EXPENSE' });
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parseInt(categoryId), OR: [{ userId: req.user.id }, { userId: null }] },
      });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
    }

    const data = {};
    if (amount !== undefined) data.amount = amount;
    if (type) data.type = type;
    if (categoryId) data.categoryId = parseInt(categoryId);
    if (note !== undefined) data.note = note || null;
    if (date) data.date = new Date(date);

    const transaction = await prisma.transaction.update({
      where: { id: existing.id },
      data,
      include,
    });

    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    await prisma.transaction.delete({ where: { id: existing.id } });

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove };
