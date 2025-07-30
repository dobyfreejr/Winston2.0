# Winston - Security Operations Platform

Winston is a comprehensive Security Operations Center (SOC) platform for threat intelligence analysis, case management, and security monitoring.

## 🚀 **Super Quick Start (3 Steps)**

### **Step 1: Install Node.js**
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer
4. **Restart PowerShell/Terminal**

### **Step 2: Run Installation**

#### **Windows (Choose One)**
```powershell
# Simple installer (recommended if you have issues)
.\install-simple.ps1

# OR: Full installer with auto-install features
.\install.ps1

# OR: Just start the server directly
.\start.ps1
```

#### **macOS/Linux**
```bash
chmod +x install.sh
./install.sh
```

### **Step 3: Start the Server**
```bash
npm run dev

# OR on Windows:
.\start.ps1
```

Then open: **http://localhost:3000**

---

## 🎯 **If You Just Want to Run It Now**

```powershell
# Windows - One command to start everything
.\start.ps1
```

This will:
1. Check if Node.js is installed
2. Install dependencies if needed
3. Create environment file
4. Start the server on http://localhost:3000

**The platform works immediately with mock data - no API keys required for testing!**

---

## 🔧 **Detailed Installation**

### **Automated Installation (Recommended)**

#### **Windows (PowerShell)**
```powershell
# If you have problems with the main installer, try the simple one:
.\install-simple.ps1

# Full installer with automatic Node.js installation:
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install.ps1
```

#### **macOS/Linux (Bash)**
```bash
chmod +x install.sh
./install.sh
```

#### **After Installation**
```bash
# Set up API keys (interactive)
npm run setup

# Test API connections
npm run test-apis

# Start the application
npm run dev
```

Then open: **http://localhost:3000**

### **If Installation Fails**

1. **Make sure Node.js is installed**: https://nodejs.org/
2. **Try the simple installer**: `.\install-simple.ps1` (Windows)
3. **Manual installation**: See [INSTALL.md](INSTALL.md)
4. **Check the quick start guide**: [QUICK-START.md](QUICK-START.md)

---

## 📋 **Manual Installation**

If the automated scripts don't work, see [INSTALL.md](INSTALL.md) for detailed manual installation instructions.

## 🔑 **API Keys Setup**

### **Step 1: Get Your API Keys**

To use this platform with real threat intelligence data, you'll need API keys from these services:

#### **Required APIs:**
1. **VirusTotal** (Free tier: 4 requests/minute)
   - Visit: https://www.virustotal.com/gui/my-apikey
   - Sign up and get your API key

2. **IPGeolocation** (Free tier: 1,000 requests/month)
   - Visit: https://ipgeolocation.io/
   - Sign up and get your API key

3. **WhoisXML** (Free tier: 1,000 requests/month)
   - Visit: https://whois.whoisxmlapi.com/
   - Sign up and get your API key

#### **Optional APIs:**
4. **AbuseIPDB** (Free tier: 1,000 requests/day)
   - Visit: https://www.abuseipdb.com/api
   - Sign up and get your API key

### **Step 2: Configure API Keys**

1. **Add your API keys to `.env.local`:**
   ```env
   # Required API Keys
   VIRUSTOTAL_API_KEY=your_actual_virustotal_api_key_here
   IPGEOLOCATION_API_KEY=your_actual_ipgeolocation_api_key_here
   WHOISXML_API_KEY=your_actual_whoisxml_api_key_here
   
   # Optional API Keys
   ABUSEIPDB_API_KEY=your_actual_abuseipdb_api_key_here
   ```

2. **Replace the placeholder values** with your actual API keys
3. **Restart the development server**

### **Step 3: Verify Setup**

1. Go to **Settings** page
2. Check that all APIs show as "Active"
3. If any show as "Not Configured", verify your API keys

## 🔧 **Features**

### **Threat Intelligence Analysis**
- **Multi-Source Analysis**: VirusTotal, IPGeolocation, WhoisXML, AbuseIPDB
- **Indicator Types**: IP addresses, domains, URLs, file hashes
- **Real-time Results**: Live threat intelligence data
- **Reputation Scoring**: Automated threat level assessment

