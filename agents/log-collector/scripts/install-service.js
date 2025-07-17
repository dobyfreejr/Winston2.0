const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serviceName = 'soc-log-collector';
const serviceUser = 'soc-agent';
const workingDir = path.resolve(__dirname, '..');
const nodeExecutable = process.execPath;
const scriptPath = path.join(workingDir, 'src/index.js');

const systemdService = `[Unit]
Description=SOC Log Collection Agent
After=network.target
Wants=network.target

[Service]
Type=simple
User=${serviceUser}
Group=${serviceUser}
WorkingDirectory=${workingDir}
ExecStart=${nodeExecutable} ${scriptPath}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${serviceName}

# Environment variables
Environment=NODE_ENV=production
Environment=SOC_ENDPOINT=http://localhost:3000
Environment=SOC_API_KEY=your-api-key-here
Environment=SOC_AGENT_ID=agent-$(hostname)

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${workingDir}/logs

[Install]
WantedBy=multi-user.target
`;

function installService() {
  console.log('Installing SOC Log Collection Agent as systemd service...');
  
  try {
    // Create service user if it doesn't exist
    try {
      execSync(`id ${serviceUser}`, { stdio: 'ignore' });
      console.log(`User ${serviceUser} already exists`);
    } catch {
      console.log(`Creating user ${serviceUser}...`);
      execSync(`sudo useradd -r -s /bin/false ${serviceUser}`);
    }
    
    // Set ownership of working directory
    console.log('Setting directory permissions...');
    execSync(`sudo chown -R ${serviceUser}:${serviceUser} ${workingDir}`);
    
    // Write systemd service file
    const servicePath = `/etc/systemd/system/${serviceName}.service`;
    console.log(`Writing service file to ${servicePath}...`);
    fs.writeFileSync('/tmp/soc-service.tmp', systemdService);
    execSync(`sudo mv /tmp/soc-service.tmp ${servicePath}`);
    
    // Reload systemd and enable service
    console.log('Reloading systemd...');
    execSync('sudo systemctl daemon-reload');
    
    console.log('Enabling service...');
    execSync(`sudo systemctl enable ${serviceName}`);
    
    console.log('\n✅ Service installed successfully!');
    console.log('\nNext steps:');
    console.log(`1. Edit the service configuration: sudo systemctl edit ${serviceName}`);
    console.log('2. Set your SOC platform endpoint and API key');
    console.log(`3. Start the service: sudo systemctl start ${serviceName}`);
    console.log(`4. Check status: sudo systemctl status ${serviceName}`);
    console.log(`5. View logs: sudo journalctl -u ${serviceName} -f`);
    
  } catch (error) {
    console.error('❌ Failed to install service:', error.message);
    process.exit(1);
  }
}

function uninstallService() {
  console.log('Uninstalling SOC Log Collection Agent service...');
  
  try {
    // Stop and disable service
    execSync(`sudo systemctl stop ${serviceName}`, { stdio: 'ignore' });
    execSync(`sudo systemctl disable ${serviceName}`, { stdio: 'ignore' });
    
    // Remove service file
    execSync(`sudo rm -f /etc/systemd/system/${serviceName}.service`);
    
    // Reload systemd
    execSync('sudo systemctl daemon-reload');
    
    console.log('✅ Service uninstalled successfully!');
  } catch (error) {
    console.error('❌ Failed to uninstall service:', error.message);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'install':
    installService();
    break;
  case 'uninstall':
    uninstallService();
    break;
  default:
    console.log('Usage: node install-service.js [install|uninstall]');
    process.exit(1);
}