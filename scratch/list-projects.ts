import 'dotenv/config';
import { db } from './server/db';
import { projects } from './shared/schema';

async function listProjects() {
  try {
    const allProjects = await db.select().from(projects);
    console.log(JSON.stringify(allProjects, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listProjects();
