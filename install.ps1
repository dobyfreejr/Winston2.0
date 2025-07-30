# Winston SOC Platform - Easy Installation Script for Windows PowerShell
# Run this script in PowerShell as Administrator for best results

param(
    [switch]$SkipNodeCheck,
    [switch]$Force
)

# Set execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

Write-Host "🛡️  Winston SOC Platform - Easy Installation" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
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

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if Node.js is installed
function Test-NodeJS {
    Write-Status "Checking Node.js installation..."
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js found: $nodeVersion"
            
            # Check if version is 18 or higher
            $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
            if ($majorVersion -lt 18) {
                Write-Warning "Node.js version 18+ recommended. Current: $nodeVersion"
            }
            return $true
        }
    }
    catch {
        # Node.js not found
    }
    
    Write-Error "Node.js not found!"
    Write-Status "Please install Node.js 18+ from: https://nodejs.org/"
    Write-Status "Or install using Chocolatey: choco install nodejs"
    Write-Status "Or install using Winget: winget install OpenJS.NodeJS"
    return $false
}

# Check if npm is installed
function Test-NPM {
    Write-Status "Checking npm installation..."
    
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Success "npm found: $npmVersion"
            return $true
        }
    }
    catch {
        # npm not found
    }
    
    Write-Error "npm not found! Please install Node.js which includes npm."
    return $false
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing project dependencies..."
    
    if (Test-Path "package.json") {
        try {
            npm install
            Write-Success "Dependencies installed successfully"
            return $true
        }
        catch {
            Write-Error "Failed to install dependencies: $_"
            return $false
        }
    }
    else {
        Write-Error "package.json not found! Are you in the correct directory?"
        return $false
    }
}

# Create environment file
function New-EnvironmentFile {
    Write-Status "Setting up environment configuration..."
    
    if (-not (Test-Path ".env.local")) {
        $envContent = @"
# Winston SOC Platform - Environment Configuration
# Copy this file to .env.local and add your actual API keys

# VirusTotal API (Required)
# Get your API key from: https://www.virustotal.com/gui/my-apikey
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here

# IPGeolocation API (Required)
# Get your API key from: https://ipgeolocation.io/
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key_here

# WhoisXML API (Required)
# Get your API key from: https://whois.whoisxmlapi.com/
WHOISXML_API_KEY=your_whoisxml_api_key_here

# AbuseIPDB API (Optional)
# Get your API key from: https://www.abuseipdb.com/api
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here

# Application Settings
NODE_ENV=development
"@
        
        try {
            $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
            Write-Success "Environment file created: .env.local"
            Write-Warning "⚠️  IMPORTANT: You need to add your API keys to .env.local"
        }
        catch {
            Write-Error "Failed to create .env.local file: $_"
            return $false
        }
    }
    else {
        Write-Success "Environment file already exists: .env.local"
    }
    return $true
}

# Check port availability
function Test-Port {
    param([int]$Port = 3000)
    
    Write-Status "Checking if port $Port is available..."
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connection) {
            Write-Warning "Port $Port is already in use"
            Write-Status "You can change the port by running: `$env:PORT=3001; npm run dev"
        }
        else {
            Write-Success "Port $Port is available"
        }
    }
    catch {
        Write-Status "Cannot check port availability"
    }
}

# Install Chocolatey (optional)
function Install-Chocolatey {
    Write-Status "Chocolatey package manager not found."
    $choice = Read-Host "Would you like to install Chocolatey for easier package management? (y/N)"
    
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        try {
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            Write-Success "Chocolatey installed successfully"
            return $true
        }
        catch {
            Write-Error "Failed to install Chocolatey: $_"
            return $false
        }
    }
    return $false
}

# Main installation process
function Start-Installation {
    Write-Host "Starting installation process..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if running as administrator
    if (-not (Test-Administrator)) {
        Write-Warning "Not running as Administrator. Some features may not work properly."
        Write-Status "Consider running PowerShell as Administrator for best results."
        Write-Host ""
    }
    
    # Check Node.js
    if (-not $SkipNodeCheck) {
        if (-not (Test-NodeJS)) {
            Write-Host ""
            Write-Status "Node.js installation options:"
            Write-Status "1. Download from: https://nodejs.org/"
            Write-Status "2. Use Chocolatey: choco install nodejs"
            Write-Status "3. Use Winget: winget install OpenJS.NodeJS"
            Write-Host ""
            
            $installChoice = Read-Host "Would you like to try installing Node.js via Chocolatey? (y/N)"
            if ($installChoice -eq 'y' -or $installChoice -eq 'Y') {
                if (Get-Command choco -ErrorAction SilentlyContinue) {
                    choco install nodejs -y
                }
                else {
                    Install-Chocolatey
                    if (Get-Command choco -ErrorAction SilentlyContinue) {
                        choco install nodejs -y
                    }
                }
                
                # Refresh environment variables
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                
                if (-not (Test-NodeJS)) {
                    Write-Error "Node.js installation failed. Please install manually."
                    exit 1
                }
            }
            else {
                Write-Error "Node.js is required. Please install it manually and run this script again."
                exit 1
            }
        }
    }
    
    # Check npm
    if (-not (Test-NPM)) {
        exit 1
    }
    
    # Install dependencies
    if (-not (Install-Dependencies)) {
        exit 1
    }
    
    # Create environment file
    if (-not (New-EnvironmentFile)) {
        exit 1
    }
    
    # Check port
    Test-Port
    
    Write-Host ""
    Write-Host "🎉 Installation completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Edit .env.local and add your API keys:"
    Write-Host "   - VirusTotal: https://www.virustotal.com/gui/my-apikey"
    Write-Host "   - IPGeolocation: https://ipgeolocation.io/"
    Write-Host "   - WhoisXML: https://whois.whoisxmlapi.com/"
    Write-Host "   - AbuseIPDB (optional): https://www.abuseipdb.com/api"
    Write-Host ""
    Write-Host "2. Start the development server:"
    Write-Host "   npm run dev"
    Write-Host ""
    Write-Host "3. Open your browser and go to:"
    Write-Host "   http://localhost:3000"
    Write-Host ""
    Write-Host "4. Create your organization admin account on first login"
    Write-Host ""
    Write-Host "📖 For more information, see README.md"
    Write-Host ""
}

# Run main installation
Start-Installation