#!/usr/bin/env node

/**
 * Keyper Deployment Verification Script
 * Made with ❤️ by Pink Pixel
 * 
 * This script verifies that all deployment files are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function banner() {
  log('', 'cyan');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                              ║', 'cyan');
  log('║  🔐 KEYPER DEPLOYMENT VERIFICATION                          ║', 'cyan');
  log('║  Secure Credential Management                                ║', 'cyan');
  log('║                                                              ║', 'cyan');
  log('║  Made with ❤️ by Pink Pixel                                 ║', 'cyan');
  log('║  Dream it, Pixel it ✨                                      ║', 'cyan');
  log('║                                                              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('', 'cyan');
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
}

function checkPackageJson() {
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found', 'red');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check deployment scripts
    const requiredScripts = ['deploy', 'deploy:preview', 'deploy:build', 'deploy:preview:build'];
    let scriptsOk = true;
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(`✅ Script: ${script}`, 'green');
      } else {
        log(`❌ Missing script: ${script}`, 'red');
        scriptsOk = false;
      }
    });

    // Check if wrangler is in devDependencies
    if (packageJson.devDependencies && packageJson.devDependencies.wrangler) {
      log(`✅ Wrangler dependency: ${packageJson.devDependencies.wrangler}`, 'green');
    } else {
      log('⚠️  Wrangler not found in devDependencies', 'yellow');
    }

    return scriptsOk;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  banner();
  
  log('🔍 Verifying deployment configuration...', 'blue');
  log('', 'reset');

  const checks = [
    // Core deployment files
    { file: 'wrangler.toml', desc: 'Wrangler configuration' },
    { file: '_routes.json', desc: 'Cloudflare Pages routing' },
    { file: '_headers', desc: 'Security headers configuration' },
    { file: '_redirects', desc: 'SPA redirect configuration' },
    
    // Environment and documentation
    { file: '.env.example', desc: 'Environment variables template' },
    { file: 'DEPLOYMENT.md', desc: 'Deployment documentation' },
    
    // Deployment scripts
    { file: 'deploy.ps1', desc: 'PowerShell deployment script' },
    { file: 'deploy.sh', desc: 'Bash deployment script' },
    
    // Core project files
    { file: 'package.json', desc: 'Package configuration' },
    { file: 'vite.config.ts', desc: 'Vite configuration' },
    { file: 'tsconfig.json', desc: 'TypeScript configuration' },
    
    // Documentation
    { file: 'README.md', desc: 'Project documentation' },
    { file: 'OVERVIEW.md', desc: 'Project overview' },
    { file: 'CHANGELOG.md', desc: 'Version history' },
    { file: 'CONTRIBUTING.md', desc: 'Contribution guidelines' },
    { file: 'LICENSE', desc: 'License file' }
  ];

  let allPassed = true;

  // Check all files
  checks.forEach(check => {
    if (!checkFile(check.file, check.desc)) {
      allPassed = false;
    }
  });

  log('', 'reset');

  // Check package.json scripts
  if (!checkPackageJson()) {
    allPassed = false;
  }

  log('', 'reset');

  // Final result
  if (allPassed) {
    log('🎉 All deployment files are properly configured!', 'green');
    log('✨ Keyper is ready for Cloudflare Pages deployment!', 'cyan');
    log('', 'reset');
    log('Next steps:', 'yellow');
    log('1. Run: wrangler login', 'blue');
    log('2. Run: npm run deploy:build', 'blue');
    log('3. Configure environment variables in Cloudflare dashboard', 'blue');
  } else {
    log('❌ Some deployment files are missing or misconfigured', 'red');
    log('Please check the missing files and try again', 'yellow');
  }

  log('', 'reset');
  log('Made with ❤️ by Pink Pixel', 'magenta');
}

main();
