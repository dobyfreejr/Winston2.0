#!/usr/bin/env node

/**
 * Winston SOC Platform - API Test Script
 * Tests all configured API endpoints
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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
    console.log(colorize('\n🧪 Winston SOC Platform - API Test Suite', 'cyan'));
    console.log(colorize('=========================================', 'cyan'));
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

// Load environment variables
function loadEnvVars() {
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
        printError('Environment file .env.local not found');
        printStatus('Run: npm run setup');
        return null;
    }
    
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

// Make HTTP request
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        
        const req = protocol.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Test VirusTotal API
async function testVirusTotal(apiKey) {
    printStatus('Testing VirusTotal API...');
    
    if (!apiKey || apiKey === 'your_virustotal_api_key_here') {
        printWarning('VirusTotal API key not configured');
        return false;
    }
    
    try {
        const response = await makeRequest('https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8', {
            method: 'GET',
            headers: {
                'X-Apikey': apiKey
            }
        });
        
        if (response.statusCode === 200) {
            printSuccess('VirusTotal API: Working');
            return true;
        } else if (response.statusCode === 401) {
            printError('VirusTotal API: Invalid API key');
            return false;
        } else if (response.statusCode === 429) {
            printWarning('VirusTotal API: Rate limit exceeded');
            return true; // API key is valid, just rate limited
        } else {
            printError(`VirusTotal API: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        printError(`VirusTotal API: ${error.message}`);
        return false;
    }
}

// Test IPGeolocation API
async function testIPGeolocation(apiKey) {
    printStatus('Testing IPGeolocation API...');
    
    if (!apiKey || apiKey === 'your_ipgeolocation_api_key_here') {
        printWarning('IPGeolocation API key not configured');
        return false;
    }
    
    try {
        const response = await makeRequest(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=8.8.8.8`);
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.data);
            if (data.ip) {
                printSuccess('IPGeolocation API: Working');
                return true;
            } else {
                printError('IPGeolocation API: Invalid response format');
                return false;
            }
        } else if (response.statusCode === 401) {
            printError('IPGeolocation API: Invalid API key');
            return false;
        } else if (response.statusCode === 429) {
            printWarning('IPGeolocation API: Rate limit exceeded');
            return true;
        } else {
            printError(`IPGeolocation API: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        printError(`IPGeolocation API: ${error.message}`);
        return false;
    }
}

// Test WhoisXML API
async function testWhoisXML(apiKey) {
    printStatus('Testing WhoisXML API...');
    
    if (!apiKey || apiKey === 'your_whoisxml_api_key_here') {
        printWarning('WhoisXML API key not configured');
        return false;
    }
    
    try {
        const response = await makeRequest(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=google.com&outputFormat=JSON`);
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.data);
            if (data.WhoisRecord) {
                printSuccess('WhoisXML API: Working');
                return true;
            } else {
                printError('WhoisXML API: Invalid response format');
                return false;
            }
        } else if (response.statusCode === 401) {
            printError('WhoisXML API: Invalid API key');
            return false;
        } else if (response.statusCode === 429) {
            printWarning('WhoisXML API: Rate limit exceeded');
            return true;
        } else {
            printError(`WhoisXML API: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        printError(`WhoisXML API: ${error.message}`);
        return false;
    }
}

// Test AbuseIPDB API
async function testAbuseIPDB(apiKey) {
    printStatus('Testing AbuseIPDB API...');
    
    if (!apiKey || apiKey === 'your_abuseipdb_api_key_here') {
        printWarning('AbuseIPDB API key not configured (optional)');
        return true; // Optional API
    }
    
    try {
        const response = await makeRequest('https://api.abuseipdb.com/api/v2/check?ipAddress=8.8.8.8&maxAgeInDays=90&verbose', {
            method: 'GET',
            headers: {
                'Key': apiKey,
                'Accept': 'application/json'
            }
        });
        
        if (response.statusCode === 200) {
            printSuccess('AbuseIPDB API: Working');
            return true;
        } else if (response.statusCode === 401) {
            printError('AbuseIPDB API: Invalid API key');
            return false;
        } else if (response.statusCode === 429) {
            printWarning('AbuseIPDB API: Rate limit exceeded');
            return true;
        } else {
            printError(`AbuseIPDB API: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        printError(`AbuseIPDB API: ${error.message}`);
        return false;
    }
}

// Test Malware Bazaar (no API key required)
async function testMalwareBazaar() {
    printStatus('Testing Malware Bazaar API...');
    
    try {
        const response = await makeRequest('https://mb-api.abuse.ch/api/v1/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'query=get_info&hash=invalid_hash_for_testing'
        });
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.data);
            if (data.query_status) {
                printSuccess('Malware Bazaar API: Working');
                return true;
            }
        }
        
        printError('Malware Bazaar API: Unexpected response');
        return false;
    } catch (error) {
        printError(`Malware Bazaar API: ${error.message}`);
        return false;
    }
}

// Main test process
async function main() {
    printHeader();
    
    const envVars = loadEnvVars();
    if (!envVars) {
        process.exit(1);
    }
    
    const results = [];
    
    // Test all APIs
    results.push(await testVirusTotal(envVars.VIRUSTOTAL_API_KEY));
    results.push(await testIPGeolocation(envVars.IPGEOLOCATION_API_KEY));
    results.push(await testWhoisXML(envVars.WHOISXML_API_KEY));
    results.push(await testAbuseIPDB(envVars.ABUSEIPDB_API_KEY));
    results.push(await testMalwareBazaar());
    
    console.log('');
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    if (passed === total) {
        printSuccess(`All API tests passed! (${passed}/${total})`);
        console.log('');
        console.log(colorize('Your Winston SOC Platform is ready to use! 🎉', 'bright'));
        console.log('');
        console.log('Start the application:');
        console.log('  npm run dev');
        console.log('');
        console.log('Then open: http://localhost:3000');
    } else {
        printWarning(`${passed}/${total} API tests passed`);
        console.log('');
        console.log(colorize('Some APIs are not configured or not working.', 'bright'));
        console.log('The platform will still work with mock data for failed APIs.');
        console.log('');
        console.log('To fix API issues:');
        console.log('1. Check your API keys in .env.local');
        console.log('2. Verify the keys work on the provider websites');
        console.log('3. Check for rate limiting or account issues');
        console.log('');
        console.log('Run setup again: npm run setup');
    }
    
    console.log('');
}

// Run tests
main().catch(error => {
    printError(`Test failed: ${error.message}`);
    process.exit(1);
});