const LogCollector = require('./collectors/LogCollector');
const NetworkCollector = require('./collectors/NetworkCollector');
const SystemCollector = require('./collectors/SystemCollector');
const SecurityCollector = require('./collectors/SecurityCollector');
const DataProcessor = require('./processors/DataProcessor');
const SOCClient = require('./clients/SOCClient');
const logger = require('./utils/logger');
const config = require('./config/config');

class SOCAgent {
  constructor() {
    this.collectors = [];
    this.processor = new DataProcessor();
    this.socClient = new SOCClient(config.soc.endpoint, config.soc.apiKey);
    this.isRunning = false;
  }

  async initialize() {
    try {
      logger.info('Initializing SOC Log Collection Agent...');
      
      // Initialize collectors based on configuration
      if (config.collectors.network.enabled) {
        this.collectors.push(new NetworkCollector(config.collectors.network));
      }
      
      if (config.collectors.system.enabled) {
        this.collectors.push(new SystemCollector(config.collectors.system));
      }
      
      if (config.collectors.security.enabled) {
        this.collectors.push(new SecurityCollector(config.collectors.security));
      }
      
      if (config.collectors.logs.enabled) {
        this.collectors.push(new LogCollector(config.collectors.logs));
      }

      // Initialize all collectors
      for (const collector of this.collectors) {
        await collector.initialize();
        collector.on('data', (data) => this.handleData(data));
        collector.on('error', (error) => this.handleError(error));
      }

      // Test SOC platform connection
      await this.socClient.testConnection();
      
      logger.info(`SOC Agent initialized with ${this.collectors.length} collectors`);
    } catch (error) {
      logger.error('Failed to initialize SOC Agent:', error);
      throw error;
    }
  }

  async start() {
    if (this.isRunning) {
      logger.warn('SOC Agent is already running');
      return;
    }

    try {
      logger.info('Starting SOC Log Collection Agent...');
      
      // Start all collectors
      for (const collector of this.collectors) {
        await collector.start();
        logger.info(`Started ${collector.constructor.name}`);
      }

      this.isRunning = true;
      logger.info('SOC Agent started successfully');
      
      // Send startup event to SOC platform
      await this.socClient.sendEvent({
        type: 'agent_startup',
        timestamp: new Date().toISOString(),
        agent_id: config.agent.id,
        hostname: require('os').hostname(),
        collectors: this.collectors.map(c => c.constructor.name)
      });

    } catch (error) {
      logger.error('Failed to start SOC Agent:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping SOC Log Collection Agent...');
    
    // Stop all collectors
    for (const collector of this.collectors) {
      await collector.stop();
      logger.info(`Stopped ${collector.constructor.name}`);
    }

    this.isRunning = false;
    logger.info('SOC Agent stopped');
  }

  async handleData(data) {
    try {
      // Process and enrich the data
      const processedData = await this.processor.process(data);
      
      // Send to SOC platform
      await this.socClient.sendData(processedData);
      
      logger.debug(`Processed and sent ${data.type} data`);
    } catch (error) {
      logger.error('Error handling data:', error);
    }
  }

  handleError(error) {
    logger.error('Collector error:', error);
  }
}

// Main execution
async function main() {
  const agent = new SOCAgent();
  
  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await agent.stop();
    process.exit(0);
  });

  try {
    await agent.initialize();
    await agent.start();
  } catch (error) {
    logger.error('Failed to start SOC Agent:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SOCAgent;