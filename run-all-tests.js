/**
 * Flow PWA - Master Test Runner
 *
 * This script orchestrates all testing for the complete Flow PWA project:
 * - Component tests for all user types
 * - Integration tests for complete workflows
 * - Performance and security validation
 * - Report generation and analysis
 *
 * Usage: node run-all-tests.js [--quick] [--report-only] [--verbose]
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  quick: process.argv.includes('--quick'),
  reportOnly: process.argv.includes('--report-only'),
  verbose: process.argv.includes('--verbose'),
  timeout: 300000, // 5 minutes per test suite
  api: {
    base: 'http://localhost:3001',
    healthEndpoint: '/health'
  },
  frontend: {
    base: 'http://localhost:5000'
  }
};

/**
 * Master Test Orchestrator
 */
class MasterTestRunner {
  constructor() {
    this.results = {
      component: null,
      integration: null,
      institution: null
    };
    this.startTime = Date.now();
    this.summary = {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      suiteResults: {}
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      debug: '🔍',
      master: '🎯'
    }[level] || '📋';

    console.log(`${timestamp} ${prefix} ${message}`);
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...', 'master');

    // Check Node.js version
    const nodeVersion = process.version;
    if (parseInt(nodeVersion.substring(1)) < 18) {
      throw new Error(`Node.js v18+ required, found ${nodeVersion}`);
    }
    this.log(`Node.js ${nodeVersion} ✓`, 'success');

    // Check if test files exist
    const testFiles = [
      'test-complete-project.js',
      'test-integration.js',
      'test-onboarding.js'
    ];

    for (const file of testFiles) {
      if (!fs.existsSync(path.join(__dirname, file))) {
        throw new Error(`Test file missing: ${file}`);
      }
    }
    this.log('All test files present ✓', 'success');

    // Check server availability
    try {
      const healthResult = await this.makeRequest(`${config.api.base}${config.api.healthEndpoint}`);
      if (healthResult.success) {
        this.log('Backend server responsive ✓', 'success');
      } else {
        this.log('Backend server not responding (some tests may fail)', 'warning');
      }
    } catch (error) {
      this.log('Backend server check failed (continuing anyway)', 'warning');
    }
  }

