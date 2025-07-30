#!/bin/bash

# Winston SOC Platform - Easy Installation Script
# This script automates the installation process on Unix-like systems

set -e  # Exit on any error

echo "🛡️  Winston SOC Platform - Easy Installation"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on supported OS
check_os() {
    print_status "Checking operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_success "Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_success "macOS detected"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        print_success "Windows (Git Bash/Cygwin) detected"
    else
        print_error "Unsupported operating system: $OSTYPE"
        print_error "Please install manually or use Windows PowerShell script"
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_warning "Node.js version 18+ recommended. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js not found!"
        print_status "Please install Node.js 18+ from: https://nodejs.org/"
        
        if [[ "$OS" == "macos" ]]; then
            print_status "On macOS, you can install using Homebrew:"
            print_status "  brew install node"
        elif [[ "$OS" == "linux" ]]; then
            print_status "On Ubuntu/Debian:"
            print_status "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
            print_status "  sudo apt-get install -y nodejs"
        fi
        
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    else
        print_error "npm not found! Please install Node.js which includes npm."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencies installed successfully"
    else
        print_error "package.json not found! Are you in the correct directory?"
        exit 1
    fi
}

# Create environment file
create_env_file() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local 2>/dev/null || {
            print_status "Creating .env.local file..."
            cat > .env.local << 'EOF'
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
EOF
        }
        print_success "Environment file created: .env.local"
        print_warning "⚠️  IMPORTANT: You need to add your API keys to .env.local"
    else
        print_success "Environment file already exists: .env.local"
    fi
}

# Check port availability
check_port() {
    print_status "Checking if port 3000 is available..."
    
    if command -v lsof &> /dev/null; then
        if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
            print_warning "Port 3000 is already in use"
            print_status "You can change the port by running: PORT=3001 npm run dev"
        else
            print_success "Port 3000 is available"
        fi
    else
        print_status "Cannot check port availability (lsof not found)"
    fi
}

# Main installation process
main() {
    echo "Starting installation process..."
    echo ""
    
    check_os
    check_node
    check_npm
    install_dependencies
    create_env_file
    check_port
    
    echo ""
    echo "🎉 Installation completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Edit .env.local and add your API keys:"
    echo "   - VirusTotal: https://www.virustotal.com/gui/my-apikey"
    echo "   - IPGeolocation: https://ipgeolocation.io/"
    echo "   - WhoisXML: https://whois.whoisxmlapi.com/"
    echo "   - AbuseIPDB (optional): https://www.abuseipdb.com/api"
    echo ""
    echo "2. Start the development server:"
    echo "   npm run dev"
    echo ""
    echo "3. Open your browser and go to:"
    echo "   http://localhost:3000"
    echo ""
    echo "4. Create your organization admin account on first login"
    echo ""
    echo "📖 For more information, see README.md"
    echo ""
}

# Run main function
main