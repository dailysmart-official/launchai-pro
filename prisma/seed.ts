import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  // Seed: no-op — add demo data here if needed (guarded; not run in production build)
}
main().finally(() => db.$disconnect());
