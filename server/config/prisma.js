const { PrismaClient } = require("@prisma/client");
const config = require("./env");

let prisma = null;

function getPrisma() {
  if (!config.DATABASE_URL || !config.DIRECT_URL) {
    throw new Error("Missing DATABASE_URL or DIRECT_URL in .env");
  }
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

module.exports = { getPrisma };
