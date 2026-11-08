// PM2 ecosystem file for SQ-Way IMS on a VPS.
// Copy to /opt/ims/ecosystem.config.js and adjust:
//   - cwd         -> where you cloned the repo on the VPS (default /opt/ims)
//   - DATABASE_URL, SESSION_SECRET -> set in .env / .env.test (gitignored)
//   - port        -> production uses 3005 because 3000 is taken by KaAyos
//
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup   (run the printed sudo command to enable auto-start)

module.exports = {
  apps: [
    {
      name: 'ims-prod',
      script: 'npm',
      args: 'run start -- -p 3005',
      cwd: '/opt/ims',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },
    {
      name: 'ims-test',
      script: 'npm',
      args: 'run start:test',
      cwd: '/opt/ims',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'test',
        PORT: 3001,
      },
    },
  ],
};
