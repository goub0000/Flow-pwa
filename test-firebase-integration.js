/**
 * Firebase Integration Test Suite
 * Tests the Firebase backend integration for Flow PWA
 */

const https = require('https');
const http = require('http');

// Test configuration
const config = {
  firebase: {
    projectId: 'flow-pwa-project',
    emulator: {
      host: 'localhost',
      ports: {
        functions: 5001,
        firestore: 8080,
        auth: 9099,
        storage: 9199
      }
    },
    functions: {
      baseUrl: 'http://localhost:5001/flow-pwa-project/us-central1/api'
    }
  }
};

class FirebaseIntegrationTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      firebase: '🔥'
    }[level] || '📋';

    console.log(`${timestamp} ${prefix} ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestModule = url.startsWith('https') ? https : http;

      const defaultOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      };

      const finalOptions = { ...defaultOptions, ...options };

      const req = requestModule.request(url, finalOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              data: jsonData,
              headers: res.headers
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  async runTest(name, testFunction) {
    this.results.total++;

    try {
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS', error: null });
      this.log(`${name}: PASS`, 'success');
      return true;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      this.log(`${name}: FAIL`, 'error');
      this.log(`   Error: ${error.message}`, 'error');
      return false;
    }
  }

  async testEmulatorHealth() {
    // Test Firebase Functions emulator
    try {
      const response = await this.makeRequest(`${config.firebase.functions.baseUrl}/health`);
      if (response.status !== 200) {
        throw new Error(`Functions emulator health check failed: ${response.status}`);
      }
      return true;
    } catch (error) {
      throw new Error(`Functions emulator not accessible: ${error.message}`);
    }
  }

  async testFirestoreEmulator() {
    try {
      const response = await this.makeRequest(`http://localhost:${config.firebase.emulator.ports.firestore}`);
      // Firestore emulator returns HTML, so we just check if it's accessible
      if (response.status !== 200) {
        throw new Error(`Firestore emulator not accessible: ${response.status}`);
      }
      return true;
    } catch (error) {
      throw new Error(`Firestore emulator not accessible: ${error.message}`);
    }
  }

  async testAuthEmulator() {
    try {
      const response = await this.makeRequest(`http://localhost:${config.firebase.emulator.ports.auth}/emulator/v1/projects/${config.firebase.projectId}/config`);
      if (response.status !== 200) {
        throw new Error(`Auth emulator not accessible: ${response.status}`);
      }
      return true;
    } catch (error) {
      throw new Error(`Auth emulator not accessible: ${error.message}`);
    }
  }

  async testStudentRegistration() {
    const studentData = {
      firstName: 'Test',
      lastName: 'Student',
      email: 'test.student@example.com',
      dateOfBirth: '2005-01-01',
      grade: '12'
    };

    const response = await this.makeRequest(`${config.firebase.functions.baseUrl}/api/students/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });

    if (response.status !== 201) {
      throw new Error(`Student registration failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    if (!response.data.success || !response.data.studentId) {
      throw new Error('Student registration response invalid');
    }

    return response.data.studentId;
  }

  async testInstitutionRegistration() {
    const institutionData = {
      name: 'Test University',
      type: 'university',
      country: 'Nigeria',
      city: 'Lagos',
      email: 'admin@testuni.edu'
    };

    const response = await this.makeRequest(`${config.firebase.functions.baseUrl}/api/institutions/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(institutionData)
    });

    if (response.status !== 201) {
      throw new Error(`Institution registration failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    if (!response.data.success || !response.data.institutionId) {
      throw new Error('Institution registration response invalid');
    }

    return response.data.institutionId;
  }

  async testProgramSearch() {
    const searchParams = new URLSearchParams({
      q: 'computer',
      level: 'bachelor',
      limit: '10'
    });

    const response = await this.makeRequest(`${config.firebase.functions.baseUrl}/api/students/programs/search?${searchParams}`);

    if (response.status !== 200) {
      throw new Error(`Program search failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    if (!response.data.programs || !Array.isArray(response.data.programs)) {
      throw new Error('Program search response invalid');
    }

    return response.data.programs;
  }

  async testAnalyticsEndpoint() {
    const response = await this.makeRequest(`${config.firebase.functions.baseUrl}/api/analytics/applications`);

    // This might fail due to auth requirements, but we test the endpoint exists
    if (response.status === 401) {
      // Expected for protected endpoint
      return true;
    }

    if (response.status !== 200) {
      throw new Error(`Analytics endpoint failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    return true;
  }

  async runAllTests() {
    this.log('Firebase Integration Test Suite', 'firebase');
    this.log('===============================', 'info');

    // Test Firebase emulators
    await this.runTest('Firebase Functions Emulator Health', () => this.testEmulatorHealth());
    await this.runTest('Firestore Emulator Connectivity', () => this.testFirestoreEmulator());
    await this.runTest('Auth Emulator Connectivity', () => this.testAuthEmulator());

    // Test API endpoints
    await this.runTest('Student Registration API', () => this.testStudentRegistration());
    await this.runTest('Institution Registration API', () => this.testInstitutionRegistration());
    await this.runTest('Program Search API', () => this.testProgramSearch());
    await this.runTest('Analytics Endpoint Accessibility', () => this.testAnalyticsEndpoint());

    // Generate report
    this.generateReport();
  }

  generateReport() {
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(1) : 0;

    this.log('', 'info');
    this.log('='.repeat(50), 'info');
    this.log('FIREBASE INTEGRATION TEST REPORT', 'firebase');
    this.log('='.repeat(50), 'info');
    this.log(`Total Tests: ${this.results.total}`, 'info');
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

    if (this.results.failed > 0) {
      this.log('', 'info');
      this.log('Failed Tests:', 'error');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          this.log(`  ❌ ${test.name}: ${test.error}`, 'error');
        });
    }

    this.log('', 'info');
    this.log('Firebase Services Status:', 'firebase');
    this.log('  🔥 Functions: http://localhost:5001', 'info');
    this.log('  📊 Firestore: http://localhost:8080', 'info');
    this.log('  🔐 Auth: http://localhost:9099', 'info');
    this.log('  📁 Storage: http://localhost:9199', 'info');
    this.log('  🌐 UI: http://localhost:4000', 'info');

    this.log('', 'info');
    this.log('Next Steps:', 'firebase');
    if (successRate >= 80) {
      this.log('  ✅ Firebase integration is working well!', 'success');
      this.log('  🚀 Ready for frontend integration testing', 'info');
      this.log('  📱 Test the Flow PWA with Firebase backend', 'info');
    } else {
      this.log('  ⚠️  Some Firebase services need attention', 'warning');
      this.log('  🔧 Check Firebase emulator status', 'warning');
      this.log('  📋 Review failed tests above', 'warning');
    }

    // Save results
    const fs = require('fs');
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      config: config.firebase,
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: parseFloat(successRate)
      }
    };

    fs.writeFileSync('./firebase-integration-test-report.json', JSON.stringify(reportData, null, 2));
    this.log('Report saved to: firebase-integration-test-report.json', 'info');

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new FirebaseIntegrationTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = FirebaseIntegrationTester;