  async makeRequest(url) {
    try {
      const response = await fetch(url);
      const data = await response.json().catch(() => ({}));
      return { success: response.ok, status: response.status, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async runTestSuite(scriptName, description, args = []) {
    return new Promise((resolve, reject) => {
      this.log(`Starting ${description}...`, 'master');

      const startTime = Date.now();
      const testProcess = spawn('node', [scriptName, ...args], {
        stdio: config.verbose ? 'inherit' : 'pipe'
      });

      let output = '';
      if (!config.verbose) {
        testProcess.stdout?.on('data', (data) => {
          output += data.toString();
        });
        testProcess.stderr?.on('data', (data) => {
          output += data.toString();
        });
      }

      const timeout = setTimeout(() => {
        testProcess.kill();
        reject(new Error(`${description} timed out after ${config.timeout}ms`));
      }, config.timeout);

      testProcess.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        const success = code === 0;

        this.log(`${description} ${success ? 'completed' : 'failed'} (${duration}ms)`, success ? 'success' : 'error');

        // Parse results from output if available
        let parsedResults = null;
        try {
          const reportFiles = {
            'test-complete-project.js': 'test-report.json',
            'test-integration.js': 'integration-test-report.json',
            'test-onboarding.js': 'onboarding-test-report.json'
          };

          const reportFile = reportFiles[scriptName];
          if (reportFile && fs.existsSync(reportFile)) {
            parsedResults = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
          }
        } catch (error) {
          // Results parsing failed, continue without detailed results
        }

        resolve({
          success,
          code,
          duration,
          output: config.verbose ? 'See console output' : output,
          results: parsedResults
        });
      });

      testProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async runAllTests() {
    this.log('Flow PWA - Master Test Execution', 'master');
    this.log('=====================================', 'info');

    try {
      // Check prerequisites
      await this.checkPrerequisites();

      if (config.reportOnly) {
        this.log('Report-only mode: Generating reports from existing data...', 'master');
        this.generateMasterReport();
        return;
      }

      // Run test suites
      const testSuites = [];

      if (!config.quick) {
        // Full test suite
        testSuites.push(
          { script: 'test-complete-project.js', name: 'Component Tests', description: 'Complete project component testing' },
          { script: 'test-integration.js', name: 'Integration Tests', description: 'End-to-end integration testing' },
          { script: 'test-onboarding.js', name: 'Institution Onboarding', description: 'Institution onboarding specific testing' }
        );
      } else {
        // Quick test suite
        testSuites.push(
          { script: 'test-complete-project.js', name: 'Component Tests', description: 'Complete project component testing', args: ['--quick'] },
          { script: 'test-integration.js', name: 'Integration Tests', description: 'End-to-end integration testing', args: ['--quick'] }
        );
      }

      // Execute test suites
      for (const suite of testSuites) {
        try {
          const result = await this.runTestSuite(suite.script, suite.description, suite.args || []);
          this.results[suite.name.toLowerCase().replace(/\s+/g, '_')] = result;
          this.summary.suiteResults[suite.name] = result;

          // Update summary statistics
          if (result.results) {
            this.summary.totalTests += result.results.stats?.total || 0;
            this.summary.totalPassed += result.results.stats?.passed || 0;
            this.summary.totalFailed += result.results.stats?.failed || 0;
          }
        } catch (error) {
          this.log(`${suite.description} failed: ${error.message}`, 'error');
          this.summary.suiteResults[suite.name] = {
            success: false,
            error: error.message
          };
        }
      }

      // Generate master report
      this.generateMasterReport();

    } catch (error) {
      this.log(`Master test execution failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  generateMasterReport() {
    const duration = Date.now() - this.startTime;

    this.log('\n' + '='.repeat(80), 'info');
    this.log('FLOW PWA - MASTER TEST REPORT', 'master');
    this.log('='.repeat(80), 'info');

    // Executive Summary
    this.log('\n📊 EXECUTIVE SUMMARY', 'master');
    this.log(`Total Test Execution Time: ${(duration / 1000).toFixed(1)}s`, 'info');
    this.log(`Total Tests Run: ${this.summary.totalTests}`, 'info');
    this.log(`Total Passed: ${this.summary.totalPassed}`, 'success');
    this.log(`Total Failed: ${this.summary.totalFailed}`, this.summary.totalFailed > 0 ? 'error' : 'info');

    if (this.summary.totalTests > 0) {
      const successRate = ((this.summary.totalPassed / this.summary.totalTests) * 100).toFixed(1);
      this.log(`Overall Success Rate: ${successRate}%`, successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'error');
    }

    // Test Suite Results
    this.log('\n🧪 TEST SUITE RESULTS', 'master');
    for (const [suiteName, result] of Object.entries(this.summary.suiteResults)) {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = result.duration ? `(${(result.duration / 1000).toFixed(1)}s)` : '';
      this.log(`${status} ${suiteName} ${duration}`, result.success ? 'success' : 'error');

      if (result.results?.stats) {
        const stats = result.results.stats;
        this.log(`   Tests: ${stats.passed}/${stats.total} passed (${((stats.passed / stats.total) * 100).toFixed(1)}%)`, 'info');
      }

      if (!result.success && result.error) {
        this.log(`   Error: ${result.error}`, 'error');
      }
    }

    // Component Health Analysis
    this.log('\n🏗️ COMPONENT HEALTH ANALYSIS', 'master');
    this.analyzeComponentHealth();

    // Performance Analysis
    this.log('\n⚡ PERFORMANCE ANALYSIS', 'master');
    this.analyzePerformance();

    // Security Analysis
    this.log('\n🔒 SECURITY ANALYSIS', 'master');
    this.analyzeSecurity();

    // Recommendations
    this.log('\n💡 RECOMMENDATIONS', 'master');
    this.generateRecommendations();

    // Next Steps
    this.log('\n🚀 NEXT STEPS', 'master');
    this.generateNextSteps();

    // Save master report
    const masterReport = {
      timestamp: new Date().toISOString(),
      duration,
      summary: this.summary,
      results: this.results,
      config: {
        quick: config.quick,
        verbose: config.verbose
      }
    };

    const reportPath = path.join(__dirname, 'master-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(masterReport, null, 2));
    this.log(`\n📄 Master report saved to: ${reportPath}`, 'info');

    // Exit with appropriate code
    const hasFailures = this.summary.totalFailed > 0 || Object.values(this.summary.suiteResults).some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
  }

  analyzeComponentHealth() {
    const componentResults = this.results.component_tests?.results;
    if (!componentResults) {
      this.log('Component test results not available', 'warning');
      return;
    }

    // Analyze by user type
    const userTypes = ['Students', 'Institutions', 'Counselors', 'Parents', 'Recommenders'];
    userTypes.forEach(userType => {
      const userResults = componentResults.results?.filter(r => r.name.includes(userType)) || [];
      if (userResults.length > 0) {
        const passed = userResults.filter(r => r.success).length;
        const total = userResults.length;
        const health = total > 0 ? ((passed / total) * 100).toFixed(1) : 'N/A';
        this.log(`${userType}: ${passed}/${total} (${health}%)`, passed === total ? 'success' : 'warning');
      }
    });
  }

  analyzePerformance() {
    // Check for performance-related test results
    const allResults = Object.values(this.results).flatMap(r => r?.results?.results || []);
    const performanceResults = allResults.filter(r => r.name.includes('Performance'));

    if (performanceResults.length > 0) {
      const passed = performanceResults.filter(r => r.success).length;
      this.log(`Performance Tests: ${passed}/${performanceResults.length} passed`, passed === performanceResults.length ? 'success' : 'warning');
    } else {
      this.log('Performance test results not available', 'warning');
    }

    // General performance recommendations
    this.log('API Response Time: Target < 1000ms', 'info');
    this.log('Frontend Load Time: Target < 3s', 'info');
    this.log('Database Queries: Monitor for optimization', 'info');
  }

  analyzeSecurity() {
    // Check for security-related test results
    const allResults = Object.values(this.results).flatMap(r => r?.results?.results || []);
    const securityResults = allResults.filter(r => r.name.includes('Security'));

    if (securityResults.length > 0) {
      const passed = securityResults.filter(r => r.success).length;
      this.log(`Security Tests: ${passed}/${securityResults.length} passed`, passed === securityResults.length ? 'success' : 'error');
    } else {
      this.log('Security test results not available', 'warning');
    }

    // Security checklist
    this.log('Rate Limiting: Should be active', 'info');
    this.log('Input Validation: All inputs should be sanitized', 'info');
    this.log('Authentication: Tokens should be secure', 'info');
    this.log('CORS Policy: Should be properly configured', 'info');
  }

  generateRecommendations() {
    const successRate = this.summary.totalTests > 0 ? (this.summary.totalPassed / this.summary.totalTests) * 100 : 0;

    if (successRate >= 95) {
      this.log('🎉 Excellent! System is ready for production deployment', 'success');
      this.log('Consider setting up continuous integration for ongoing quality assurance', 'info');
    } else if (successRate >= 80) {
      this.log('⚠️  Good progress, but some issues need attention before production', 'warning');
      this.log('Review failed tests and address critical issues', 'warning');
    } else if (successRate >= 60) {
      this.log('🔧 Significant issues detected. Focus on core functionality first', 'warning');
      this.log('Prioritize fixing authentication, database, and core user flows', 'warning');
    } else {
      this.log('🚨 Critical issues detected. System not ready for production', 'error');
      this.log('Review infrastructure setup and basic functionality', 'error');
    }

    // Specific recommendations based on failed test suites
    const failedSuites = Object.entries(this.summary.suiteResults).filter(([_, result]) => !result.success);

    if (failedSuites.length > 0) {
      this.log('\nSpecific Issues to Address:', 'warning');
      failedSuites.forEach(([suiteName, result]) => {
        switch (suiteName) {
          case 'Component Tests':
            this.log('• Review API endpoints and server connectivity', 'warning');
            break;
          case 'Integration Tests':
            this.log('• Check end-to-end workflows and user journeys', 'warning');
            break;
          case 'Institution Onboarding':
            this.log('• Verify institution onboarding process and data flow', 'warning');
            break;
        }
      });
    }
  }

  generateNextSteps() {
    const successRate = this.summary.totalTests > 0 ? (this.summary.totalPassed / this.summary.totalTests) * 100 : 0;

    if (successRate >= 95) {
      this.log('1. Set up production environment and deploy', 'info');
      this.log('2. Configure monitoring and alerting', 'info');
      this.log('3. Set up automated testing in CI/CD pipeline', 'info');
      this.log('4. Plan user acceptance testing', 'info');
    } else {
      this.log('1. Fix failed tests (see detailed reports above)', 'warning');
      this.log('2. Re-run tests to verify fixes', 'warning');
      this.log('3. Focus on critical user journeys first', 'warning');
      this.log('4. Set up monitoring for early issue detection', 'warning');
    }

    this.log('\nUseful Commands:', 'info');
    this.log('• Run specific module: node test-complete-project.js --module=students', 'info');
    this.log('• Run specific scenario: node test-integration.js --scenario=student', 'info');
    this.log('• Start development: node start-dev.js', 'info');
    this.log('• View detailed reports: cat test-report.json | jq', 'info');
  }
}

/**
 * Main execution
 */
async function runMasterTests() {
  const runner = new MasterTestRunner();
  await runner.runAllTests();
}

// Run master tests if this script is executed directly
if (require.main === module) {
  runMasterTests().catch(error => {
    console.error('❌ Master test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  MasterTestRunner,
  runMasterTests,
  config
};