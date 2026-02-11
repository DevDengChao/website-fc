const path = require("path");
const { spawn } = require("child_process");

const PORT = 9000;
const HOST = "0.0.0.0";
const serveBin = path.join(
  __dirname,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "serve.cmd" : "serve"
);
const serveArgs = ["-s", "public", "-l", `tcp://${HOST}:${PORT}`];

const serverProcess = spawn(serveBin, serveArgs, { stdio: "inherit" });

serverProcess.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

serverProcess.on("close", (code) => {
  process.exitCode = code ?? 1;
});
