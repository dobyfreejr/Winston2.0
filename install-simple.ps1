# Winston SOC Platform - Simple Installation Script
# This is a simplified version that focuses on the essentials

Write-Host "🛡️  Winston SOC Platform - Simple Installation" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "2. Download the LTS version" -ForegroundColor Yellow
    Write-Host "3. Run the installer" -ForegroundColor Yellow
    Write-Host "4. Restart PowerShell and run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
Write-Host "Checking npm..." -ForegroundColor Blue
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    Write-Host "Please reinstall Node.js (npm comes with Node.js)" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Blue
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    } else {
        throw "npm install failed"
    }
} catch {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Please check your internet connection and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create environment file
Write-Host "Setting up environment..." -ForegroundColor Blue
if (-not (Test-Path ".env.local")) {
    $envContent = @"
# Winston SOC Platform - Environment Configuration
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key_here
WHOISXML_API_KEY=your_whoisxml_api_key_here
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
NODE_ENV=development
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✓ Environment file created: .env.local" -ForegroundColor Green
} else {
    Write-Host "✓ Environment file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local and add your API keys" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "API key signup links:" -ForegroundColor Cyan
Write-Host "- VirusTotal: https://www.virustotal.com/gui/my-apikey" -ForegroundColor White
Write-Host "- IPGeolocation: https://ipgeolocation.io/" -ForegroundColor White
Write-Host "- WhoisXML: https://whois.whoisxmlapi.com/" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"