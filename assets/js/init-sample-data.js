// Sample Data Initializer for Flow PWA
// Run this in browser console when logged in as institution to create sample data

(async function() {
  'use strict';

  console.log('🔧 Flow Sample Data Initializer');
  console.log('================================');

  // Wait for dependencies
  async function waitForDependencies() {
    while (!window.Firebase || !window.Firebase.initialized || !window.DataService || !window.FlowAuth) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  await waitForDependencies();

  const user = window.FlowAuth.getCurrentUser();
  const profile = window.FlowAuth.getUserProfile();

  if (!user || !profile) {
    console.error('❌ You must be logged in to initialize data');
    return;
  }

  console.log(`✅ Logged in as: ${user.email}`);
  console.log(`✅ Account type: ${profile.accountType}`);

  // Sample programs for different institution types
  const samplePrograms = {
    institution: [
      {
        name: 'Computer Science - Bachelor of Science',
        degree: 'bachelor',
        department: 'Computer Science',
        description: 'A comprehensive program covering software engineering, algorithms, data structures, artificial intelligence, and modern computing practices. Prepare for careers in tech industry with hands-on projects and industry partnerships.',
        duration: 4,
        tuitionPerYear: 25000,
        isActive: true,
        requirements: {
          minGPA: 3.0,
          minSAT: 1200,
          minACT: 24,
          requiredDocuments: ['transcript', 'personal statement', 'recommendation letters'],
          essayPrompts: [
            'Why are you interested in Computer Science?',
            'Describe a technical project you completed and what you learned.'
          ]
        },
        stats: {
          totalSpots: 120,
          availableSpots: 85,
          applicantsCount: 0,
          acceptedCount: 0,
          enrolledCount: 0
        },
        deadlines: {
          earlyDecision: new Date('2026-11-15'),
          regularDecision: new Date('2026-03-01'),
          finalDecision: new Date('2026-05-01')
        }
      },
      {
        name: 'Business Administration - MBA',
        degree: 'master',
        department: 'Business',
        description: 'Develop strategic thinking, leadership skills, and business acumen through our intensive MBA program. Focus areas include finance, marketing, operations, and entrepreneurship.',
        duration: 2,
        tuitionPerYear: 45000,
        isActive: true,
        requirements: {
          minGPA: 3.2,
          minGMAT: 550,
          requiredDocuments: ['transcript', 'resume', 'essays', 'recommendation letters'],
          essayPrompts: [
            'What are your short and long-term career goals?',
            'Describe a leadership experience and its impact.'
          ]
        },
        stats: {
          totalSpots: 60,
          availableSpots: 42,
          applicantsCount: 0,
          acceptedCount: 0,
          enrolledCount: 0
        },
        deadlines: {
          earlyDecision: new Date('2026-01-15'),
          regularDecision: new Date('2026-04-01'),
          finalDecision: new Date('2026-06-01')
        }
      },
      {
        name: 'Mechanical Engineering - Bachelor of Engineering',
        degree: 'bachelor',
        department: 'Engineering',
        description: 'Study the principles of mechanics, thermodynamics, materials science, and structural analysis. Gain practical experience through labs, co-op programs, and capstone projects.',
        duration: 4,
        tuitionPerYear: 28000,
        isActive: true,
        requirements: {
          minGPA: 3.2,
          minSAT: 1250,
          minACT: 26,
          requiredDocuments: ['transcript', 'personal statement', 'recommendation letters'],
          essayPrompts: [
            'What sparked your interest in Mechanical Engineering?',
            'Describe a problem you solved using engineering principles.'
          ]
        },
        stats: {
          totalSpots: 100,
          availableSpots: 73,
          applicantsCount: 0,
          acceptedCount: 0,
          enrolledCount: 0
        },
        deadlines: {
          earlyDecision: new Date('2026-11-30'),
          regularDecision: new Date('2026-02-15'),
          finalDecision: new Date('2026-05-01')
        }
      },
      {
        name: 'Nursing - Bachelor of Science in Nursing (BSN)',
        degree: 'bachelor',
        department: 'Nursing and Health Sciences',
        description: 'Comprehensive nursing program combining theoretical knowledge with clinical practice. Prepare for NCLEX-RN and a rewarding career in healthcare with simulation labs and hospital rotations.',
        duration: 4,
        tuitionPerYear: 30000,
        isActive: true,
        requirements: {
          minGPA: 3.0,
          minSAT: 1150,
          minACT: 23,
          requiredDocuments: ['transcript', 'personal statement', 'health records', 'recommendation letters'],
          essayPrompts: [
            'Why do you want to become a nurse?',
            'Describe a time you demonstrated compassion and care.'
          ]
        },
        stats: {
          totalSpots: 80,
          availableSpots: 55,
          applicantsCount: 0,
          acceptedCount: 0,
          enrolledCount: 0
        },
        deadlines: {
          earlyDecision: new Date('2026-12-01'),
          regularDecision: new Date('2026-03-15'),
          finalDecision: new Date('2026-05-15')
        }
      },
      {
        name: 'Data Science - Master of Science',
        degree: 'master',
        department: 'Data Science and Analytics',
        description: 'Advanced program covering machine learning, statistical analysis, big data technologies, and data visualization. Work on real-world projects with industry partners.',
        duration: 2,
        tuitionPerYear: 38000,
        isActive: true,
        requirements: {
          minGPA: 3.3,
          minGRE: 310,
          requiredDocuments: ['transcript', 'statement of purpose', 'resume', 'recommendation letters', 'portfolio'],
          essayPrompts: [
            'Describe your research interests in data science.',
            'How will this program help achieve your career goals?'
          ]
        },
        stats: {
          totalSpots: 50,
          availableSpots: 35,
          applicantsCount: 0,
          acceptedCount: 0,
          enrolledCount: 0
        },
        deadlines: {
          earlyDecision: new Date('2026-01-15'),
          regularDecision: new Date('2026-04-01'),
          finalDecision: new Date('2026-06-01')
        }
      },
      {
        name: 'Psychology - Bachelor of Arts',
        degree: 'bachelor',
        department: 'Psychology',
        description: 'Explore human behavior, cognition, and mental processes. Gain research experience and prepare for careers in counseling, human resources, or graduate studies.',
        duration: 4,
        tuitionPerYear: 22000,
        isActive: true,
        requirements: {
          minGPA: 2.8,
          minSAT: 1100,
          minACT: 22,
          requiredDocuments: ['transcript', 'personal statement', 'recommendation letters'],
          essayPrompts: [
            'What aspects of psychology interest you most?',
            'Describe an experience that shaped your understanding of human behavior.'
          ]
        },
        stats: {
          totalSpots: 150,
          availableSpots: 110,
          applicantsCount: 0,
          acceptedCount: 0,
          enrolledCount: 0
        },
        deadlines: {
          regularDecision: new Date('2026-03-01'),
          finalDecision: new Date('2026-05-01')
        }
      }
    ]
  };

  // Initialize programs for institution
  window.FlowInitializer = {
    async initializePrograms() {
      if (profile.accountType !== 'institution') {
        console.error('❌ Only institutions can create programs');
        console.log('ℹ️ Please log in with an institution account');
        return { success: false, message: 'Only institutions can create programs' };
      }

      console.log('\n🎓 Creating sample programs...');
      const programs = samplePrograms.institution;
      const results = [];

      for (let i = 0; i < programs.length; i++) {
        const program = programs[i];
        try {
          const result = await window.DataService.Program.createProgram({
            ...program,
            institutionId: user.uid
          });

          if (result.success) {
            console.log(`✅ Created: ${program.name} (ID: ${result.id})`);
            results.push({ success: true, program: program.name, id: result.id });
          }
        } catch (error) {
          console.error(`❌ Failed to create ${program.name}:`, error.message);
          results.push({ success: false, program: program.name, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`\n✅ Created ${successCount} out of ${programs.length} programs`);

      return {
        success: true,
        created: successCount,
        total: programs.length,
        results
      };
    },

    async deleteAllPrograms() {
      if (profile.accountType !== 'institution') {
        console.error('❌ Only institutions can delete programs');
        return { success: false };
      }

      console.log('\n🗑️ Deleting all programs...');

      try {
        const programs = await window.DataService.Program.getProgramsByInstitution(user.uid);
        console.log(`Found ${programs.length} programs to delete`);

        const db = window.Firebase.db;
        const batch = db.batch();

        programs.forEach(program => {
          const ref = db.collection('programs').doc(program.id);
          batch.delete(ref);
        });

        await batch.commit();
        console.log(`✅ Deleted ${programs.length} programs`);

        // Clear cache
        window.DataService.clearCache();

        return { success: true, deleted: programs.length };
      } catch (error) {
        console.error('❌ Error deleting programs:', error);
        return { success: false, error: error.message };
      }
    },

    async viewMyPrograms() {
      try {
        const programs = await window.DataService.Program.getProgramsByInstitution(user.uid);
        console.log(`\n📋 Your Programs (${programs.length}):`);
        console.table(programs.map(p => ({
          ID: p.id,
          Name: p.name,
          Degree: p.degree,
          'Tuition/Year': `$${p.tuitionPerYear?.toLocaleString()}`,
          'Available Spots': `${p.stats?.availableSpots}/${p.stats?.totalSpots}`,
          Active: p.isActive ? 'Yes' : 'No'
        })));
        return programs;
      } catch (error) {
        console.error('❌ Error fetching programs:', error);
        return [];
      }
    },

    async viewStats() {
      if (profile.accountType !== 'institution') {
        console.log('❌ Only institutions can view stats');
        return;
      }

      try {
        const progStats = await window.DataService.Program.getProgramStats(user.uid);
        const appStats = await window.DataService.Application.getInstitutionStats(user.uid);

        console.log('\n📊 Institution Statistics:');
        console.log('Programs:', progStats);
        console.log('Applications:', appStats);

        return { programs: progStats, applications: appStats };
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
      }
    }
  };

  console.log('\n📚 Available Commands:');
  console.log('======================');
  console.log('FlowInitializer.initializePrograms()    - Create sample programs');
  console.log('FlowInitializer.viewMyPrograms()        - View your programs');
  console.log('FlowInitializer.viewStats()             - View statistics');
  console.log('FlowInitializer.deleteAllPrograms()     - Delete all programs');
  console.log('window.reloadDashboard()                - Reload dashboard data');
  console.log('\nℹ️ Copy and paste these commands to initialize data!');

})();
