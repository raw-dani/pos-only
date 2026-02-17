const readline = require('readline');

/**
 * CLI Commands for License Management
 * 
 * Usage:
 *   node cli-commands.js set-online
 *   node cli-commands.js set-offline
 *   node cli-commands.js set-domain <domain>
 *   node cli-commands.js set-active <password>
 *   node cli-commands.js revoke <password>
 *   node cli-commands.js status
 */

const license = require('./license');

const args = process.argv.slice(2);
const command = args[0];
const commandArg = args[1]; // password for set-active/revoke, domain for set-domain

// Create readline interface for password input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

const runCommand = async () => {
  console.log('\n========================================');
  console.log('   POS Application License Manager');
  console.log('========================================\n');

  switch (command) {
    case 'set-online':
      console.log('📌 Setting mode to ONLINE...');
      const onlineResult = license.setMode('online');
      if (onlineResult) {
        console.log('✅ Mode set to ONLINE');
        console.log('   Next step: npm run license:set-domain <your-domain.com>');
        console.log('   Then: npm run license:set-active <password>');
      } else {
        console.log('❌ Failed to set mode');
      }
      rl.close();
      break;

    case 'set-offline':
      console.log('📌 Setting mode to OFFLINE...');
      const offlineResult = license.setMode('offline');
      if (offlineResult) {
        console.log('✅ Mode set to OFFLINE');
        console.log('   Next step: npm run license:set-active <password>');
      } else {
        console.log('❌ Failed to set mode');
      }
      rl.close();
      break;

    case 'set-domain':
      const domain = args[1];
      if (!domain) {
        console.log('❌ Error: Domain is required');
        console.log('   Usage: npm run license:set-domain <domain.com>');
        console.log('   Example: npm run license:set-domain tokoonline.com');
        rl.close();
        break;
      }
      console.log(`📌 Setting domain to: ${domain}...`);
      const domainResult = license.setDomain(domain);
      if (domainResult) {
        console.log(`✅ Domain set to: ${domain}`);
        console.log('   Next step: npm run license:set-active <password>');
      } else {
        console.log('❌ Failed to set domain');
      }
      rl.close();
      break;

    case 'set-active':
      let password = commandArg;
      
      // If no password provided as argument, ask for it
      if (!password) {
        password = await question('Enter activation password: ');
      }
      
      console.log('📌 Activating license...');
      const activeResult = license.setActive(true, password);
      if (activeResult.success) {
        console.log('✅ License ACTIVATED successfully!');
        
        const info = license.getLicenseInfo();
        console.log('\n--- License Info ---');
        console.log(`   Mode: ${info.mode}`);
        console.log(`   Domain: ${info.domain || 'N/A'}`);
        console.log(`   Active: ${info.active}`);
        console.log(`   Activated: ${info.activatedAt || 'N/A'}`);
      } else {
        console.log(`❌ ${activeResult.message}`);
      }
      rl.close();
      break;

    case 'revoke':
      let revokePassword = commandArg;
      
      // If no password provided as argument, ask for it
      if (!revokePassword) {
        revokePassword = await question('Enter revoke password: ');
      }
      
      console.log('📌 Revoking license...');
      const revokeResult = license.revoke(revokePassword);
      if (revokeResult.success) {
        console.log('✅ License REVOKED');
        console.log('   You can now set new mode and domain');
      } else {
        console.log(`❌ ${revokeResult.message}`);
      }
      rl.close();
      break;

    case 'status':
      console.log('📌 Checking license status...\n');
      const status = license.getLicenseInfo();
      
      if (!status.configured) {
        console.log('⚠️  No license configured');
        console.log('   Run: npm run license:set-offline && npm run license:set-active');
        console.log('   OR: npm run license:set-online && npm run license:set-domain <domain> && npm run license:set-active');
      } else {
        console.log('--- License Status ---');
        console.log(`   Configured: ✅ Yes`);
        console.log(`   Mode: ${status.mode || 'N/A'}`);
        console.log(`   Domain: ${status.domain || 'N/A'}`);
        console.log(`   Active: ${status.active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${status.createdAt || 'N/A'}`);
        console.log(`   Activated: ${status.activatedAt || 'N/A'}`);
        console.log(`   Updated: ${status.updatedAt || 'N/A'}`);
        
        if (!status.active) {
          console.log('\n⚠️  License is NOT active');
          console.log('   Run: npm run license:set-active');
        }
      }
      break;

    default:
      console.log('❌ Unknown command');
      console.log('\nAvailable commands:');
      console.log('   npm run license:set-online      - Set mode to online');
      console.log('   npm run license:set-offline     - Set mode to offline');
      console.log('   npm run license:set-domain     - Set domain (requires domain argument)');
      console.log('   npm run license:set-active     - Activate license');
      console.log('   npm run license:revoke         - Revoke license');
      console.log('   npm run license:status         - Check license status');
      console.log('\nExamples:');
      console.log('   # Offline mode:');
      console.log('   npm run license:set-offline && npm run license:set-active');
      console.log('\n   # Online mode:');
      console.log('   npm run license:set-online && npm run license:set-domain tokoonline.com && npm run license:set-active');
      console.log('\n   # Change domain:');
      console.log('   npm run license:revoke && npm run license:set-domain newdomain.com && npm run license:set-active');
      break;
  }

  console.log('\n========================================\n');
};

runCommand();
