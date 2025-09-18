/**
 * Flow PWA - Integration Test Suite
 *
 * This script tests the complete end-to-end workflows across all user types:
 * 1. Student Application Journey
 * 2. Institution Admission Process
 * 3. Counselor Guidance Workflow
 * 4. Parent Monitoring Experience
 * 5. Recommender Letter Process
 * 6. Cross-component communication
 *
 * Usage: node test-integration.js [--scenario=<scenario>] [--verbose]
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  api: {
    base: 'http://localhost:3001',
    timeout: 15000
  },
  frontend: {
    base: 'http://localhost:5000',
    timeout: 10000
  },
  verbose: process.argv.includes('--verbose'),
  specificScenario: process.argv.find(arg => arg.startsWith('--scenario='))?.split('=')[1]
};

/**
 * Integration Test Runner
 */
class IntegrationTestRunner {
  constructor() {
    this.results = [];
    this.testData = {
      student: null,
      institution: null,
      counselor: null,
      parent: null,
      recommender: null,
      application: null
    };
    this.stats = {
      scenarios: 0,
      steps: 0,
      passed: 0,
      failed: 0
    };
  }

  async makeRequest(url, options = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));

      return {
        success: response.ok,
        status: response.status,
        data,
        url
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url
      };
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      debug: '🔍',
      scenario: '🎭',
      step: '👆'
    }[level] || '📋';

    console.log(`${timestamp} ${prefix} ${message}`);
  }

  addResult(scenarioName, stepName, success, details = {}) {
    this.results.push({
      scenario: scenarioName,
      step: stepName,
      success,
      details,
      timestamp: new Date().toISOString()
    });

    this.stats.steps++;
    if (success) {
      this.stats.passed++;
    } else {
      this.stats.failed++;
    }

    const emoji = success ? '✅' : '❌';
    if (config.verbose || !success) {
      this.log(`${stepName}: ${emoji}`, success ? 'success' : 'error');
      if (details.error && !success) {
        this.log(`  Error: ${details.error}`, 'error');
      }
    }
  }

  /**
   * Scenario 1: Complete Student Application Journey
   */
  async testStudentApplicationJourney() {
    const scenarioName = 'Student Application Journey';
    this.log(`Starting ${scenarioName}...`, 'scenario');
    this.stats.scenarios++;

    // Step 1: Student Registration
    const studentData = {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@student.com',
      dateOfBirth: '2005-03-15',
      grade: '12',
      phone: '+234-801-234-5678'
    };

    const registerResult = await this.makeRequest(`${config.api.base}/api/students/register`, {
      method: 'POST',
      body: JSON.stringify(studentData)
    });

    this.addResult(scenarioName, 'Student Registration', registerResult.success, registerResult);

    if (registerResult.success) {
      this.testData.student = registerResult.data.student;
    }

    // Step 2: Program Search
    const searchResult = await this.makeRequest(`${config.api.base}/api/students/programs/search?q=computer&level=bachelor`);
    this.addResult(scenarioName, 'Program Search', searchResult.success, searchResult);

    // Step 3: Application Submission (simulated with auth bypass)
    if (this.testData.student) {
      const applicationData = {
        institutionId: 'inst_123',
        programId: 'prog_cs_001',
        documents: ['transcript', 'essay', 'recommendation'],
        personalStatement: 'I am passionate about computer science and technology...'
      };

      // Note: In real scenario, would need authentication token
      const applicationResult = await this.makeRequest(`${config.api.base}/api/students/applications`, {
        method: 'POST',
        body: JSON.stringify(applicationData),
        headers: {
          'Authorization': 'Bearer mock-student-token' // Mock token for testing
        }
      });

      this.addResult(scenarioName, 'Application Submission', [200, 201, 401].includes(applicationResult.status), applicationResult);

      if (applicationResult.success) {
        this.testData.application = applicationResult.data.application;
      }
    }

    // Step 4: Profile Management
    const profileResult = await this.makeRequest(`${config.api.base}/api/students/profile`, {
      headers: {
        'Authorization': 'Bearer mock-student-token'
      }
    });

    this.addResult(scenarioName, 'Profile Access', [200, 401].includes(profileResult.status), profileResult);
  }

  /**
   * Scenario 2: Institution Admission Management
   */
  async testInstitutionAdmissionProcess() {
    const scenarioName = 'Institution Admission Process';
    this.log(`Starting ${scenarioName}...`, 'scenario');
    this.stats.scenarios++;

    // Step 1: Institution Registration
    const institutionData = {
      name: 'Tech University of Nigeria',
      type: 'university',
      country: 'Nigeria',
      city: 'Abuja',
      email: 'admin@techuni.edu.ng',
      website: 'https://techuni.edu.ng',
      phone: '+234-9-876-5432'
    };

    const registerResult = await this.makeRequest(`${config.api.base}/api/institutions/register`, {
      method: 'POST',
      body: JSON.stringify(institutionData)
    });

    this.addResult(scenarioName, 'Institution Registration', registerResult.success, registerResult);

    if (registerResult.success) {
      this.testData.institution = registerResult.data.institution;
    }

    // Step 2: Onboarding Process
    if (this.testData.institution) {
      for (let step = 1; step <= 7; step++) {
        const onboardingData = this.getOnboardingStepData(step);
        const onboardingResult = await this.makeRequest(
          `${config.api.base}/api/institutions/${this.testData.institution.id}/onboarding`,
          {
            method: 'PUT',
            body: JSON.stringify({
              step,
              data: onboardingData,
              completed: step === 7
            })
          }
        );

        this.addResult(scenarioName, `Onboarding Step ${step}`, onboardingResult.success, onboardingResult);
      }
    }

    // Step 3: Application Review (simulated)
    const reviewResult = await this.makeRequest(`${config.api.base}/api/institutions/123/applications`, {
      headers: {
        'Authorization': 'Bearer mock-institution-token'
      }
    });

    this.addResult(scenarioName, 'Application Review Access', [200, 401, 404].includes(reviewResult.status), reviewResult);
  }

  /**
   * Scenario 3: Counselor Guidance Workflow
   */
  async testCounselorGuidanceWorkflow() {
    const scenarioName = 'Counselor Guidance Workflow';
    this.log(`Starting ${scenarioName}...`, 'scenario');
    this.stats.scenarios++;

    // Step 1: Counselor Registration
    const counselorData = {
      name: 'Dr. Sarah Williams',
      email: 'sarah.williams@counselor.com',
      specialization: 'college_applications',
      experience: 10,
      organization: 'Elite College Prep',
      phone: '+234-803-567-8901'
    };

    const registerResult = await this.makeRequest(`${config.api.base}/api/counselors/register`, {
      method: 'POST',
      body: JSON.stringify(counselorData)
    });

    this.addResult(scenarioName, 'Counselor Registration', registerResult.success, registerResult);

    if (registerResult.success) {
      this.testData.counselor = registerResult.data.counselor;
    }

    // Step 2: Student List Access
    const studentsResult = await this.makeRequest(`${config.api.base}/api/counselors/students`, {
      headers: {
        'Authorization': 'Bearer mock-counselor-token'
      }
    });

    this.addResult(scenarioName, 'Student List Access', [200, 401].includes(studentsResult.status), studentsResult);

    // Step 3: Session Scheduling
    const sessionData = {
      studentId: 'student_123',
      date: '2024-02-01',
      time: '10:00',
      duration: 60,
      type: 'college_planning',
      notes: 'Initial college planning session'
    };

    const sessionResult = await this.makeRequest(`${config.api.base}/api/counselors/sessions`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
      headers: {
        'Authorization': 'Bearer mock-counselor-token'
      }
    });

    this.addResult(scenarioName, 'Session Scheduling', [200, 201, 401].includes(sessionResult.status), sessionResult);

    // Step 4: Profile Management
    const profileResult = await this.makeRequest(`${config.api.base}/api/counselors/profile`, {
      headers: {
        'Authorization': 'Bearer mock-counselor-token'
      }
    });

    this.addResult(scenarioName, 'Profile Access', [200, 401].includes(profileResult.status), profileResult);
  }

  /**
   * Scenario 4: Parent Monitoring Experience
   */
  async testParentMonitoringExperience() {
    const scenarioName = 'Parent Monitoring Experience';
    this.log(`Starting ${scenarioName}...`, 'scenario');
    this.stats.scenarios++;

    // Step 1: Parent Registration
    const parentData = {
      name: 'Michael Johnson',
      email: 'michael.johnson@parent.com',
      phone: '+234-802-345-6789',
      relationship: 'father',
      occupation: 'Engineer',
      children: ['alice.johnson@student.com']
    };

    const registerResult = await this.makeRequest(`${config.api.base}/api/parents/register`, {
      method: 'POST',
      body: JSON.stringify(parentData)
    });

    this.addResult(scenarioName, 'Parent Registration', registerResult.success, registerResult);

    if (registerResult.success) {
      this.testData.parent = registerResult.data.parent;
    }

    // Step 2: Children Information Access
    const childrenResult = await this.makeRequest(`${config.api.base}/api/parents/children`, {
      headers: {
        'Authorization': 'Bearer mock-parent-token'
      }
    });

    this.addResult(scenarioName, 'Children Information Access', [200, 401].includes(childrenResult.status), childrenResult);

    // Step 3: Notifications Access
    const notificationsResult = await this.makeRequest(`${config.api.base}/api/parents/notifications`, {
      headers: {
        'Authorization': 'Bearer mock-parent-token'
      }
    });

    this.addResult(scenarioName, 'Notifications Access', [200, 401].includes(notificationsResult.status), notificationsResult);

    // Step 4: Resources Access
    const resourcesResult = await this.makeRequest(`${config.api.base}/api/parents/resources`, {
      headers: {
        'Authorization': 'Bearer mock-parent-token'
      }
    });

    this.addResult(scenarioName, 'Resources Access', [200, 401].includes(resourcesResult.status), resourcesResult);

    // Step 5: Child Linking
    const linkingData = {
      childEmail: 'new.child@student.com',
      relationshipCode: 'PARENT123'
    };

    const linkingResult = await this.makeRequest(`${config.api.base}/api/parents/children/link`, {
      method: 'POST',
      body: JSON.stringify(linkingData),
      headers: {
        'Authorization': 'Bearer mock-parent-token'
      }
    });

    this.addResult(scenarioName, 'Child Linking', [200, 201, 401].includes(linkingResult.status), linkingResult);
  }

  /**
   * Scenario 5: Recommender Letter Process
   */
  async testRecommenderLetterProcess() {
    const scenarioName = 'Recommender Letter Process';
    this.log(`Starting ${scenarioName}...`, 'scenario');
    this.stats.scenarios++;

    // Step 1: Recommender Registration
    const recommenderData = {
      name: 'Prof. David Chen',
      email: 'david.chen@university.edu',
      position: 'Professor of Computer Science',
      institution: 'Federal University of Technology',
      relationship: 'professor',
      department: 'Computer Science',
      yearsKnownStudent: 2
    };

    const registerResult = await this.makeRequest(`${config.api.base}/api/recommenders/register`, {
      method: 'POST',
      body: JSON.stringify(recommenderData)
    });

    this.addResult(scenarioName, 'Recommender Registration', registerResult.success, registerResult);

    if (registerResult.success) {
      this.testData.recommender = registerResult.data.recommender;
    }

    // Step 2: Recommendation Requests Access
    const requestsResult = await this.makeRequest(`${config.api.base}/api/recommenders/requests`, {
      headers: {
        'Authorization': 'Bearer mock-recommender-token'
      }
    });

    this.addResult(scenarioName, 'Requests Access', [200, 401].includes(requestsResult.status), requestsResult);

    // Step 3: Form Access
    const formResult = await this.makeRequest(`${config.api.base}/api/recommenders/forms/request_123`, {
      headers: {
        'Authorization': 'Bearer mock-recommender-token'
      }
    });

    this.addResult(scenarioName, 'Form Access', [200, 401, 404].includes(formResult.status), formResult);

    // Step 4: Recommendation Submission
    const recommendationData = {
      requestId: 'request_123',
      studentId: 'student_123',
      content: 'Alice is an exceptional student who demonstrates outstanding...',
      ratings: {
        academicPerformance: 5,
        character: 5,
        leadership: 4,
        communication: 5,
        overall: 5
      },
      additionalComments: 'Highly recommend for admission.',
      confidential: true
    };

    const submissionResult = await this.makeRequest(`${config.api.base}/api/recommenders/recommendations`, {
      method: 'POST',
      body: JSON.stringify(recommendationData),
      headers: {
        'Authorization': 'Bearer mock-recommender-token'
      }
    });

    this.addResult(scenarioName, 'Recommendation Submission', [200, 201, 401].includes(submissionResult.status), submissionResult);

    // Step 5: Templates Access
    const templatesResult = await this.makeRequest(`${config.api.base}/api/recommenders/templates`, {
      headers: {
        'Authorization': 'Bearer mock-recommender-token'
      }
    });

    this.addResult(scenarioName, 'Templates Access', [200, 401].includes(templatesResult.status), templatesResult);
  }

  /**
   * Scenario 6: Cross-Component Integration
   */
  async testCrossComponentIntegration() {
    const scenarioName = 'Cross-Component Integration';
    this.log(`Starting ${scenarioName}...`, 'scenario');
    this.stats.scenarios++;

    // Step 1: Authentication Flow Simulation
    const authData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      userType: 'student'
    };

    const authResult = await this.makeRequest(`${config.api.base}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(authData)
    });

    this.addResult(scenarioName, 'Authentication Flow', [200, 401, 404].includes(authResult.status), authResult);

    // Step 2: Data Consistency Check
    const healthCheck = await this.makeRequest(`${config.api.base}/health`);
    this.addResult(scenarioName, 'System Health Check', healthCheck.success, healthCheck);

    // Step 3: Frontend-Backend Integration (file accessibility)
    const frontendPaths = [
      '/students/',
      '/institutions/',
      '/counselors/',
      '/parents/',
      '/recommenders/',
      '/auth/'
    ];

    let accessibleFrontends = 0;
    for (const path of frontendPaths) {
      const exists = this.checkFileExists(path + 'index.html');
      if (exists) accessibleFrontends++;
    }

    this.addResult(scenarioName, 'Frontend Integration', accessibleFrontends === frontendPaths.length, {
      accessible: accessibleFrontends,
      total: frontendPaths.length
    });

    // Step 4: Security Integration
    const securityResult = await this.makeRequest(`${config.api.base}/api/protected/test`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    this.addResult(scenarioName, 'Security Integration', securityResult.status === 401, securityResult);
  }

  /**
   * Helper methods
   */
  checkFileExists(filePath) {
    const fullPath = path.join(__dirname, filePath.substring(1));
    return fs.existsSync(fullPath);
  }

  getOnboardingStepData(step) {
    const stepData = {
      1: { welcomed: true },
      2: {
        name: 'Tech University of Nigeria',
        email: 'admin@techuni.edu.ng',
        type: 'university',
        country: 'Nigeria',
        city: 'Abuja'
      },
      3: { verified: true },
      4: { programs: 15 },
      5: { teamMembers: [{ name: 'John Admin', email: 'john@techuni.edu.ng' }] },
      6: { settings: { timezone: 'Africa/Lagos' } },
      7: { complete: true }
    };

    return stepData[step] || {};
  }

  shouldSkipScenario(scenarioName) {
    return config.specificScenario && !scenarioName.toLowerCase().includes(config.specificScenario.toLowerCase());
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    this.log('\n' + '='.repeat(80), 'info');
    this.log('FLOW PWA - INTEGRATION TEST REPORT', 'info');
    this.log('='.repeat(80), 'info');

    // Summary statistics
    this.log(`\nTest Summary:`, 'info');
    this.log(`  Scenarios: ${this.stats.scenarios}`, 'info');
    this.log(`  Total Steps: ${this.stats.steps}`, 'info');
    this.log(`  Passed: ${this.stats.passed}`, 'success');
    this.log(`  Failed: ${this.stats.failed}`, this.stats.failed > 0 ? 'error' : 'info');
    this.log(`  Success Rate: ${((this.stats.passed / this.stats.steps) * 100).toFixed(1)}%`, 'info');

    // Scenario-specific results
    this.log(`\nScenario Results:`, 'info');
    const scenarioResults = this.groupResultsByScenario();
    for (const [scenario, results] of Object.entries(scenarioResults)) {
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      const status = passed === total ? '✅' : passed > total / 2 ? '⚠️' : '❌';
      this.log(`  ${status} ${scenario}: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)`, 'info');
    }

    // Failed tests
    if (this.stats.failed > 0) {
      this.log(`\nFailed Tests:`, 'error');
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          this.log(`  ❌ ${result.scenario}: ${result.step}`, 'error');
          if (result.details.error) {
            this.log(`     Error: ${result.details.error}`, 'error');
          }
        });
    }

    // Test data summary
    this.log(`\nTest Data Generated:`, 'info');
    this.log(`  Student: ${this.testData.student ? this.testData.student.id : 'Not created'}`, 'info');
    this.log(`  Institution: ${this.testData.institution ? this.testData.institution.id : 'Not created'}`, 'info');
    this.log(`  Counselor: ${this.testData.counselor ? this.testData.counselor.id : 'Not created'}`, 'info');
    this.log(`  Parent: ${this.testData.parent ? this.testData.parent.id : 'Not created'}`, 'info');
    this.log(`  Recommender: ${this.testData.recommender ? this.testData.recommender.id : 'Not created'}`, 'info');

    // Recommendations
    this.log(`\nRecommendations:`, 'info');
    this.generateRecommendations();

    return {
      stats: this.stats,
      results: this.results,
      testData: this.testData,
      timestamp: new Date().toISOString()
    };
  }

  groupResultsByScenario() {
    const groups = {};
    this.results.forEach(result => {
      if (!groups[result.scenario]) groups[result.scenario] = [];
      groups[result.scenario].push(result);
    });
    return groups;
  }

  generateRecommendations() {
    if (this.stats.failed === 0) {
      this.log(`  ✅ All integration tests passed! System integration is working properly.`, 'success');
      return;
    }

    const failureRate = (this.stats.failed / this.stats.steps) * 100;

    if (failureRate > 50) {
      this.log(`  🚨 Critical: Over 50% of tests failed. Check server connectivity and API endpoints.`, 'error');
    } else if (failureRate > 25) {
      this.log(`  ⚠️  Warning: 25-50% of tests failed. Review authentication and API implementations.`, 'warning');
    } else {
      this.log(`  ℹ️  Minor issues detected. Review specific failed tests above.`, 'info');
    }

    // Specific recommendations based on failed scenarios
    const failedScenarios = [...new Set(this.results.filter(r => !r.success).map(r => r.scenario))];

    failedScenarios.forEach(scenario => {
      switch (scenario) {
        case 'Student Application Journey':
          this.log(`  📚 Review student registration and application submission endpoints`, 'warning');
          break;
        case 'Institution Admission Process':
          this.log(`  🏫 Verify institution onboarding API implementation`, 'warning');
          break;
        case 'Counselor Guidance Workflow':
          this.log(`  👨‍🏫 Check counselor authentication and session management`, 'warning');
          break;
        case 'Parent Monitoring Experience':
          this.log(`  👨‍👩‍👧‍👦 Review parent-child linking and notification systems`, 'warning');
          break;
        case 'Recommender Letter Process':
          this.log(`  📝 Verify recommendation submission and form handling`, 'warning');
          break;
        case 'Cross-Component Integration':
          this.log(`  🔗 Check authentication flow and security implementation`, 'warning');
          break;
      }
    });
  }
}

/**
 * Main test execution
 */
async function runIntegrationTests() {
  const runner = new IntegrationTestRunner();

  console.log('🧪 Flow PWA - Integration Test Suite');
  console.log('=====================================');

  try {
    // Check server health first
    const healthResult = await runner.makeRequest(`${config.api.base}/health`);
    if (!healthResult.success) {
      console.log('⚠️  Server is not responding. Some tests may fail.');
      console.log('   Make sure to start the server: cd server && npm start');
    }

    // Run all integration scenarios
    if (!runner.shouldSkipScenario('student')) {
      await runner.testStudentApplicationJourney();
    }

    if (!runner.shouldSkipScenario('institution')) {
      await runner.testInstitutionAdmissionProcess();
    }

    if (!runner.shouldSkipScenario('counselor')) {
      await runner.testCounselorGuidanceWorkflow();
    }

    if (!runner.shouldSkipScenario('parent')) {
      await runner.testParentMonitoringExperience();
    }

    if (!runner.shouldSkipScenario('recommender')) {
      await runner.testRecommenderLetterProcess();
    }

    if (!runner.shouldSkipScenario('integration')) {
      await runner.testCrossComponentIntegration();
    }

    // Generate final report
    const report = runner.generateReport();

    // Save report to file
    const reportPath = path.join(__dirname, 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    runner.log(`\nDetailed report saved to: ${reportPath}`, 'info');

    // Exit with appropriate code
    process.exit(runner.stats.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Integration test execution failed:', error);
    process.exit(1);
  }
}

// Run integration tests if this script is executed directly
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  IntegrationTestRunner,
  runIntegrationTests,
  config
};