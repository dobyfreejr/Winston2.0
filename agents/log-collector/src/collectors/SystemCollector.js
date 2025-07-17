const EventEmitter = require('events');
const si = require('systeminformation');
const logger = require('../utils/logger');

class SystemCollector extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.isRunning = false;
    this.interval = null;
    this.previousProcesses = new Map();
  }

  async initialize() {
    logger.info('Initializing System Collector...');
    
    // Get system information
    this.systemInfo = await si.system();
    this.osInfo = await si.osInfo();
    
    logger.info(`System: ${this.systemInfo.manufacturer} ${this.systemInfo.model}`);
    logger.info(`OS: ${this.osInfo.distro} ${this.osInfo.release}`);
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('Starting System Collector...');
    
    // Start periodic collection
    this.interval = setInterval(() => {
      this.collectSystemData();
    }, this.config.interval);
    
    // Initial collection
    await this.collectSystemData();
  }

  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    logger.info('System Collector stopped');
  }

  async collectSystemData() {
    try {
      if (this.config.metrics.cpu) {
        await this.collectCPUData();
      }
      
      if (this.config.metrics.memory) {
        await this.collectMemoryData();
      }
      
      if (this.config.metrics.disk) {
        await this.collectDiskData();
      }
      
      if (this.config.metrics.processes) {
        await this.collectProcessData();
      }
      
      if (this.config.metrics.users) {
        await this.collectUserData();
      }
      
    } catch (error) {
      this.emit('error', error);
    }
  }

  async collectCPUData() {
    try {
      const cpu = await si.cpu();
      const currentLoad = await si.currentLoad();
      const cpuTemperature = await si.cpuTemperature();
      
      this.emit('data', {
        type: 'system_cpu',
        timestamp: new Date().toISOString(),
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        processors: cpu.processors,
        load_avg: currentLoad.avgLoad,
        load_current: currentLoad.currentLoad,
        load_user: currentLoad.currentLoadUser,
        load_system: currentLoad.currentLoadSystem,
        temperature: cpuTemperature.main || null
      });
    } catch (error) {
      logger.error('Error collecting CPU data:', error);
    }
  }

  async collectMemoryData() {
    try {
      const memory = await si.mem();
      
      this.emit('data', {
        type: 'system_memory',
        timestamp: new Date().toISOString(),
        total: memory.total,
        free: memory.free,
        used: memory.used,
        active: memory.active,
        available: memory.available,
        buffers: memory.buffers,
        cached: memory.cached,
        slab: memory.slab,
        swap_total: memory.swaptotal,
        swap_used: memory.swapused,
        swap_free: memory.swapfree
      });
    } catch (error) {
      logger.error('Error collecting memory data:', error);
    }
  }

  async collectDiskData() {
    try {
      const disks = await si.fsSize();
      
      disks.forEach(disk => {
        this.emit('data', {
          type: 'system_disk',
          timestamp: new Date().toISOString(),
          filesystem: disk.fs,
          type: disk.type,
          size: disk.size,
          used: disk.used,
          available: disk.available,
          use_percent: disk.use,
          mount: disk.mount
        });
      });
    } catch (error) {
      logger.error('Error collecting disk data:', error);
    }
  }

  async collectProcessData() {
    try {
      const processes = await si.processes();
      const currentProcesses = new Map();
      
      processes.list.forEach(proc => {
        currentProcesses.set(proc.pid, proc);
        
        // Detect new processes
        if (!this.previousProcesses.has(proc.pid)) {
          this.emit('data', {
            type: 'system_process_start',
            timestamp: new Date().toISOString(),
            pid: proc.pid,
            ppid: proc.ppid,
            name: proc.name,
            command: proc.command,
            user: proc.user,
            cpu: proc.cpu,
            memory: proc.memory,
            state: proc.state
          });
        }
      });
      
      // Detect terminated processes
      this.previousProcesses.forEach((proc, pid) => {
        if (!currentProcesses.has(pid)) {
          this.emit('data', {
            type: 'system_process_end',
            timestamp: new Date().toISOString(),
            pid: proc.pid,
            name: proc.name,
            command: proc.command,
            user: proc.user
          });
        }
      });
      
      this.previousProcesses = currentProcesses;
      
      // Emit process summary
      this.emit('data', {
        type: 'system_processes',
        timestamp: new Date().toISOString(),
        total: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping
      });
      
    } catch (error) {
      logger.error('Error collecting process data:', error);
    }
  }

  async collectUserData() {
    try {
      const users = await si.users();
      
      users.forEach(user => {
        this.emit('data', {
          type: 'system_user_session',
          timestamp: new Date().toISOString(),
          user: user.user,
          tty: user.tty,
          date: user.date,
          time: user.time,
          ip: user.ip,
          command: user.command
        });
      });
    } catch (error) {
      logger.error('Error collecting user data:', error);
    }
  }
}

module.exports = SystemCollector;