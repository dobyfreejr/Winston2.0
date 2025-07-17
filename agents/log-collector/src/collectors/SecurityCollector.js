const EventEmitter = require('events');
const fs = require('fs');
const { spawn } = require('child_process');
const logger = require('../utils/logger');

class SecurityCollector extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.isRunning = false;
    this.interval = null;
    this.lastAuthCheck = new Date();
    this.failedLoginAttempts = new Map();
  }

  async initialize() {
    logger.info('Initializing Security Collector...');
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('Starting Security Collector...');
    
    // Start periodic collection
    this.interval = setInterval(() => {
      this.collectSecurityData();
    }, this.config.interval);
    
    // Initial collection
    await this.collectSecurityData();
  }

  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    logger.info('Security Collector stopped');
  }

  async collectSecurityData() {
    try {
      if (this.config.authLogs) {
        await this.collectAuthEvents();
      }
      
      if (this.config.failedLogins) {
        await this.analyzeFailedLogins();
      }
      
      if (this.config.privilegeEscalation) {
        await this.detectPrivilegeEscalation();
      }
      
      if (this.config.fileIntegrity) {
        await this.checkFileIntegrity();
      }
      
    } catch (error) {
      this.emit('error', error);
    }
  }

  async collectAuthEvents() {
    try {
      // Check auth.log for recent authentication events
      const authLogPath = '/var/log/auth.log';
      
      if (!fs.existsSync(authLogPath)) {
        return;
      }
      
      const command = `tail -n 100 ${authLogPath}`;
      const child = spawn('sh', ['-c', command]);
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', () => {
        this.parseAuthLogs(output);
      });
      
    } catch (error) {
      logger.error('Error collecting auth events:', error);
    }
  }

  parseAuthLogs(logData) {
    const lines = logData.split('\n');
    
    lines.forEach(line => {
      if (!line.trim()) return;
      
      // Parse different types of auth events
      if (line.includes('Failed password')) {
        this.parseFailedLogin(line);
      } else if (line.includes('Accepted password') || line.includes('Accepted publickey')) {
        this.parseSuccessfulLogin(line);
      } else if (line.includes('sudo:')) {
        this.parseSudoEvent(line);
      } else if (line.includes('su:')) {
        this.parseSuEvent(line);
      }
    });
  }

  parseFailedLogin(line) {
    const match = line.match(/Failed password for (?:invalid user )?(\S+) from (\S+) port (\d+)/);
    if (match) {
      const [, user, ip, port] = match;
      
      // Track failed attempts
      const key = `${ip}:${user}`;
      const attempts = this.failedLoginAttempts.get(key) || 0;
      this.failedLoginAttempts.set(key, attempts + 1);
      
      this.emit('data', {
        type: 'security_failed_login',
        timestamp: new Date().toISOString(),
        user: user,
        source_ip: ip,
        port: parseInt(port),
        attempt_count: attempts + 1,
        severity: attempts > 5 ? 'high' : attempts > 2 ? 'medium' : 'low'
      });
    }
  }

  parseSuccessfulLogin(line) {
    const match = line.match(/Accepted (?:password|publickey) for (\S+) from (\S+) port (\d+)/);
    if (match) {
      const [, user, ip, port] = match;
      
      this.emit('data', {
        type: 'security_successful_login',
        timestamp: new Date().toISOString(),
        user: user,
        source_ip: ip,
        port: parseInt(port),
        auth_method: line.includes('publickey') ? 'publickey' : 'password'
      });
    }
  }

  parseSudoEvent(line) {
    const match = line.match(/(\S+) : TTY=(\S+) ; PWD=(\S+) ; USER=(\S+) ; COMMAND=(.+)/);
    if (match) {
      const [, user, tty, pwd, targetUser, command] = match;
      
      this.emit('data', {
        type: 'security_sudo_command',
        timestamp: new Date().toISOString(),
        user: user,
        target_user: targetUser,
        tty: tty,
        working_directory: pwd,
        command: command,
        severity: targetUser === 'root' ? 'high' : 'medium'
      });
    }
  }

  parseSuEvent(line) {
    if (line.includes('FAILED SU')) {
      const match = line.match(/FAILED SU \(to (\S+)\) (\S+) on (\S+)/);
      if (match) {
        const [, targetUser, user, tty] = match;
        
        this.emit('data', {
          type: 'security_failed_su',
          timestamp: new Date().toISOString(),
          user: user,
          target_user: targetUser,
          tty: tty,
          severity: 'high'
        });
      }
    }
  }

  async analyzeFailedLogins() {
    // Analyze patterns in failed login attempts
    this.failedLoginAttempts.forEach((count, key) => {
      const [ip, user] = key.split(':');
      
      if (count > 10) {
        this.emit('data', {
          type: 'security_brute_force_detected',
          timestamp: new Date().toISOString(),
          source_ip: ip,
          target_user: user,
          attempt_count: count,
          severity: 'critical',
          description: `Potential brute force attack detected from ${ip} targeting user ${user}`
        });
      }
    });
    
    // Clean up old entries (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    // In a real implementation, you'd track timestamps for each attempt
  }

  async detectPrivilegeEscalation() {
    try {
      // Monitor for suspicious privilege escalation patterns
      const command = "ps aux | grep -E '(sudo|su|pkexec)' | grep -v grep";
      const child = spawn('sh', ['-c', command]);
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', () => {
        const lines = output.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            const parts = line.split(/\s+/);
            if (parts.length > 10) {
              this.emit('data', {
                type: 'security_privilege_process',
                timestamp: new Date().toISOString(),
                user: parts[0],
                pid: parts[1],
                command: parts.slice(10).join(' '),
                severity: 'medium'
              });
            }
          }
        });
      });
      
    } catch (error) {
      logger.error('Error detecting privilege escalation:', error);
    }
  }

  async checkFileIntegrity() {
    // Monitor critical system files for changes
    const criticalFiles = [
      '/etc/passwd',
      '/etc/shadow',
      '/etc/sudoers',
      '/etc/hosts',
      '/etc/ssh/sshd_config'
    ];
    
    for (const file of criticalFiles) {
      try {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          
          this.emit('data', {
            type: 'security_file_integrity',
            timestamp: new Date().toISOString(),
            file_path: file,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            permissions: stats.mode.toString(8),
            uid: stats.uid,
            gid: stats.gid
          });
        }
      } catch (error) {
        logger.error(`Error checking file integrity for ${file}:`, error);
      }
    }
  }
}

module.exports = SecurityCollector;