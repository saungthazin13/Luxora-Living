// import { PrismaClient } from "@prisma/client";
import { PrismaClient,Prisma } from '../src/generated/prisma'; 

import * as bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";


const prisma = new PrismaClient();



// Function to create a random user object
function createRandomUser() {
  return {
    phone: faker.phone.number({ style: "international" }),
    password: '', 
    randToken : faker.internet.jwt(), 
  };
}


export const users = faker.helpers.multiple(createRandomUser, {
  count: 5,
});

async function main() {
  console.log('Start seeding...');

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('12qwaszx', salt);
  console.log('Password hashed:', password);

  for (const u of users) {
    console.log('Seeding user:', u);
    u.password = password;
    await prisma.user.create({
      data: u,
    });
  }

  console.log('Seeding finished.');
}


// Run seeding process
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
