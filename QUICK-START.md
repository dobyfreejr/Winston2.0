# Winston SOC Platform - Quick Start Guide

## 🚀 Super Quick Installation

### **Step 1: Install Node.js**
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer
4. Restart your terminal/PowerShell

### **Step 2: Run Installation**

#### **Windows (PowerShell)**
```powershell
# Simple version (recommended)
.\install-simple.ps1

# Or full version with auto-install features
.\install.ps1
```

#### **macOS/Linux**
```bash
chmod +x install.sh
./install.sh
```

### **Step 3: Get API Keys**
Edit `.env.local` and replace the placeholder values:

1. **VirusTotal** (Free): https://www.virustotal.com/gui/my-apikey
2. **IPGeolocation** (Free): https://ipgeolocation.io/
3. **WhoisXML** (Free): https://whois.whoisxmlapi.com/
4. **AbuseIPDB** (Optional): https://www.abuseipdb.com/api

### **Step 4: Start the Application**
```bash
npm run dev
```

### **Step 5: Open in Browser**
Go to: http://localhost:3000

---

## 🔧 If You Have Problems

### **Node.js Not Found**
- Make sure you downloaded from https://nodejs.org/
- Restart your terminal/PowerShell after installation
- Check version: `node --version` (should be 18+)

### **Permission Errors (Windows)**
- Run PowerShell as Administrator
- Or use the simple installer: `.\install-simple.ps1`

### **Installation Fails**
- Check your internet connection
- Try: `npm install` manually
- Delete `node_modules` folder and try again

### **Port 3000 In Use**
```bash
# Use different port
PORT=3001 npm run dev
```

---

## 📋 What Each File Does

- **`install.ps1`** - Full Windows installer with auto-install features
- **`install-simple.ps1`** - Simple Windows installer (just the basics)
- **`install.sh`** - macOS/Linux installer
- **`.env.local`** - Your API keys go here
- **`package.json`** - Project configuration

---

## 🎯 First Time Setup

1. **Create Admin Account** - On first visit, you'll create your admin user
2. **Test APIs** - Go to Settings to verify your API keys work
3. **Try Analysis** - Enter an IP address like `8.8.8.8` to test
4. **Create a Case** - Turn analysis results into investigation cases

---

## 🆘 Need Help?

1. Check this guide first
2. Make sure Node.js 18+ is installed
3. Verify your API keys are correct
4. Try the simple installer if the full one fails

The platform works with mock data even without API keys, so you can test it immediately!