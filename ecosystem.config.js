module.exports = {
  apps: [
    {
      name: 'markinflu-web',
      script: 'pnpm',
      args: '--filter web start',
      cwd: '/var/www/markinflu',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/markinflu/logs/web-error.log',
      out_file: '/var/www/markinflu/logs/web-out.log',
      log_file: '/var/www/markinflu/logs/web-combined.log',
      time: true,
      // Reintentos y manejo de errores
      max_restarts: 10,
      min_uptime: '10s',
      // Reinicio exponencial en caso de errores
      exp_backoff_restart_delay: 100,
    },
    // Descomentar si tienes API NestJS separada
    /*
    {
      name: 'markinflu-api',
      script: 'pnpm',
      args: '--filter api start:prod',
      cwd: '/var/www/markinflu',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/www/markinflu/logs/api-error.log',
      out_file: '/var/www/markinflu/logs/api-out.log',
      log_file: '/var/www/markinflu/logs/api-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
      exp_backoff_restart_delay: 100,
    },
    */
  ],

  // Configuración de deploy (opcional - para usar pm2 deploy)
  deploy: {
    production: {
      user: 'root',
      host: '173.249.40.63',
      ref: 'origin/main',
      repo: 'https://github.com/tu-usuario/markinflu.git',
      path: '/var/www/markinflu',
      'post-deploy': 'pnpm install && pnpm --filter @markinflu/database prisma generate && pnpm --filter @markinflu/database prisma migrate deploy && pnpm --filter web build && pm2 reload ecosystem.config.js --env production && pm2 save',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
