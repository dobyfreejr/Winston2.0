#!/usr/bin/env node

/**
 * Winston SOC Platform - Setup Script
 * This script helps users set up the application after installation
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
    console.log(colorize('\n🛡️  Winston SOC Platform - Setup Wizard', 'cyan'));
    console.log(colorize('==========================================', 'cyan'));
    console.log('');
}

function printStatus(message) {
    console.log(colorize(`[INFO] ${message}`, 'blue'));
}

function printSuccess(message) {
    console.log(colorize(`[SUCCESS] ${message}`, 'green'));
}

function printWarning(message) {
    console.log(colorize(`[WARNING] ${message}`, 'yellow'));
}

function printError(message) {
    console.log(colorize(`[ERROR] ${message}`, 'red'));
}

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

// Check if .env.local exists
function checkEnvFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    return fs.existsSync(envPath);
}

// Create .env.local from template
function createEnvFile() {
    const templatePath = path.join(process.cwd(), '.env.example');
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, envPath);
        return true;
    }
    
    // Create basic .env.local if template doesn't exist
    const basicEnv = `# Winston SOC Platform - Environment Configuration
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key_here
WHOISXML_API_KEY=your_whoisxml_api_key_here
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
NODE_ENV=development
`;
    
    fs.writeFileSync(envPath, basicEnv);
    return true;
}

// Read current environment variables
function readEnvFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.startsWith('#')) {
            envVars[key.trim()] = value.trim();
        }
    });
    
    return envVars;
}

// Update environment file
function updateEnvFile(updates) {
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    Object.entries(updates).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }
    });
    
    fs.writeFileSync(envPath, envContent);
}

// API key setup wizard
async function setupApiKeys() {
    printStatus('Setting up API keys...');
    console.log('');
    
    const envVars = readEnvFile();
    const updates = {};
    
    // VirusTotal
    console.log(colorize('1. VirusTotal API (Required)', 'bright'));
    console.log('   Used for: Malware analysis, URL/IP reputation');
    console.log('   Sign up at: https://www.virustotal.com/gui/my-apikey');
    console.log('   Free tier: 4 requests per minute');
    
    if (envVars.VIRUSTOTAL_API_KEY === 'your_virustotal_api_key_here') {
        const vtKey = await askQuestion('   Enter your VirusTotal API key (or press Enter to skip): ');
        if (vtKey.trim()) {
            updates.VIRUSTOTAL_API_KEY = vtKey.trim();
        }
    } else {
        printSuccess('   VirusTotal API key already configured');
    }
    console.log('');
    
    // IPGeolocation
    console.log(colorize('2. IPGeolocation API (Required)', 'bright'));
    console.log('   Used for: IP address location data');
    console.log('   Sign up at: https://ipgeolocation.io/');
    console.log('   Free tier: 1,000 requests per month');
    
    if (envVars.IPGEOLOCATION_API_KEY === 'your_ipgeolocation_api_key_here') {
        const ipKey = await askQuestion('   Enter your IPGeolocation API key (or press Enter to skip): ');
        if (ipKey.trim()) {
            updates.IPGEOLOCATION_API_KEY = ipKey.trim();
        }
    } else {
        printSuccess('   IPGeolocation API key already configured');
    }
    console.log('');
    
    // WhoisXML
    console.log(colorize('3. WhoisXML API (Required)', 'bright'));
    console.log('   Used for: Domain registration information');
    console.log('   Sign up at: https://whois.whoisxmlapi.com/');
    console.log('   Free tier: 1,000 requests per month');
    
    if (envVars.WHOISXML_API_KEY === 'your_whoisxml_api_key_here') {
        const whoisKey = await askQuestion('   Enter your WhoisXML API key (or press Enter to skip): ');
        if (whoisKey.trim()) {
            updates.WHOISXML_API_KEY = whoisKey.trim();
        }
    } else {
        printSuccess('   WhoisXML API key already configured');
    }
    console.log('');
    
    // AbuseIPDB
    console.log(colorize('4. AbuseIPDB API (Optional)', 'bright'));
    console.log('   Used for: IP abuse reports');
    console.log('   Sign up at: https://www.abuseipdb.com/api');
    console.log('   Free tier: 1,000 requests per day');
    
    if (envVars.ABUSEIPDB_API_KEY === 'your_abuseipdb_api_key_here') {
        const abuseKey = await askQuestion('   Enter your AbuseIPDB API key (or press Enter to skip): ');
        if (abuseKey.trim()) {
            updates.ABUSEIPDB_API_KEY = abuseKey.trim();
        }
    } else {
        printSuccess('   AbuseIPDB API key already configured');
    }
    console.log('');
    
    // Update file if there are changes
    if (Object.keys(updates).length > 0) {
        updateEnvFile(updates);
        printSuccess(`Updated ${Object.keys(updates).length} API key(s)`);
    }
}

// Main setup process
async function main() {
    try {
        printHeader();
        
        // Check if .env.local exists
        if (!checkEnvFile()) {
            printStatus('Creating environment configuration file...');
            createEnvFile();
            printSuccess('Created .env.local file');
        } else {
            printSuccess('Environment file already exists');
        }
        
        console.log('');
        const setupKeys = await askQuestion('Would you like to set up API keys now? (y/N): ');
        
        if (setupKeys.toLowerCase() === 'y' || setupKeys.toLowerCase() === 'yes') {
            await setupApiKeys();
        }
        
        console.log('');
        printSuccess('Setup completed!');
        console.log('');
        console.log(colorize('Next steps:', 'bright'));
        console.log('1. If you skipped API key setup, edit .env.local manually');
        console.log('2. Run: npm run dev');
        console.log('3. Open: http://localhost:3000');
        console.log('4. Create your admin account on first login');
        console.log('');
        console.log('For testing API connections, run: npm run test-apis');
        console.log('');
        
    } catch (error) {
        printError(`Setup failed: ${error.message}`);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run setup
main();