### **Case Management**
- **Create Cases**: From threat detections or manually
- **Track Investigations**: Status updates and progress tracking
- **Assign Cases**: Team collaboration features
- **Link Indicators**: Associate IOCs with cases

### **Network Analysis API**
- **Real-time Data Ingestion**: Send network connections and assets via API
- **Live Monitoring**: View network activity as it happens
- **Threat Detection**: Automatic flagging of suspicious connections
- **Asset Discovery**: Track network devices and their security status

### **Dynamic Dashboard**
- **Real-time Stats**: Based on your actual analysis activity
- **Recent Activity**: Your search history and findings
- **Threat Detections**: Automatically flagged high-risk indicators
- **Case Overview**: Active investigations status

## 📡 **Network Analysis API**

### **Send Network Connections:**
```bash
curl -X POST http://localhost:3000/api/network/connections \
  -H "Content-Type: application/json" \
  -d '{
    "type": "connection",
    "data": {
      "sourceIp": "192.168.1.100",
      "destIp": "185.220.101.42",
      "sourcePort": 49152,
      "destPort": 443,
      "protocol": "TCP",
      "status": "active",
      "bytes": 1024000,
      "packets": 850,
      "country": "Russia",
      "threatLevel": "high"
    }
  }'
```

### **Send Network Assets:**
```bash
curl -X POST http://localhost:3000/api/network/connections \
  -H "Content-Type: application/json" \
  -d '{
    "type": "asset",
    "data": {
      "ip": "192.168.1.100",
      "hostname": "workstation-01",
      "type": "workstation",
      "os": "Windows 11",
      "status": "online",
      "openPorts": [135, 139, 445, 3389],
      "vulnerabilities": 2
    }
  }'
```

### **Get Network Data:**
```bash
# Get connections
curl http://localhost:3000/api/network/connections?type=connections

# Get assets
curl http://localhost:3000/api/network/connections?type=assets
```

## 📊 **How It Works**

### **1. Analyze Indicators**
- Enter IP, domain, URL, or hash in Threat Analysis
- Get comprehensive intelligence from multiple sources
- Automatic threat level assessment
- Results saved to your history

### **2. Manage Cases**
- Create cases from high-risk detections
- Track investigation progress
- Assign to team members
- Link related indicators

### **3. Monitor Dashboard**
- View real-time statistics
- Track recent activity
- Monitor threat levels
- Manage active cases

## 🛡️ **Security Features**

- **API Key Security**: Server-side only, never exposed to client
- **CORS Protection**: All external APIs proxied through secure routes
- **Rate Limit Handling**: Respects API provider limits
- **Data Persistence**: In-memory storage (easily replaceable with database)

## 🔄 **Data Flow**

1. **Analysis Request** → API routes → External threat intelligence services
2. **Results Processing** → Threat level assessment → Database storage
3. **Dashboard Updates** → Real-time statistics → Case creation options
4. **Case Management** → Investigation tracking → Team collaboration

## 📈 **Scaling for Production**

### **Database Integration**
Replace the in-memory database (`lib/database.ts`) with:
- PostgreSQL for relational data
- MongoDB for document storage
- Redis for caching

### **Authentication**
Add user authentication:
- JWT tokens
- Role-based access control
- Team management

### **Advanced Features**
- Email notifications
- Automated playbooks
- Integration with SIEM systems
- Custom threat intelligence feeds

## 🚨 **Important Notes**

- **API Rate Limits**: Monitor your usage to avoid hitting limits
- **Data Retention**: Current setup uses in-memory storage
- **Team Usage**: Built for single-user, easily expandable for teams
- **Real-time Updates**: Dashboard refreshes automatically

## 📝 **Usage Tips**

1. **Start Small**: Test with a few indicators first
2. **Monitor Limits**: Check API usage in provider dashboards
3. **Create Cases**: Use case management for investigations
4. **Regular Analysis**: Build up your threat intelligence database
5. **Team Workflow**: Assign cases and track progress

This is **Winston** - a production-ready SOC platform with API-driven network analysis. Send your network data via API and see it visualized in real-time!