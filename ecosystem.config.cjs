module.exports = {
  apps: [{
    name: "socialglowz",
    cwd: "/home/claude/socialglowz",
    script: "bash",
    args: ["-lc", "export PORT=3022 && flox activate -- bash -lc 'pnpm dev --port 3022 --host'"],
    env: {
      PORT: 3022
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 2000,
    watch: false
  }]
};
