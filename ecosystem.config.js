module.exports = {
  apps: [
    {
      // --- Basic Info ---
      name: "TEAM-ZUBAIR-MD",
      script: "./server.js",
      watch: false,
      autorestart: true,
      max_memory_restart: '2G',
      
      // --- Environment Variables ---
      env: {
        NODE_ENV: "production",
        PORT: 20664,
        BOT_NAME: "TEAM-ZUBAIR-MD",
        BOT_PREFIX: ".",
        LOG_LEVEL: "info"
      },
      
      // --- Development Environment ---
      env_dev: {
        NODE_ENV: "development",
        PORT: 3000,
        BOT_NAME: "TEAM-ZUBAIR-MD-DEV",
        LOG_LEVEL: "debug",
        DEBUG: true
      },
      
      // --- Staging Environment ---
      env_staging: {
        NODE_ENV: "staging",
        PORT: 3001,
        BOT_NAME: "TEAM-ZUBAIR-MD-STAGING",
        LOG_LEVEL: "info",
        DEBUG: false
      },
      
      // --- Production Environment ---
      env_production: {
        NODE_ENV: "production",
        PORT: 20664,
        BOT_NAME: "TEAM-ZUBAIR-MD",
        LOG_LEVEL: "info",
        DEBUG: false
      },

      // --- Logging ---
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      
      // --- Process Management ---
      instances: 1,
      exec_mode: "fork",
      watch: false,
      ignore_watch: ["node_modules", "logs", "temp", "storage", ".git"],
      
      // --- Restart Strategy ---
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      
      // --- Performance ---
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // --- Auto Restart Conditions ---
      autorestart: true,
      cron_restart: "0 4 * * *", // Restart at 4 AM daily
      
      // --- Health Monitoring ---
      health_check: {
        interval: 10000,
        cron_restart: "0 4 * * *"
      },

      // --- Source Maps ---
      source_map_support: true,
      
      // --- Error Handling ---
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      combine_logs: true,
      
      // --- Advanced Options ---
      node_args: [
        "--max-old-space-size=2048",
        "--gc_global",
        "--optimize_for_size",
        "--max_semi_space_size=64"
      ],
      
      // --- Wait for Ready ---
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 10000,
      
      // --- Graceful Shutdown ---
      shutdown_with_message: true,
      
      // --- Instances (Cluster Mode) ---
      // instances: 0, // 0 = auto detect CPU cores
      // exec_mode: "cluster",
      
      // --- Timezone ---
      timezone: "Asia/Karachi",
      
      // --- Merge Logs ---
      merge_logs: true,
      
      // --- Watch Options ---
      watch_options: {
        followSymlinks: false,
        usePolling: true,
        interval: 1000
      },
      
      // --- Pre/Post Scripts ---
      pre_start: "echo 'Starting TEAM-ZUBAIR-MD...'",
      post_start: "echo 'TEAM-ZUBAIR-MD started successfully!'",
      pre_restart: "echo 'Restarting TEAM-ZUBAIR-MD...'",
      post_restart: "echo 'TEAM-ZUBAIR-MD restarted!'",
      pre_stop: "echo 'Stopping TEAM-ZUBAIR-MD...'",
      post_stop: "echo 'TEAM-ZUBAIR-MD stopped!'"
    }
  ],
  
  // --- Deployment Configuration ---
  deploy: {
    production: {
      user: "ubuntu",
      host: "your-server-ip",
      ref: "origin/main",
      repo: "https://github.com/Team-Zubair-MD/bot.git",
      path: "/var/www/bot",
      "post-deploy": "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-deploy": "git pull && npm run build",
      "env": {
        NODE_ENV: "production"
      }
    },
    staging: {
      user: "ubuntu",
      host: "staging-server-ip",
      ref: "origin/develop",
      repo: "https://github.com/Team-Zubair-MD/bot.git",
      path: "/var/www/bot-staging",
      "post-deploy": "npm install && pm2 reload ecosystem.config.js --env staging",
      "env": {
        NODE_ENV: "staging"
      }
    }
  }
};