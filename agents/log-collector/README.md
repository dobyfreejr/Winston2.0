# SOC Log Collection Agent

A comprehensive log collection agent for the SOC Platform that gathers network, system, security, and application logs from endpoints and servers.

## 🚀 **Features**

### **Data Collection:**
- **Network Monitoring**: Active connections, traffic stats, interface monitoring
- **System Metrics**: CPU, memory, disk usage, process monitoring
- **Security Events**: Authentication logs, failed logins, privilege escalation
- **Log Files**: Real-time log file monitoring with intelligent parsing

### **Data Processing:**
- **Intelligent Enrichment**: IP geolocation, threat intelligence, risk scoring
- **Pattern Recognition**: Automatic detection of security events
- **Data Normalization**: Consistent format across all data sources

### **SOC Integration:**
- **Real-time Streaming**: Live data feed to SOC platform
- **Batch Processing**: Efficient data transmission
- **Automatic Retry**: Resilient data delivery

## 📦 **Installation**

### **1. Install Dependencies:**
```bash
cd agents/log-collector
npm install
```

### **2. Configure Environment:**
```bash
# Copy and edit configuration
cp .env.example .env

# Set your SOC platform details
export SOC_ENDPOINT="http://your-soc-platform:3000"
export SOC_API_KEY="your-api-key"
export SOC_AGENT_ID="agent-$(hostname)"
```

### **3. Run Agent:**

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**As System Service:**
```bash
sudo npm run install-service
sudo systemctl start soc-log-collector
```

## ⚙️ **Configuration**

### **Environment Variables:**
```bash
# SOC Platform
SOC_ENDPOINT=http://localhost:3000
SOC_API_KEY=your-api-key-here
SOC_AGENT_ID=agent-hostname

# Collection Settings
COLLECT_NETWORK=true
COLLECT_SYSTEM=true
COLLECT_SECURITY=true
COLLECT_LOGS=true

# Network Monitoring
NETWORK_INTERFACE=eth0
CAPTURE_PACKETS=false

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/soc-agent.log
```

### **Collector Configuration:**
Each collector can be individually configured in `src/config/config.js`:

```javascript
collectors: {
  network: {
    enabled: true,
    interface: null, // null = all interfaces
    interval: 10000  // 10 seconds
  },
  system: {
    enabled: true,
    metrics: {
      cpu: true,
      memory: true,
      disk: true,
      processes: true
    },
    interval: 30000  // 30 seconds
  }
}
```

## 📊 **Data Types Collected**

### **Network Data:**
- Active TCP/UDP connections
- Network interface statistics
- Connection establishment/termination events
- Traffic volume and error rates

### **System Data:**
- CPU usage and load averages
- Memory and swap utilization
- Disk space and I/O statistics
- Process creation/termination
- User session activity

### **Security Data:**
- Authentication events (success/failure)
- Privilege escalation attempts
- Failed login patterns (brute force detection)
- File integrity monitoring
- Sudo/su command execution

### **Log Data:**
- System logs (syslog, auth.log, kern.log)
- Web server logs (nginx, apache)
- Application logs
- Security tool logs (fail2ban, UFW)

## 🔧 **Data Processing Pipeline**

```
Raw Data → Collectors → Data Processor → SOC Client → SOC Platform
    ↓           ↓            ↓             ↓           ↓
  Events    Parsing    Enrichment    Batching    Storage
```

### **Enrichment Features:**
- **IP Geolocation**: Geographic location of IP addresses
- **Threat Intelligence**: Known malicious indicators
- **Risk Scoring**: Automatic risk assessment
- **Pattern Detection**: Anomaly and attack pattern recognition

## 🛡️ **Security Considerations**

### **Permissions:**
- Runs as dedicated `soc-agent` user
- Minimal required permissions
- Read-only access to log files
- No network capture by default

### **Data Protection:**
- Encrypted transmission to SOC platform
- Local log rotation and cleanup
- Sensitive data filtering

### **Resource Usage:**
- Configurable collection intervals
- Memory-efficient log tailing
- CPU usage monitoring and throttling

## 📈 **Monitoring & Troubleshooting**

### **Service Status:**
```bash
# Check service status
sudo systemctl status soc-log-collector

# View real-time logs
sudo journalctl -u soc-log-collector -f

# Check agent logs
tail -f logs/agent.log
```

### **Performance Metrics:**
- Data collection rates
- Processing latency
- Memory usage
- Network bandwidth

### **Common Issues:**

**Connection Failed:**
```bash
# Test SOC platform connectivity
curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/health
```

**Permission Denied:**
```bash
# Fix log file permissions
sudo chmod 644 /var/log/auth.log
sudo usermod -a -G adm soc-agent
```

**High CPU Usage:**
```bash
# Reduce collection frequency
export COLLECT_NETWORK_INTERVAL=30000
```

## 🔄 **Integration with SOC Platform**

### **API Endpoints:**
- `POST /api/agent/data` - Batch data submission
- `POST /api/agent/events` - Real-time event streaming
- `GET /api/health` - Connection health check

### **Data Format:**
```json
{
  "agent_id": "agent-hostname",
  "timestamp": "2024-01-20T10:30:00Z",
  "data": [
    {
      "type": "network_connection",
      "timestamp": "2024-01-20T10:30:00Z",
      "protocol": "tcp",
      "local_address": "192.168.1.100",
      "remote_address": "185.220.101.42",
      "risk_score": 85,
      "threat_intel": {
        "is_malicious": true,
        "confidence": 95
      }
    }
  ]
}
```

## 🚀 **Scaling & Deployment**

### **Multi-Host Deployment:**
```bash
# Deploy to multiple servers
ansible-playbook -i inventory deploy-agent.yml

# Container deployment
docker run -d --name soc-agent \
  -v /var/log:/var/log:ro \
  -e SOC_ENDPOINT=http://soc-platform:3000 \
  soc-log-collector:latest
```

### **High Availability:**
- Multiple agent instances per host
- Load balancing across SOC platform instances
- Automatic failover and retry logic

This agent provides comprehensive endpoint monitoring and feeds real-time security data to your SOC platform for advanced threat detection and incident response!