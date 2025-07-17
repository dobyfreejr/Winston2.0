const EventEmitter = require('events');
const fs = require('fs');
const { Tail } = require('tail');
const logger = require('../utils/logger');

class LogCollector extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.isRunning = false;
    this.tails = [];
  }

  async initialize() {
    logger.info('Initializing Log Collector...');
    logger.info(`Monitoring ${this.config.files.length} log files`);
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('Starting Log Collector...');
    
    // Start tailing each log file
    for (const filePath of this.config.files) {
      try {
        if (fs.existsSync(filePath)) {
          const tail = new Tail(filePath, {
            separator: /[\r]{0,1}\n/,
            fromBeginning: false,
            fsWatchOptions: {},
            follow: true
          });
          
          tail.on('line', (line) => {
            this.processLogLine(filePath, line);
          });
          
          tail.on('error', (error) => {
            logger.error(`Error tailing ${filePath}:`, error);
          });
          
          this.tails.push(tail);
          logger.info(`Started tailing: ${filePath}`);
        } else {
          logger.warn(`Log file not found: ${filePath}`);
        }
      } catch (error) {
        logger.error(`Failed to start tailing ${filePath}:`, error);
      }
    }
  }

  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Stop all tails
    this.tails.forEach(tail => {
      try {
        tail.unwatch();
      } catch (error) {
        logger.error('Error stopping tail:', error);
      }
    });
    
    this.tails = [];
    logger.info('Log Collector stopped');
  }

  processLogLine(filePath, line) {
    if (!line.trim()) return;
    
    try {
      const logType = this.detectLogType(filePath);
      const parsedLog = this.parseLogLine(logType, line);
      
      if (parsedLog) {
        this.emit('data', {
          type: 'log_entry',
          timestamp: new Date().toISOString(),
          source_file: filePath,
          log_type: logType,
          raw_line: line,
          ...parsedLog
        });
      }
    } catch (error) {
      logger.error(`Error processing log line from ${filePath}:`, error);
    }
  }

  detectLogType(filePath) {
    if (filePath.includes('syslog')) return 'syslog';
    if (filePath.includes('auth.log')) return 'auth';
    if (filePath.includes('nginx')) return 'nginx';
    if (filePath.includes('apache')) return 'apache';
    if (filePath.includes('fail2ban')) return 'fail2ban';
    if (filePath.includes('ufw')) return 'firewall';
    return 'generic';
  }

  parseLogLine(logType, line) {
    try {
      switch (logType) {
        case 'syslog':
          return this.parseSyslogLine(line);
        case 'auth':
          return this.parseAuthLine(line);
        case 'nginx':
          return this.parseNginxLine(line);
        case 'apache':
          return this.parseApacheLine(line);
        case 'fail2ban':
          return this.parseFail2banLine(line);
        case 'firewall':
          return this.parseFirewallLine(line);
        default:
          return this.parseGenericLine(line);
      }
    } catch (error) {
      logger.error(`Error parsing ${logType} line:`, error);
      return this.parseGenericLine(line);
    }
  }

  parseSyslogLine(line) {
    const pattern = this.config.patterns.syslog;
    const match = line.match(pattern);
    
    if (match) {
      return {
        parsed_timestamp: match[1],
        hostname: match[2],
        process: match[3],
        message: match[4],
        severity: this.detectSeverity(match[4])
      };
    }
    
    return { message: line, severity: 'info' };
  }

  parseAuthLine(line) {
    const pattern = this.config.patterns.auth;
    const match = line.match(pattern);
    
    if (match) {
      return {
        parsed_timestamp: match[1],
        hostname: match[2],
        process: match[3],
        pid: match[4],
        message: match[5],
        severity: this.detectAuthSeverity(match[5])
      };
    }
    
    return { message: line, severity: 'info' };
  }

  parseNginxLine(line) {
    const pattern = this.config.patterns.nginx;
    const match = line.match(pattern);
    
    if (match) {
      return {
        client_ip: match[1],
        parsed_timestamp: match[2],
        request: match[3],
        status_code: parseInt(match[4]),
        response_size: parseInt(match[5]),
        referer: match[6],
        user_agent: match[7],
        severity: this.detectHttpSeverity(parseInt(match[4]))
      };
    }
    
    return { message: line, severity: 'info' };
  }

  parseApacheLine(line) {
    // Similar to nginx but with Apache format
    return this.parseNginxLine(line); // Simplified for demo
  }

  parseFail2banLine(line) {
    if (line.includes('Ban')) {
      const ipMatch = line.match(/Ban (\d+\.\d+\.\d+\.\d+)/);
      return {
        action: 'ban',
        ip_address: ipMatch ? ipMatch[1] : null,
        message: line,
        severity: 'high'
      };
    } else if (line.includes('Unban')) {
      const ipMatch = line.match(/Unban (\d+\.\d+\.\d+\.\d+)/);
      return {
        action: 'unban',
        ip_address: ipMatch ? ipMatch[1] : null,
        message: line,
        severity: 'medium'
      };
    }
    
    return { message: line, severity: 'info' };
  }

  parseFirewallLine(line) {
    if (line.includes('[UFW BLOCK]')) {
      const srcMatch = line.match(/SRC=(\d+\.\d+\.\d+\.\d+)/);
      const dstMatch = line.match(/DST=(\d+\.\d+\.\d+\.\d+)/);
      const portMatch = line.match(/DPT=(\d+)/);
      
      return {
        action: 'block',
        source_ip: srcMatch ? srcMatch[1] : null,
        destination_ip: dstMatch ? dstMatch[1] : null,
        destination_port: portMatch ? parseInt(portMatch[1]) : null,
        message: line,
        severity: 'medium'
      };
    }
    
    return { message: line, severity: 'info' };
  }

  parseGenericLine(line) {
    return {
      message: line,
      severity: this.detectSeverity(line)
    };
  }

  detectSeverity(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('error') || lowerMessage.includes('failed') || 
        lowerMessage.includes('critical') || lowerMessage.includes('emergency')) {
      return 'high';
    } else if (lowerMessage.includes('warning') || lowerMessage.includes('warn')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  detectAuthSeverity(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('failed password') || lowerMessage.includes('authentication failure') ||
        lowerMessage.includes('invalid user') || lowerMessage.includes('connection closed')) {
      return 'high';
    } else if (lowerMessage.includes('accepted password') || lowerMessage.includes('session opened')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  detectHttpSeverity(statusCode) {
    if (statusCode >= 500) return 'high';
    if (statusCode >= 400) return 'medium';
    return 'low';
  }
}

module.exports = LogCollector;