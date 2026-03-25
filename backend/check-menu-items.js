const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMenuItems() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        restaurant: true,
      },
    });
    
    console.log('=== MENU ITEMS ===');
    menuItems.forEach(item => {
      console.log(`Item ID: ${item.id}, Name: ${item.name}, Restaurant ID: ${item.restaurantId}, Restaurant: ${item.restaurant.name}, Country: ${item.restaurant.country}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMenuItems();
