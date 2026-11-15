// npm run dev: installs server/ deps on first run, then runs the in-memory API (5000) and Vite (3000) together.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// shell: true so `npm` resolves to npm.cmd on Windows.
const npm = (args, opts) => ({ cmd: 'npm', args, opts: { cwd: root, stdio: 'inherit', shell: true, ...opts } });

if (!existsSync(path.join(root, 'server', 'node_modules'))) {
  // Run inside server/: `npm install --prefix server` from the root adds the root package as a dependency.
  const install = npm(['ci'], { cwd: path.join(root, 'server') });
  const result = spawnSync(install.cmd, install.args, install.opts);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const children = [npm(['run', 'dev:memory', '--prefix', 'server']), npm(['run', 'start'])].map(({ cmd, args, opts }) =>
  spawn(cmd, args, opts),
);

// On Windows kill() only ends the cmd.exe wrapper, so taskkill /T takes the node process with it.
const stop = (child) => {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill();
};

// When either one stops, stop the other so no port is left in use.
for (const child of children) {
  child.on('exit', (code) => {
    children.forEach(stop);
    process.exitCode = code ?? 0;
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => children.forEach(stop));
