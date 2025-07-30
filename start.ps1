# Winston SOC Platform - Quick Start Script
# This script starts the development server

Write-Host "🛡️  Winston SOC Platform - Starting Server" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is available
Write-Status "Checking Node.js..."
try {
    $nodeVersion = & node --version 2>$null
    if ($nodeVersion) {
        Write-Success "Node.js found: $nodeVersion"
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Error "Node.js not found! Please install Node.js first:"
    Write-Host "1. Go to: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "2. Download and install the LTS version" -ForegroundColor Yellow
    Write-Host "3. Restart PowerShell and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
Write-Status "Checking npm..."
try {
    $npmVersion = & npm --version 2>$null
    if ($npmVersion) {
        Write-Success "npm found: $npmVersion"
    } else {
        throw "npm not found"
    }
} catch {
    Write-Error "npm not found! Please reinstall Node.js."
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if dependencies are installed
Write-Status "Checking dependencies..."
if (-not (Test-Path "node_modules")) {
    Write-Status "Installing dependencies..."
    try {
        & npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Dependencies installed successfully"
        } else {
            throw "npm install failed"
        }
    } catch {
        Write-Error "Failed to install dependencies"
        Write-Host "Please check your internet connection and try again" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Success "Dependencies already installed"
}

# Check if environment file exists
Write-Status "Checking environment configuration..."
if (-not (Test-Path ".env.local")) {
    Write-Status "Creating environment file..."
    $envContent = @"
# Winston SOC Platform - Environment Configuration
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key_here
WHOISXML_API_KEY=your_whoisxml_api_key_here
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
NODE_ENV=development
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Success "Environment file created: .env.local"
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env.local and add your API keys!" -ForegroundColor Yellow
    Write-Host "   - VirusTotal: https://www.virustotal.com/gui/my-apikey" -ForegroundColor Yellow
    Write-Host "   - IPGeolocation: https://ipgeolocation.io/" -ForegroundColor Yellow
    Write-Host "   - WhoisXML: https://whois.whoisxmlapi.com/" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Success "Environment file exists"
}

# Start the development server
Write-Host ""
Write-Host "🚀 Starting Winston SOC Platform..." -ForegroundColor Green
Write-Host ""
Write-Host "The server will start on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    & npm run dev
} catch {
    Write-Error "Failed to start the development server"
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}