const axios = require('axios');
const logger = require('../utils/logger');

class SOCClient {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.batchSize = 100;
    this.flushInterval = 5000; // 5 seconds
    this.dataBuffer = [];
    this.flushTimer = null;
    
    this.setupPeriodicFlush();
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.endpoint}/api/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      logger.info('SOC Platform connection test successful');
      return true;
    } catch (error) {
      logger.warn('SOC Platform connection test failed, will retry:', error.message);
      return false;
    }
  }

  async sendData(data) {
    // Add to buffer for batch processing
    this.dataBuffer.push(data);
    
    // Flush immediately if buffer is full
    if (this.dataBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async sendEvent(event) {
    try {
      await axios.post(`${this.endpoint}/api/agent/events`, event, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      logger.debug('Event sent to SOC Platform');
    } catch (error) {
      logger.error('Failed to send event to SOC Platform:', error.message);
    }
  }

  async flush() {
    if (this.dataBuffer.length === 0) {
      return;
    }
    
    const batch = [...this.dataBuffer];
    this.dataBuffer = [];
    
    try {
      await axios.post(`${this.endpoint}/api/agent/data`, {
        agent_id: process.env.SOC_AGENT_ID || 'unknown',
        timestamp: new Date().toISOString(),
        data: batch
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      logger.debug(`Sent batch of ${batch.length} records to SOC Platform`);
    } catch (error) {
      logger.error('Failed to send data batch to SOC Platform:', error.message);
      
      // Re-add failed data to buffer for retry (with limit to prevent memory issues)
      if (this.dataBuffer.length < 1000) {
        this.dataBuffer.unshift(...batch);
      }
    }
  }

  setupPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  async close() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Final flush
    await this.flush();
  }
}

module.exports = SOCClient;