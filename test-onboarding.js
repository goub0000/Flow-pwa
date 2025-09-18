/**
 * Test Script for Institution Onboarding Flow
 *
 * This script tests the complete institution onboarding process:
 * 1. Institution registration
 * 2. Step-by-step onboarding completion
 * 3. Data validation and persistence
 *
 * Usage: node test-onboarding.js
 */

const fs = require('fs');
const path = require('path');

// Test data for institution onboarding
const testInstitutionData = {
  name: "Test University of Technology",
  type: "university",
  country: "Kenya",
  city: "Nairobi",
  website: "https://testtech.edu.ke",
  email: "admin@testtech.edu.ke",
  phone: "+254712345678",
  accreditation: "Commission for University Education (CUE)",
  programs: [
    {
      name: "Computer Science",
      level: "bachelor",
      duration: 4,
      tuition: { amount: 150000, currency: "KES" }
    },
    {
      name: "Business Administration",
      level: "master",
      duration: 2,
      tuition: { amount: 200000, currency: "KES" }
    }
  ],
  teamMembers: [
    {
      name: "Dr. Jane Smith",
      email: "jane.smith@testtech.edu.ke",
      role: "admin",
      department: "Admissions"
    },
    {
      name: "John Doe",
      email: "john.doe@testtech.edu.ke",
      role: "coordinator",
      department: "Student Affairs"
    }
  ],
  settings: {
    applicationDeadline: "2024-12-31",
    timezone: "Africa/Nairobi",
    language: "en"
  }
};

// API endpoints
const API_BASE = 'http://localhost:3001';
const FRONTEND_BASE = 'http://localhost:5000';

/**
 * Make HTTP request
 */
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test server health
 */
async function testServerHealth() {
  console.log('🔍 Testing server health...');

  const result = await makeRequest(`${API_BASE}/health`);

  if (result.success) {
    console.log('✅ Server is healthy');
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Uptime: ${result.data.uptime}s`);
    return true;
  } else {
    console.log('❌ Server health check failed');
    console.log(`   Error: ${result.error || result.data?.error}`);
    return false;
  }
}

/**
 * Test institution registration
 */
async function testInstitutionRegistration() {
  console.log('\n📝 Testing institution registration...');

  const result = await makeRequest(`${API_BASE}/api/institutions/register`, {
    method: 'POST',
    body: JSON.stringify(testInstitutionData)
  });

  if (result.success) {
    console.log('✅ Institution registered successfully');
    console.log(`   ID: ${result.data.institution.id}`);
    console.log(`   Name: ${result.data.institution.name}`);
    console.log(`   Status: ${result.data.institution.status}`);
    return result.data.institution.id;
  } else {
    console.log('❌ Institution registration failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data?.error}`);
    if (result.data?.details) {
      console.log(`   Details:`, result.data.details);
    }
    return null;
  }
}

/**
 * Test onboarding step completion
 */
async function testOnboardingStep(institutionId, step, stepData) {
  console.log(`\n📋 Testing onboarding step ${step}...`);

  const result = await makeRequest(`${API_BASE}/api/institutions/${institutionId}/onboarding`, {
    method: 'PUT',
    body: JSON.stringify({
      step,
      data: stepData,
      completed: step === 7
    })
  });

  if (result.success) {
    console.log(`✅ Step ${step} completed successfully`);
    if (result.data.onboardingComplete) {
      console.log('🎉 Onboarding completed!');
    }
    return true;
  } else {
    console.log(`❌ Step ${step} failed`);
    console.log(`   Error: ${result.data?.error}`);
    return false;
  }
}

/**
 * Test frontend file accessibility
 */
async function testFrontendFiles() {
  console.log('\n🌐 Testing frontend file accessibility...');

  const filesToTest = [
    '/institutions/onboarding.html',
    '/institutions/index.html',
    '/assets/css/base.css',
    '/assets/js/auth.js'
  ];

  for (const file of filesToTest) {
    const filePath = path.join(__dirname, file.substring(1));
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  }
}

/**
 * Generate test report
 */
function generateTestReport(results) {
  console.log('\n📊 TEST REPORT');
  console.log('================');

  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n🔧 Setup Instructions:');
  console.log('1. Start MongoDB: mongod --dbpath /data/db');
  console.log('2. Start Auth Server: cd server && npm start');
  console.log('3. Start Frontend: firebase serve --only hosting --port 5000');
  console.log('4. Navigate to: http://localhost:5000/institutions/onboarding.html');
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 Starting Institution Onboarding Tests');
  console.log('=========================================');

  const results = [];

  // Test 1: Server Health
  const healthResult = await testServerHealth();
  results.push({ name: 'Server Health', success: healthResult });

  if (!healthResult) {
    console.log('\n⚠️  Server is not running. Please start the auth server first:');
    console.log('   cd server && npm start');
    return;
  }

  // Test 2: Frontend Files
  await testFrontendFiles();

  // Test 3: Institution Registration
  const institutionId = await testInstitutionRegistration();
  results.push({ name: 'Institution Registration', success: !!institutionId });

  if (institutionId) {
    // Test 4-10: Onboarding Steps
    const steps = [
      { step: 1, data: { welcomed: true } },
      { step: 2, data: testInstitutionData },
      { step: 3, data: { verified: true } },
      { step: 4, data: { programs: testInstitutionData.programs } },
      { step: 5, data: { team: testInstitutionData.teamMembers } },
      { step: 6, data: testInstitutionData.settings },
      { step: 7, data: { complete: true } }
    ];

    for (const stepData of steps) {
      const stepResult = await testOnboardingStep(institutionId, stepData.step, stepData.data);
      results.push({ name: `Onboarding Step ${stepData.step}`, success: stepResult });
    }
  }

  // Generate final report
  generateTestReport(results);
}

// Check if we're running this script directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testInstitutionData,
  makeRequest
};