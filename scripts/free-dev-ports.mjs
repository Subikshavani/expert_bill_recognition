import killPort from "kill-port";

const ports = [3001, 3002, 3003, 3004, 5173, 5174];

for (const port of ports) {
  try {
    await killPort(port);
    console.log(`Freed port ${port}`);
  } catch {
    // Ignore ports that are not currently in use.
  }
}