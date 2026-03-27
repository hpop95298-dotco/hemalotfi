import { db } from "./server/db";
import { users } from "./shared/schema";

async function check() {
  const allUsers = await db.select().from(users);
  console.log("Current Users in DB:");
  allUsers.forEach(u => {
    console.log(`- ID: ${u.id}, Username: ${u.username}, 2FA Enabled: ${u.isTwoFactorEnabled}`);
  });
  process.exit(0);
}

check().catch(console.error);
