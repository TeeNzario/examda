import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { studentId: '64010001' },
    update: {},
    create: {
      studentId: '64010001',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      coin: 100,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { studentId: '64010002' },
    update: {},
    create: {
      studentId: '64010002',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      coin: 50,
    },
  });

  console.log('Created users:', user1.studentId, user2.studentId);

  // Create shop items
  const shopItems = [
    {
      name: 'Golden Star',
      description: 'A shiny golden star sticker',
      price: 20,
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/541/541415.png',
    },
    {
      name: 'Rainbow Badge',
      description: 'A colorful rainbow badge',
      price: 35,
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3523/3523048.png',
    },
    {
      name: 'Trophy Cup',
      description: 'A champion trophy cup',
      price: 50,
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png',
    },
    {
      name: 'Crown',
      description: 'A royal crown for champions',
      price: 75,
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/1021/1021081.png',
    },
    {
      name: 'Diamond',
      description: 'A precious diamond gem',
      price: 100,
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/2065/2065308.png',
    },
    {
      name: 'Rocket',
      description: 'Blast off with this rocket!',
      price: 45,
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3212/3212567.png',
    },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { id: shopItems.indexOf(item) + 1 },
      update: item,
      create: item,
    });
  }

  console.log('Created', shopItems.length, 'shop items');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
