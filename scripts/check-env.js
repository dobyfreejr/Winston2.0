#!/usr/bin/env node

/**
 * Winston SOC Platform - Environment Check Script
 * Validates environment configuration and API keys
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
    console.log(colorize('\n🔍 Winston SOC Platform - Environment Check', 'cyan'));
    console.log(colorize('=============================================', 'cyan'));
    console.log('');
}

function printStatus(message) {
    console.log(colorize(`[INFO] ${message}`, 'blue'));
}

function printSuccess(message) {
    console.log(colorize(`[✓] ${message}`, 'green'));
}

function printWarning(message) {
    console.log(colorize(`[⚠] ${message}`, 'yellow'));
}

function printError(message) {
    console.log(colorize(`[✗] ${message}`, 'red'));
}

// Check Node.js version
function checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
        printSuccess(`Node.js version: ${version}`);
        return true;
    } else {
        printError(`Node.js version ${version} is not supported. Please upgrade to 18+`);
        return false;
    }
}

// Check if required files exist
function checkRequiredFiles() {
    const requiredFiles = [
        'package.json',
        'next.config.js',
        'tailwind.config.ts',
        'tsconfig.json'
    ];
    
    let allExist = true;
    
    requiredFiles.forEach(file => {
        if (fs.existsSync(path.join(process.cwd(), file))) {
            printSuccess(`Required file exists: ${file}`);
        } else {
            printError(`Missing required file: ${file}`);
            allExist = false;
        }
    });
    
    return allExist;
}

// Check environment file
function checkEnvironmentFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
        printError('Environment file .env.local not found');
        printStatus('Run: npm run setup');
        return false;
    }
    
    printSuccess('Environment file exists: .env.local');
    
    // Read and validate environment variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.startsWith('#')) {
            envVars[key.trim()] = value.trim();
        }
    });
    
    // Check required API keys
    const requiredKeys = [
        'VIRUSTOTAL_API_KEY',
        'IPGEOLOCATION_API_KEY',
        'WHOISXML_API_KEY'
    ];
    
    const optionalKeys = [
        'ABUSEIPDB_API_KEY'
    ];
    
    let allConfigured = true;
    
    console.log('');
    printStatus('Checking API key configuration...');
    
    requiredKeys.forEach(key => {
        if (envVars[key] && envVars[key] !== `your_${key.toLowerCase()}_here`) {
            printSuccess(`${key}: Configured`);
        } else {
            printError(`${key}: Not configured`);
            allConfigured = false;
        }
    });
    
    optionalKeys.forEach(key => {
        if (envVars[key] && envVars[key] !== `your_${key.toLowerCase()}_here`) {
            printSuccess(`${key}: Configured (optional)`);
        } else {
            printWarning(`${key}: Not configured (optional)`);
        }
    });
    
    return allConfigured;
}

// Check dependencies
function checkDependencies() {
    const packagePath = path.join(process.cwd(), 'package.json');
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    if (!fs.existsSync(packagePath)) {
        printError('package.json not found');
        return false;
    }
    
    if (!fs.existsSync(nodeModulesPath)) {
        printError('node_modules not found');
        printStatus('Run: npm install');
        return false;
    }
    
    printSuccess('Dependencies installed');
    
    // Check for critical dependencies
    const criticalDeps = [
        'next',
        'react',
        'react-dom',
        'tailwindcss',
        'typescript'
    ];
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    let allPresent = true;
    
    criticalDeps.forEach(dep => {
        if (allDeps[dep]) {
            printSuccess(`Critical dependency: ${dep}@${allDeps[dep]}`);
        } else {
            printError(`Missing critical dependency: ${dep}`);
            allPresent = false;
        }
    });
    
    return allPresent;
}

// Check port availability
function checkPort(port = 3000) {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                printSuccess(`Port ${port} is available`);
                resolve(true);
            });
            server.close();
        });
        
        server.on('error', () => {
            printWarning(`Port ${port} is already in use`);
            printStatus(`You can use a different port: PORT=${port + 1} npm run dev`);
            resolve(false);
        });
    });
}

// Main check process
async function main() {
    printHeader();
    
    let allChecksPass = true;
    
    // Check Node.js version
    printStatus('Checking Node.js version...');
    if (!checkNodeVersion()) {
        allChecksPass = false;
    }
    
    console.log('');
    
    // Check required files
    printStatus('Checking required files...');
    if (!checkRequiredFiles()) {
        allChecksPass = false;
    }
    
    console.log('');
    
    // Check dependencies
    printStatus('Checking dependencies...');
    if (!checkDependencies()) {
        allChecksPass = false;
    }
    
    console.log('');
    
    // Check environment
    printStatus('Checking environment configuration...');
    if (!checkEnvironmentFile()) {
        allChecksPass = false;
    }
    
    console.log('');
    
    // Check port
    printStatus('Checking port availability...');
    await checkPort();
    
    console.log('');
    
    // Summary
    if (allChecksPass) {
        printSuccess('All checks passed! ✨');
        console.log('');
        console.log(colorize('Ready to start:', 'bright'));
        console.log('  npm run dev');
        console.log('');
        console.log('Then open: http://localhost:3000');
    } else {
        printError('Some checks failed. Please fix the issues above.');
        console.log('');
        console.log(colorize('Common solutions:', 'bright'));
        console.log('  npm install          # Install dependencies');
        console.log('  npm run setup        # Set up environment');
        console.log('  npm run test-apis     # Test API connections');
    }
    
    console.log('');
}

// Run checks
main().catch(error => {
    printError(`Check failed: ${error.message}`);
    process.exit(1);
});