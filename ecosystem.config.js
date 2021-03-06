module.exports = {
  apps: [
    // First application
    {
      name: 'njs-static',
      script: 'bin/www',
      exec_mode: 'fork',
      // instance: 1,
      watch: false,
      max_memory_restart: '200M',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '~/service/static/log',
      out_file: '~/service/static/log',
      autorestart: true,
      env: {
        COMMON_VARIABLE: "true",
        NODE_ENV: 'development',
        "PORT": "3030"
      },
      env_production: {
        NODE_ENV: 'production'
      },
      env_test: {
        NODE_ENV: 'test'
      }
    }
  ],
  deploy: {
    production: {
      user: 'root',
      host: '172.105.222.93',
      ref: 'origin/master',
      ssh_options: 'StrictHostKeyChecking=no',
      repo: 'git@github.com:rojarsmith/njs-static.git',
      path: '~/service/static/njs-static',
      'pre-deploy-local': '',
      'post-deploy': 'cp ~/service/static/.env.production ~/service/static/njs-static/current/ && npm install && npm audit fix && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  }
};
