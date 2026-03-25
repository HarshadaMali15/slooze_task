const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRestaurants() {
  try {
    const restaurants = await prisma.restaurant.findMany();
    console.log('=== RESTAURANTS ===');
    restaurants.forEach(r => {
      console.log(`ID: ${r.id}, Name: ${r.name}, Country: ${r.country}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRestaurants();
