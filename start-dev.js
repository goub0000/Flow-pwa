/**
 * Development Startup Script for Flow PWA
 *
 * This script helps set up and start the development environment:
 * - Checks prerequisites
 * - Starts necessary services
 * - Provides helpful information
 *
 * Usage: node start-dev.js [options]
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  server: {
    port: 3001,
    cwd: './server',
    script: 'server.js'
  },
  frontend: {
    port: 5000,
    host: 'localhost'
  },
  mongodb: {
    port: 27017,
    dbName: 'flow_pwa_test'
  }
};

/**
 * Check if a service is running on a specific port
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `netstat -an | findstr :${port}`
      : `lsof -i :${port}`;

    exec(command, (error, stdout) => {
      resolve(stdout.length > 0);
    });
  });
}

/**
 * Check if MongoDB is running
 */
function checkMongoDB() {
  return new Promise((resolve) => {
    exec('mongod --version', (error) => {
      if (error) {
        resolve({ installed: false, running: false });
        return;
      }

      checkPort(config.mongodb.port).then(running => {
        resolve({ installed: true, running });
      });
    });
  });
}

/**
 * Check if Node.js dependencies are installed
 */
function checkDependencies() {
  const serverPackageJson = path.join(__dirname, 'server', 'package.json');
  const rootPackageJson = path.join(__dirname, 'package.json');
  const serverNodeModules = path.join(__dirname, 'server', 'node_modules');
  const rootNodeModules = path.join(__dirname, 'node_modules');

  return {
    server: fs.existsSync(serverPackageJson) && fs.existsSync(serverNodeModules),
    root: fs.existsSync(rootPackageJson) && fs.existsSync(rootNodeModules)
  };
}

/**
 * Check if Firebase CLI is installed
 */
function checkFirebase() {
  return new Promise((resolve) => {
    exec('firebase --version', (error) => {
      resolve(!error);
    });
  });
}

/**
 * Start the auth server
 */
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting auth server...');

    const serverProcess = spawn('node', [config.server.script], {
      cwd: config.server.cwd,
      stdio: 'pipe'
    });

    let serverStarted = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[SERVER] ${output.trim()}`);

      if (output.includes('running on port') && !serverStarted) {
        serverStarted = true;
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[SERVER ERROR] ${data.toString().trim()}`);
    });

    serverProcess.on('error', (error) => {
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Server startup timeout'));
      }
    }, 30000);
  });
}

/**
 * Start Firebase hosting
 */
function startFirebase() {
  return new Promise((resolve, reject) => {
    console.log('🔥 Starting Firebase hosting...');

    const firebaseProcess = spawn('firebase', ['serve', '--only', 'hosting', '--port', config.frontend.port], {
      stdio: 'pipe'
    });

    let firebaseStarted = false;

    firebaseProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[FIREBASE] ${output.trim()}`);

      if (output.includes('hosting: Local server:') && !firebaseStarted) {
        firebaseStarted = true;
        resolve(firebaseProcess);
      }
    });

    firebaseProcess.stderr.on('data', (data) => {
      console.error(`[FIREBASE ERROR] ${data.toString().trim()}`);
    });

    firebaseProcess.on('error', (error) => {
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!firebaseStarted) {
        reject(new Error('Firebase startup timeout'));
      }
    }, 30000);
  });
}

/**
 * Display setup instructions
 */
function displayInstructions() {
  console.log('\n📋 DEVELOPMENT SETUP COMPLETE');
  console.log('==============================');
  console.log(`🌐 Frontend: http://${config.frontend.host}:${config.frontend.port}`);
  console.log(`⚡ API Server: http://localhost:${config.server.port}`);
  console.log(`🗄️  Database: MongoDB on port ${config.mongodb.port}`);
  console.log('\n🔗 Key URLs:');
  console.log(`   • Institution Dashboard: http://${config.frontend.host}:${config.frontend.port}/institutions/`);
  console.log(`   • Institution Onboarding: http://${config.frontend.host}:${config.frontend.port}/institutions/onboarding.html`);
  console.log(`   • API Health: http://localhost:${config.server.port}/health`);
  console.log('\n🧪 Testing:');
  console.log('   • Complete project tests: node test-complete-project.js');
  console.log('   • Integration tests: node test-integration.js');
  console.log('   • Institution onboarding: node test-onboarding.js');
  console.log('   • Specific module: node test-complete-project.js --module=students');
  console.log('   • Specific scenario: node test-integration.js --scenario=student');
  console.log('   • API health check: curl http://localhost:3001/health');
  console.log('\n⏹️  To stop services: Ctrl+C');
}

/**
 * Main startup function
 */
async function startDevelopment() {
  console.log('🔧 Flow PWA Development Environment');
  console.log('===================================');

  // Check prerequisites
  console.log('\n🔍 Checking prerequisites...');

  // Check MongoDB
  const mongoStatus = await checkMongoDB();
  if (!mongoStatus.installed) {
    console.error('❌ MongoDB is not installed. Please install MongoDB first.');
    process.exit(1);
  }
  if (!mongoStatus.running) {
    console.log('⚠️  MongoDB is not running. Please start MongoDB:');
    console.log('   mongod --dbpath /data/db');
    console.log('   (or use your preferred MongoDB setup)');
    process.exit(1);
  }
  console.log('✅ MongoDB is running');

  // Check dependencies
  const deps = checkDependencies();
  if (!deps.server) {
    console.log('⚠️  Server dependencies not installed. Installing...');
    try {
      await new Promise((resolve, reject) => {
        const npmInstall = spawn('npm', ['install'], { cwd: './server', stdio: 'inherit' });
        npmInstall.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`npm install failed with code ${code}`));
        });
      });
      console.log('✅ Server dependencies installed');
    } catch (error) {
      console.error('❌ Failed to install server dependencies:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Server dependencies ready');
  }

  if (!deps.root) {
    console.log('⚠️  Root dependencies not installed. Installing...');
    try {
      await new Promise((resolve, reject) => {
        const npmInstall = spawn('npm', ['install'], { stdio: 'inherit' });
        npmInstall.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`npm install failed with code ${code}`));
        });
      });
      console.log('✅ Root dependencies installed');
    } catch (error) {
      console.error('❌ Failed to install root dependencies:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Root dependencies ready');
  }

  // Check Firebase CLI
  const firebaseInstalled = await checkFirebase();
  if (!firebaseInstalled) {
    console.error('❌ Firebase CLI is not installed. Please install it:');
    console.error('   npm install -g firebase-tools');
    process.exit(1);
  }
  console.log('✅ Firebase CLI ready');

  // Check if ports are available
  const serverPortInUse = await checkPort(config.server.port);
  const frontendPortInUse = await checkPort(config.frontend.port);

  if (serverPortInUse) {
    console.error(`❌ Port ${config.server.port} is already in use. Please stop the existing service.`);
    process.exit(1);
  }

  if (frontendPortInUse) {
    console.error(`❌ Port ${config.frontend.port} is already in use. Please stop the existing service.`);
    process.exit(1);
  }

  console.log('✅ Ports available');

  // Start services
  try {
    const serverProcess = await startServer();
    const firebaseProcess = await startFirebase();

    // Display instructions
    displayInstructions();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development environment...');
      serverProcess.kill();
      firebaseProcess.kill();
      process.exit(0);
    });

    // Keep the process alive
    process.stdin.resume();

  } catch (error) {
    console.error('❌ Failed to start services:', error.message);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (require.main === module) {
  startDevelopment().catch(error => {
    console.error('❌ Development startup failed:', error);
    process.exit(1);
  });
}

module.exports = {
  startDevelopment,
  config
};