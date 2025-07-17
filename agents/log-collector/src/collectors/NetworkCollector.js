const EventEmitter = require('events');
const netstat = require('node-netstat');
const si = require('systeminformation');
const logger = require('../utils/logger');

class NetworkCollector extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.isRunning = false;
    this.connections = new Map();
    this.interval = null;
  }

  async initialize() {
    logger.info('Initializing Network Collector...');
    
    // Get network interfaces
    this.interfaces = await si.networkInterfaces();
    logger.info(`Found ${this.interfaces.length} network interfaces`);
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('Starting Network Collector...');
    
    // Start periodic collection
    this.interval = setInterval(() => {
      this.collectNetworkData();
    }, this.config.interval);
    
    // Initial collection
    await this.collectNetworkData();
  }

  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    logger.info('Network Collector stopped');
  }

  async collectNetworkData() {
    try {
      // Collect active connections
      await this.collectConnections();
      
      // Collect network statistics
      await this.collectNetworkStats();
      
      // Collect network interfaces status
      await this.collectInterfaceStats();
      
    } catch (error) {
      this.emit('error', error);
    }
  }

  async collectConnections() {
    return new Promise((resolve) => {
      const connections = [];
      
      netstat({
        filter: {
          pid: true,
          protocol: 'tcp'
        }
      }, (data) => {
        if (data.state === 'ESTABLISHED' || data.state === 'LISTEN') {
          const connection = {
            type: 'network_connection',
            timestamp: new Date().toISOString(),
            protocol: data.protocol,
            local_address: data.local.address,
            local_port: data.local.port,
            remote_address: data.remote ? data.remote.address : null,
            remote_port: data.remote ? data.remote.port : null,
            state: data.state,
            pid: data.pid,
            process_name: data.processName
          };
          
          connections.push(connection);
        }
      }, () => {
        // Detect new/closed connections
        this.detectConnectionChanges(connections);
        resolve();
      });
    });
  }

  detectConnectionChanges(currentConnections) {
    const currentMap = new Map();
    
    // Process current connections
    currentConnections.forEach(conn => {
      const key = `${conn.protocol}:${conn.local_address}:${conn.local_port}:${conn.remote_address}:${conn.remote_port}`;
      currentMap.set(key, conn);
      
      // New connection detected
      if (!this.connections.has(key)) {
        this.emit('data', {
          ...conn,
          event_type: 'connection_established'
        });
      }
    });
    
    // Detect closed connections
    this.connections.forEach((conn, key) => {
      if (!currentMap.has(key)) {
        this.emit('data', {
          ...conn,
          event_type: 'connection_closed',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    this.connections = currentMap;
  }

  async collectNetworkStats() {
    try {
      const stats = await si.networkStats();
      
      stats.forEach(stat => {
        this.emit('data', {
          type: 'network_stats',
          timestamp: new Date().toISOString(),
          interface: stat.iface,
          rx_bytes: stat.rx_bytes,
          tx_bytes: stat.tx_bytes,
          rx_dropped: stat.rx_dropped,
          tx_dropped: stat.tx_dropped,
          rx_errors: stat.rx_errors,
          tx_errors: stat.tx_errors
        });
      });
    } catch (error) {
      logger.error('Error collecting network stats:', error);
    }
  }

  async collectInterfaceStats() {
    try {
      const interfaces = await si.networkInterfaces();
      
      interfaces.forEach(iface => {
        this.emit('data', {
          type: 'network_interface',
          timestamp: new Date().toISOString(),
          name: iface.iface,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
          internal: iface.internal,
          virtual: iface.virtual,
          operstate: iface.operstate,
          type: iface.type,
          duplex: iface.duplex,
          mtu: iface.mtu,
          speed: iface.speed
        });
      });
    } catch (error) {
      logger.error('Error collecting interface stats:', error);
    }
  }
}

module.exports = NetworkCollector;