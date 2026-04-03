import { User } from './server/models/index.ts';
import process from 'node:process';

async function makeAdmin() {
  const [affectedRows] = await User.update(
    { role: 'admin' },
    { where: { email: 'kantabbrichard@gmail.com' } }
  );

  console.log(`Success: ${affectedRows} user(s) updated to admin.`);
  process.exit(0);
}

makeAdmin().catch(err => {
  console.error('Failed to update admin:', err);
  process.exit(1);
});