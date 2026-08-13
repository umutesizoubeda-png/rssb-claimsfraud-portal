import { chmod } from 'fs/promises';
import { access } from 'fs/promises';
import { platform } from 'process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Only attempt to chmod on POSIX platforms
if (platform !== 'win32') {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const binDir = new URL('../node_modules/.bin/', import.meta.url).pathname;
  try {
    // try to access the directory first
    await access(binDir);
    // set execute bit for user
    // 0o755 => rwxr-xr-x
    await chmod(binDir, 0o755);
    console.log('Set exec permissions on', binDir);
  } catch (err) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.warn('Could not set exec permissions on', binDir, err?.message || err);
  }
} else {
  // Windows: no-op
  // eslint-disable-next-line no-console
  console.log('Skipping chmod on Windows');
}
