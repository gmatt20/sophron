import { spawn } from 'node:child_process';

export type RunCli = (program: 'memorable', args: string[], stdin?: string) => Promise<string>;

export const runCli: RunCli = (program, args, stdin) =>
  new Promise((resolve, reject) => {
    const windows = process.platform === 'win32';
    // npm's Windows CLI shims need cmd.exe. Reject shell metacharacters in arguments.
    if (windows && args.some((arg) => !/^[\p{L}\p{N} .,_'/?()-]+$/u.test(arg))) {
      reject(new Error('Unsafe CLI argument'));
      return;
    }

    const child = windows
      ? spawn(`${program} ${args.map((arg) => `"${arg}"`).join(' ')}`, {
          shell: true,
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'ignore'],
        })
      : spawn(program, args, { stdio: ['pipe', 'pipe', 'ignore'] });
    const chunks: Buffer[] = [];
    let bytes = 0;
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${program} timed out`));
    }, 5_000);

    child.stdout.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 64_000) {
        child.kill();
        reject(new Error(`${program} output too large`));
      } else {
        chunks.push(chunk);
      }
    });
    child.once('error', reject);
    child.once('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(Buffer.concat(chunks).toString('utf8'));
      else reject(new Error(`${program} exited with ${code}`));
    });
    child.stdin.once('error', reject);
    child.stdin.end(stdin);
  });
