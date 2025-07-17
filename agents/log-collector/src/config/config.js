const path = require('path');
const os = require('os');

module.exports = {
  agent: {
    id: process.env.SOC_AGENT_ID || `agent-${os.hostname()}`,
    name: process.env.SOC_AGENT_NAME || `SOC Agent - ${os.hostname()}`,
    version: '1.0.0'
  },

  soc: {
    endpoint: process.env.SOC_ENDPOINT || 'http://localhost:3000',
    apiKey: process.env.SOC_API_KEY || 'default-api-key',
    batchSize: parseInt(process.env.SOC_BATCH_SIZE) || 100,
    flushInterval: parseInt(process.env.SOC_FLUSH_INTERVAL) || 5000 // 5 seconds
  },

  collectors: {
    network: {
      enabled: process.env.COLLECT_NETWORK !== 'false',
      interface: process.env.NETWORK_INTERFACE || null, // null = all interfaces
      capturePackets: process.env.CAPTURE_PACKETS === 'true',
      connectionTracking: true,
      portScanning: true,
      interval: 10000 // 10 seconds
    },

    system: {
      enabled: process.env.COLLECT_SYSTEM !== 'false',
      metrics: {
        cpu: true,
        memory: true,
        disk: true,
        processes: true,
        users: true
      },
      interval: 30000 // 30 seconds
    },

    security: {
      enabled: process.env.COLLECT_SECURITY !== 'false',
      authLogs: true,
      failedLogins: true,
      privilegeEscalation: true,
      fileIntegrity: true,
      interval: 5000 // 5 seconds
    },

    logs: {
      enabled: process.env.COLLECT_LOGS !== 'false',
      files: [
        // System logs
        '/var/log/syslog',
        '/var/log/auth.log',
        '/var/log/kern.log',
        
        // Web server logs
        '/var/log/nginx/access.log',
        '/var/log/nginx/error.log',
        '/var/log/apache2/access.log',
        '/var/log/apache2/error.log',
        
        // Application logs
        '/var/log/application/*.log',
        
        // Security logs
        '/var/log/fail2ban.log',
        '/var/log/ufw.log'
      ].filter(file => {
        try {
          require('fs').accessSync(file);
          return true;
        } catch {
          return false;
        }
      }),
      patterns: {
        syslog: /^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(\S+):\s+(.+)$/,
        auth: /^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(\S+)(?:\[(\d+)\])?\s*:\s+(.+)$/,
        nginx: /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([^"]+)"\s+(\d+)\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"/
      }
    }
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || path.join(__dirname, '../../logs/agent.log'),
    maxSize: '10m',
    maxFiles: 5
  }
};