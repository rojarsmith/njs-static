module.exports = {
  apps: [
    // First application
    {
      name: 'njs-static',
      script: 'app.js',
      exec_mode: 'cluster',
      instance: 0,
      watch: false,
      max_memory_restart: '200M',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '~/service/log',
      out_file: '~/service/log',
      autorestart: true,
      env: {
        COMMON_VARIABLE: "true"
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
