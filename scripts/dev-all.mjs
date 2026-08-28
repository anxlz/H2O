// Runs `next dev` and the local Flask PDF API (`api/generate-pdf.py`)
// together, so `npm run dev:all` is a single command that leaves
// "Generate PDF" working locally (see next.config.mjs for the rewrite that
// connects the two). Plain Node child_process — no extra dependency like
// `concurrently` needed for something this small.
import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";

function run(name, command, args) {
  const child = spawn(command, args, { stdio: "inherit", shell: isWindows });
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  child.on("error", (err) => {
    console.error(`[${name}] failed to start:`, err.message);
  });
  return child;
}

const pythonCmd = process.env.PYTHON ?? (isWindows ? "python" : "python3");

const api = run("api", pythonCmd, ["api/generate-pdf.py"]);
const web = run("web", "npx", ["next", "dev"]);

function shutdown() {
  api.kill();
  web.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
