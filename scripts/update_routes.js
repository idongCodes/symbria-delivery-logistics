/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const routes = await prisma.route.findMany();
  console.log("Current Routes:", routes);

  // Find the West route
  const westRoute = routes.find(r => r.name.includes("West") && !r.name.includes("South"));
  
  if (westRoute) {
    const updated = await prisma.route.update({
      where: { id: westRoute.id },
      data: { name: westRoute.name.replace("West (W)", "South West (SW)") }
    });
    console.log("Updated Route:", updated);
  } else {
    console.log("Could not find a route named 'West (W)'");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
