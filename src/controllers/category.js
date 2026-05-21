const prisma = require('../config/db');

async function getAll(req, res, next) {
  try {
    const { type, source } = req.query;

    const where = {
      OR: [{ userId: req.user.id }, { userId: null }],
    };

    if (type) where.type = type;

    if (source === 'default') {
      delete where.OR;
      where.userId = null;
    } else if (source === 'custom') {
      delete where.OR;
      where.userId = req.user.id;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'name and type are required' });
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be INCOME or EXPENSE' });
    }

    const existing = await prisma.category.findUnique({
      where: { name_userId_type: { name, userId: req.user.id, type } },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { name, type, userId: req.user.id },
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found or not editable' });
    }

    const { name, type } = req.body;

    if (!name && !type) {
      return res.status(400).json({ success: false, message: 'Provide name or type to update' });
    }

    if (type && !['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be INCOME or EXPENSE' });
    }

    const data = {};
    if (name) data.name = name;
    if (type) data.type = type;

    const updated = await prisma.category.update({
      where: { id: category.id },
      data,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found or not deletable' });
    }

    await prisma.category.delete({ where: { id: category.id } });

    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
