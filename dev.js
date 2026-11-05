const { spawn } = require("child_process");
const path = require("path");

console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("\x1b[36m%s\x1b[0m", "   🚀 Starting Swiftly (Backend + Frontend)      ");
console.log("\x1b[36m%s\x1b[0m", "=================================================\n");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

// 1. Start Backend Server (Port 3000)
const server = spawn(npmCmd, ["start"], {
  cwd: path.join(__dirname, "server"),
  stdio: "inherit",
  shell: true,
  env: { ...process.env, FORCE_COLOR: "true" }
});

// 2. Start Frontend Client (Port 5173)
const client = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(__dirname, "client"),
  stdio: "inherit",
  shell: true,
  env: { ...process.env, FORCE_COLOR: "true" }
});

const cleanup = () => {
  console.log("\n\x1b[33m%s\x1b[0m", "Gracefully stopping server and client...");
  if (isWin) {
    if (server.pid) spawn("taskkill", ["/pid", server.pid, "/f", "/t"]);
    if (client.pid) spawn("taskkill", ["/pid", client.pid, "/f", "/t"]);
  } else {
    server.kill("SIGTERM");
    client.kill("SIGTERM");
  }
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

