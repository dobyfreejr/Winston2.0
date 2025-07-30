# Winston SOC Platform - Installation Guide

This guide provides multiple ways to install and set up the Winston SOC Platform on different operating systems.

## 🚀 Quick Installation (Recommended)

### Windows (PowerShell)
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install.ps1
```

### macOS/Linux (Bash)
```bash
chmod +x install.sh
./install.sh
```

## 📋 Prerequisites

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

## 🔧 Manual Installation

If the automated scripts don't work, follow these manual steps:

### 1. Install Node.js

#### Windows
- Download from [nodejs.org](https://nodejs.org/)
- Or use Chocolatey: `choco install nodejs`
- Or use Winget: `winget install OpenJS.NodeJS`

#### macOS
- Download from [nodejs.org](https://nodejs.org/)
- Or use Homebrew: `brew install node`

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Linux (CentOS/RHEL/Fedora)
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Clone or Download the Project
```bash
git clone <repository-url>
cd winston-soc-platform
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your API keys
# Windows: notepad .env.local
# macOS: open -e .env.local
# Linux: nano .env.local
```

### 5. Get API Keys

You'll need to sign up for these services and get API keys:

#### Required APIs:
1. **VirusTotal** (Free: 4 requests/minute)
   - Visit: https://www.virustotal.com/gui/my-apikey
   - Sign up and get your API key

2. **IPGeolocation** (Free: 1,000 requests/month)
   - Visit: https://ipgeolocation.io/
   - Sign up and get your API key

3. **WhoisXML** (Free: 1,000 requests/month)
   - Visit: https://whois.whoisxmlapi.com/
   - Sign up and get your API key

#### Optional APIs:
4. **AbuseIPDB** (Free: 1,000 requests/day)
   - Visit: https://www.abuseipdb.com/api
   - Sign up and get your API key

### 6. Start the Application
```bash
npm run dev
```

### 7. Access the Application
Open your browser and go to: http://localhost:3000

## 🐳 Docker Installation (Alternative)

If you prefer using Docker:

```bash
# Build the Docker image
docker build -t winston-soc .

# Run the container
docker run -p 3000:3000 --env-file .env.local winston-soc
```

## 🔍 Troubleshooting

### Common Issues

#### Port 3000 Already in Use
```bash
# Use a different port
PORT=3001 npm run dev
```

#### Permission Errors (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

#### Node.js Version Issues
```bash
# Check your Node.js version
node --version

# Should be 18.0.0 or higher
```

#### API Key Issues
- Make sure your API keys are correctly added to `.env.local`
- Verify the keys work by testing them directly on the provider websites
- Check that you haven't exceeded rate limits

#### Windows PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Getting Help

1. Check the console output for error messages
2. Verify all API keys are correctly configured
3. Ensure all dependencies are installed
4. Check that ports are available

## 🚀 Production Deployment

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on:
- Setting up a production database
- Configuring environment variables
- Setting up reverse proxy (Nginx)
- SSL certificate configuration
- Process management (PM2)

## 📖 Next Steps

After installation:

1. **First Login**: Create your organization admin account
2. **Configure APIs**: Verify all API integrations in Settings
3. **Test Analysis**: Try analyzing a known indicator
4. **Create Cases**: Set up your first investigation case
5. **Explore Features**: Check out all the platform capabilities

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use strong passwords for admin accounts
- Keep API keys secure and rotate them regularly
- Consider using environment-specific configurations for production

## 📞 Support

If you encounter issues during installation:
1. Check this guide first
2. Review the troubleshooting section
3. Check the project's issue tracker
4. Ensure you're using supported Node.js versions