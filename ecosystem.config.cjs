module.exports = {
  apps: [
    {
      name: 'agent-fun',
      script: 'server.mjs',
      cwd: '/root/projects/agent-fun',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: '3003',
        BASE_PATH: '/agent',
        DATA_DIR: '/root/projects/agent-fun/data',
        HOSTS_CONFIG: '/root/projects/agent-fun/config/hosts.json',
      },
      max_memory_restart: '500M',
      out_file: '/root/.pm2/logs/agent-fun-out.log',
      error_file: '/root/.pm2/logs/agent-fun-err.log',
    },
  ],
};
