const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCarts() {
  try {
    // Check existing individual carts
    const individualCarts = await prisma.cart.findMany({
      where: { isShared: false },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            country: true,
            name: true,
          },
        },
      },
    });
    
    console.log('=== INDIVIDUAL CARTS ===');
    console.log(`Found ${individualCarts.length} individual carts:`);
    
    individualCarts.forEach((cart, index) => {
      console.log(`\nCart ${index + 1}:`);
      console.log(`  ID: ${cart.id}`);
      console.log(`  User ID: ${cart.userId}`);
      console.log(`  User: ${cart.user?.name || cart.user?.email || 'Unknown'}`);
      console.log(`  Role: ${cart.user?.role || 'Unknown'}`);
      console.log(`  Country: ${cart.country}`);
      console.log(`  Items: ${cart.items.length}`);
      
      cart.items.forEach((item) => {
        console.log(`    - Item ID: ${item.menuItemId}, Qty: ${item.quantity}`);
      });
    });
    
    // Check shared carts
    const sharedCarts = await prisma.cart.findMany({
      where: { isShared: true },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            country: true,
            name: true,
          },
        },
      },
    });
    
    console.log('\n=== SHARED CARTS ===');
    console.log(`Found ${sharedCarts.length} shared carts:`);
    
    sharedCarts.forEach((cart, index) => {
      console.log(`\nShared Cart ${index + 1}:`);
      console.log(`  ID: ${cart.id}`);
      console.log(`  User ID: ${cart.userId}`);
      console.log(`  User: ${cart.user?.name || cart.user?.email || 'Unknown'}`);
      console.log(`  Role: ${cart.user?.role || 'Unknown'}`);
      console.log(`  Country: ${cart.country}`);
      console.log(`  Items: ${cart.items.length}`);
      
      cart.items.forEach((item) => {
        console.log(`    - Item ID: ${item.menuItemId}, Qty: ${item.quantity}`);
      });
    });
    
    // Check all users
    const users = await prisma.user.findMany();
    console.log('\n=== ALL USERS ===');
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user) => {
      console.log(`  ${user.name || user.email} - ${user.role} - ${user.country}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCarts();
