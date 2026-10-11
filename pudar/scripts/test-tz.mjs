// Runs the date tests once per timezone (PRD §10 Epic 1).
// Usage: npm run test:tz
import { spawnSync } from 'node:child_process';

const ZONES = [
  'UTC',
  'Asia/Jakarta', // UTC+7, no DST
  'America/New_York', // DST at 02:00
  'America/Santiago', // DST transition at midnight
  'Australia/Lord_Howe', // 30-minute DST shift
  'Pacific/Kiritimati', // UTC+14
];

const failed = [];
for (const zone of ZONES) {
  console.log(`\n▶ TZ=${zone}`);
  const result = spawnSync('npx', ['jest', 'src/lib', '--silent'], {
    stdio: 'inherit',
    env: { ...process.env, TZ: zone },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) failed.push(zone);
}

if (failed.length > 0) {
  console.error(`\n✖ Failed in: ${failed.join(', ')}`);
  process.exit(1);
}
console.log(`\n✔ Passed in all ${ZONES.length} timezones`);
