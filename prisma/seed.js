const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Salary', type: 'INCOME' },
  { name: 'Freelance', type: 'INCOME' },
  { name: 'Investment', type: 'INCOME' },
  { name: 'Other Income', type: 'INCOME' },
  { name: 'Food & Dining', type: 'EXPENSE' },
  { name: 'Transport', type: 'EXPENSE' },
  { name: 'Shopping', type: 'EXPENSE' },
  { name: 'Utilities', type: 'EXPENSE' },
  { name: 'Healthcare', type: 'EXPENSE' },
  { name: 'Entertainment', type: 'EXPENSE' },
  { name: 'Rent', type: 'EXPENSE' },
  { name: 'Education', type: 'EXPENSE' },
  { name: 'Other Expense', type: 'EXPENSE' },
];

async function main() {
  let created = 0;

  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: category.type, userId: null },
    });

    if (!existing) {
      await prisma.category.create({ data: { ...category, userId: null } });
      created++;
    }
  }

  console.log(`Seeded ${created} categories (${defaultCategories.length - created} already existed)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
