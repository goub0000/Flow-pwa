#!/usr/bin/env node

/**
 * Firebase Setup Script for Flow PWA
 * This script helps set up Firebase Functions and configure the project
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Setup for Flow PWA');
console.log('==============================');

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  return new Promise((resolve) => {
    exec('firebase --version', (error, stdout) => {
      if (error) {
        console.log('❌ Firebase CLI not found');
        console.log('📦 Install Firebase CLI with: npm install -g firebase-tools');
        resolve(false);
      } else {
        console.log('✅ Firebase CLI installed:', stdout.trim());
        resolve(true);
      }
    });
  });
}

// Check if user is logged in to Firebase
function checkFirebaseAuth() {
  return new Promise((resolve) => {
    exec('firebase projects:list', (error, stdout) => {
      if (error || stdout.includes('not authenticated')) {
        console.log('🔐 Please log in to Firebase');
        console.log('▶️  Run: firebase login');
        resolve(false);
      } else {
        console.log('✅ Firebase authentication verified');
        resolve(true);
      }
    });
  });
}

// Install Functions dependencies
function installFunctionsDependencies() {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing Firebase Functions dependencies...');

    const npmInstall = spawn('npm', ['install'], {
      cwd: './functions',
      stdio: 'inherit'
    });

    npmInstall.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Functions dependencies installed');
        resolve();
      } else {
        console.log('❌ Failed to install Functions dependencies');
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

// Create functions source directory
function createFunctionsStructure() {
  const functionsDir = './functions';
  const srcDir = './functions/src';

  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir);
    console.log('📁 Created functions directory');
  }

  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir);
    console.log('📁 Created functions/src directory');
  }

  console.log('✅ Functions directory structure ready');
}

// Build TypeScript functions
function buildFunctions() {
  return new Promise((resolve, reject) => {
    console.log('🔨 Building TypeScript functions...');

    const tscBuild = spawn('npx', ['tsc'], {
      cwd: './functions',
      stdio: 'inherit'
    });

    tscBuild.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Functions compiled successfully');
        resolve();
      } else {
        console.log('⚠️  TypeScript compilation had warnings/errors');
        // Continue anyway for now
        resolve();
      }
    });
  });
}

// Initialize Firebase project (if needed)
function initializeFirebaseProject() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Initializing Firebase project...');

    if (fs.existsSync('./.firebaserc') && fs.existsSync('./firebase.json')) {
      console.log('✅ Firebase project already initialized');
      resolve();
      return;
    }

    console.log('📋 Firebase initialization required');
    console.log('   Run: firebase init');
    console.log('   Select: Functions, Firestore, Hosting, Storage');
    console.log('   Choose existing project or create new one');
    resolve();
  });
}

// Start Firebase emulators
function startEmulators() {
  return new Promise((resolve) => {
    console.log('🔧 Starting Firebase emulators...');

    const emulators = spawn('firebase', ['emulators:start'], {
      stdio: 'inherit'
    });

    // Give emulators time to start
    setTimeout(() => {
      console.log('✅ Firebase emulators should be starting...');
      console.log('🌐 Access Firebase UI at: http://localhost:4000');
      resolve();
    }, 3000);
  });
}

// Display helpful information
function displayInformation() {
  console.log('\n🎯 Firebase Setup Summary');
  console.log('========================');
  console.log('📁 Project Structure:');
  console.log('   ├── functions/          - Firebase Functions (TypeScript)');
  console.log('   ├── firestore.rules     - Firestore security rules');
  console.log('   ├── firestore.indexes.json - Firestore indexes');
  console.log('   ├── storage.rules       - Storage security rules');
  console.log('   └── firebase.json       - Firebase configuration');

  console.log('\n🔧 Development Commands:');
  console.log('   firebase emulators:start          - Start all emulators');
  console.log('   firebase deploy --only functions  - Deploy functions only');
  console.log('   firebase deploy --only firestore  - Deploy Firestore rules');
  console.log('   firebase deploy --only hosting    - Deploy hosting');
  console.log('   firebase deploy                   - Deploy everything');

  console.log('\n🌐 Local URLs (when emulators running):');
  console.log('   Firebase UI:    http://localhost:4000');
  console.log('   Functions:      http://localhost:5001');
  console.log('   Firestore:      http://localhost:8080');
  console.log('   Auth:           http://localhost:9099');
  console.log('   Storage:        http://localhost:9199');
  console.log('   Hosting:        http://localhost:5000');

  console.log('\n📖 Next Steps:');
  console.log('   1. Update firebase-config.js with your project settings');
  console.log('   2. Configure authentication providers in Firebase Console');
  console.log('   3. Set up Firestore database in Firebase Console');
  console.log('   4. Configure custom domain for hosting (optional)');
  console.log('   5. Set up CI/CD for automated deployments');

  console.log('\n🔗 Useful Links:');
  console.log('   Firebase Console: https://console.firebase.google.com/');
  console.log('   Firebase Docs:    https://firebase.google.com/docs/');
  console.log('   Flow PWA GitHub:  https://github.com/goub0000/Flow-pwa');
}

// Configuration helper
function generateFirebaseConfig() {
  const configTemplate = `
# Firebase Project Configuration
# Copy this to your firebase-config.js file with actual values

const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id" // Optional for Analytics
};

# Environment Variables for Functions
# Create functions/.env file:

NODE_ENV=development
CORS_ORIGIN=http://localhost:5000
API_BASE_URL=http://localhost:5001

# For production:
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
API_BASE_URL=https://us-central1-your-project-id.cloudfunctions.net
`;

  fs.writeFileSync('./firebase-config-template.txt', configTemplate);
  console.log('📝 Created firebase-config-template.txt with configuration template');
}

// Main setup function
async function setupFirebase() {
  try {
    console.log('Starting Firebase setup for Flow PWA...\n');

    // Check prerequisites
    const hasFirebaseCLI = await checkFirebaseCLI();
    if (!hasFirebaseCLI) {
      console.log('\n❌ Setup aborted: Firebase CLI required');
      process.exit(1);
    }

    const hasFirebaseAuth = await checkFirebaseAuth();
    if (!hasFirebaseAuth) {
      console.log('\n❌ Setup aborted: Firebase authentication required');
      process.exit(1);
    }

    // Setup steps
    await initializeFirebaseProject();
    createFunctionsStructure();
    await installFunctionsDependencies();
    await buildFunctions();
    generateFirebaseConfig();

    console.log('\n✅ Firebase setup completed successfully!');
    displayInformation();

    // Ask if user wants to start emulators
    console.log('\n🤔 Start Firebase emulators now? (y/n)');
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase();
      if (input === 'y' || input === 'yes') {
        startEmulators();
      } else {
        console.log('👋 Setup complete. Run "firebase emulators:start" when ready to test.');
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupFirebase();
}

module.exports = {
  setupFirebase,
  checkFirebaseCLI,
  checkFirebaseAuth,
  installFunctionsDependencies,
  buildFunctions
};