import { PrismaClient, Role, Country } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'nick.fury@slooze.xyz' },
    update: {},
    create: {
      name: 'Nick Fury',
      email: 'nick.fury@slooze.xyz',
      password: passwordHash,
      role: Role.ADMIN,
      country: Country.INDIA,
    },
  });

  const managerIndia = await prisma.user.upsert({
    where: { email: 'captain.marvel@slooze.xyz' },
    update: {},
    create: {
      name: 'Captain Marvel',
      email: 'captain.marvel@slooze.xyz',
      password: passwordHash,
      role: Role.MANAGER,
      country: Country.INDIA,
    },
  });

  const managerAmerica = await prisma.user.upsert({
    where: { email: 'captain.america@slooze.xyz' },
    update: {},
    create: {
      name: 'Captain America',
      email: 'captain.america@slooze.xyz',
      password: passwordHash,
      role: Role.MANAGER,
      country: Country.AMERICA,
    },
  });

  const thanos = await prisma.user.upsert({
    where: { email: 'thanos@slooze.xyz' },
    update: {},
    create: {
      name: 'Thanos',
      email: 'thanos@slooze.xyz',
      password: passwordHash,
      role: Role.MEMBER,
      country: Country.INDIA,
    },
  });

  const thor = await prisma.user.upsert({
    where: { email: 'thor@slooze.xyz' },
    update: {},
    create: {
      name: 'Thor',
      email: 'thor@slooze.xyz',
      password: passwordHash,
      role: Role.MEMBER,
      country: Country.INDIA,
    },
  });

  const travis = await prisma.user.upsert({
    where: { email: 'travis@slooze.xyz' },
    update: {},
    create: {
      name: 'Travis',
      email: 'travis@slooze.xyz',
      password: passwordHash,
      role: Role.MEMBER,
      country: Country.AMERICA,
    },
  });

  console.log({ admin, managerIndia, managerAmerica, thanos, thor, travis });

  // Restaurants & menu items per country
  const indiaRestaurant = await prisma.restaurant.create({
    data: {
      name: 'Mumbai Spice House',
      country: Country.INDIA,
      menus: {
        create: [
          { name: 'Butter Chicken', price: 12.5 },
          { name: 'Paneer Tikka', price: 10.0 },
        ],
      },
    },
    include: { menus: true },
  });

  const americaRestaurant = await prisma.restaurant.create({
    data: {
      name: 'New York Burger Co.',
      country: Country.AMERICA,
      menus: {
        create: [
          { name: 'Cheeseburger', price: 11.0 },
          { name: 'Fries', price: 4.0 },
        ],
      },
    },
    include: { menus: true },
  });

  console.log({ indiaRestaurant, americaRestaurant });

  // Payment methods for users (admin and managers)
  await prisma.paymentMethod.createMany({
    data: [
      {
        userId: admin.id,
        brand: 'VISA',
        last4: '4242',
        country: admin.country,
      },
      {
        userId: managerIndia.id,
        brand: 'MASTERCARD',
        last4: '1111',
        country: managerIndia.country,
      },
      {
        userId: managerAmerica.id,
        brand: 'AMEX',
        last4: '9999',
        country: managerAmerica.country,
      },
    ],
    // skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


