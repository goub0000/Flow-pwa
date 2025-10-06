// Programs Loader - Fetches and displays all programs from all institutions
// Students see real programs from real institutions

(function() {
  'use strict';

  // Wait for dependencies
  async function waitForDependencies() {
    if (!window.Firebase || !window.Firebase.initialized) {
      await new Promise(resolve => {
        document.addEventListener('firebaseInitialized', resolve, { once: true });
      });
    }

    while (!window.DataService || !window.DataService.isReady()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Fetch ALL programs from ALL institutions
  async function getAllPrograms() {
    try {
      const db = window.Firebase.db;
      const snapshot = await db.collection('programs')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(100)  // Reasonable limit
        .get();

      const programs = [];
      const institutionIds = new Set();

      snapshot.forEach(doc => {
        const program = { id: doc.id, ...doc.data() };
        programs.push(program);
        institutionIds.add(program.institutionId);
      });

      // Fetch institution details for all programs
      const institutions = new Map();
      for (const instId of institutionIds) {
        const inst = await window.DataService.User.getUser(instId);
        if (inst) {
          institutions.set(instId, inst);
        }
      }

      // Enrich programs with institution data
      const enrichedPrograms = programs.map(program => ({
        ...program,
        institution: institutions.get(program.institutionId) || {
          institutionName: 'Unknown Institution',
          country: 'Unknown'
        }
      }));

      return enrichedPrograms;
    } catch (error) {
      console.error('Error fetching programs:', error);
      return [];
    }
  }

  // Render programs to the page
  function renderPrograms(programs, container) {
    if (!container) return;

    if (programs.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 3rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3>No Programs Available</h3>
          <p>There are no programs in the system yet. Check back later or contact your administrator.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = programs.map(program => `
      <div class="program-card" data-program-id="${program.id}">
        <div class="program-card__header">
          <h3 class="program-card__title">${escapeHtml(program.name)}</h3>
          <span class="badge badge--${getDegreeColor(program.degree)}">${escapeHtml(program.degree || 'N/A')}</span>
        </div>

        <div class="program-card__institution">
          <strong>${escapeHtml(program.institution.institutionName || 'Unknown Institution')}</strong>
          ${program.institution.address ? `
            <span class="muted"> • ${escapeHtml(program.institution.address.city || '')}, ${escapeHtml(program.institution.address.country || '')}</span>
          ` : ''}
        </div>

        ${program.description ? `
          <p class="program-card__description">${escapeHtml(program.description.substring(0, 150))}${program.description.length > 150 ? '...' : ''}</p>
        ` : ''}

        <div class="program-card__details">
          ${program.duration ? `
            <div class="program-card__detail">
              <span class="muted">Duration:</span>
              <strong>${program.duration} ${program.duration === 1 ? 'year' : 'years'}</strong>
            </div>
          ` : ''}

          ${program.tuitionPerYear ? `
            <div class="program-card__detail">
              <span class="muted">Tuition/year:</span>
              <strong data-amount-usd="${program.tuitionPerYear}">$${program.tuitionPerYear.toLocaleString()}</strong>
            </div>
          ` : ''}

          ${program.requirements?.minGPA ? `
            <div class="program-card__detail">
              <span class="muted">Min GPA:</span>
              <strong>${program.requirements.minGPA}</strong>
            </div>
          ` : ''}
        </div>

        ${program.stats ? `
          <div class="program-card__stats">
            <span class="muted">
              ${program.stats.availableSpots || 0} spots available out of ${program.stats.totalSpots || 0}
            </span>
          </div>
        ` : ''}

        <div class="program-card__actions">
          <button class="btn btn--ghost btn--sm view-program-btn" data-program-id="${program.id}">
            View Details
          </button>
          <button class="btn btn--primary btn--sm apply-program-btn" data-program-id="${program.id}">
            Apply Now
          </button>
        </div>
      </div>
    `).join('');

    // Apply currency formatting if available
    if (window.Flow && window.Flow.currency) {
      window.Flow.currency.apply();
    }

    // Attach event listeners
    attachProgramCardListeners(container, programs);
  }

  // Attach event listeners to program cards
  function attachProgramCardListeners(container, programs) {
    // View details buttons
    container.querySelectorAll('.view-program-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const programId = e.target.dataset.programId;
        const program = programs.find(p => p.id === programId);
        if (program) {
          showProgramModal(program);
        }
      });
    });

    // Apply buttons
    container.querySelectorAll('.apply-program-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const programId = e.target.dataset.programId;
        const program = programs.find(p => p.id === programId);
        if (program) {
          await handleApplyToProgram(program);
        }
      });
    });
  }

  // Show program details modal
  function showProgramModal(program) {
    const modal = document.getElementById('programModal');
    const modalBody = document.getElementById('programModalBody');
    const modalTitle = document.getElementById('programModalTitle');

    if (!modal || !modalBody) return;

    if (modalTitle) {
      modalTitle.textContent = program.name;
    }

    modalBody.innerHTML = `
      <div class="program-modal-content">
        <div class="program-modal__institution">
          <h4>${escapeHtml(program.institution.institutionName || 'Unknown Institution')}</h4>
          ${program.institution.address ? `
            <p class="muted">${escapeHtml(program.institution.address.city || '')}, ${escapeHtml(program.institution.address.country || '')}</p>
          ` : ''}
          ${program.institution.website ? `
            <p><a href="${escapeHtml(program.institution.website)}" target="_blank" rel="noopener">Visit Website</a></p>
          ` : ''}
        </div>

        <div class="program-modal__section">
          <h5>Program Details</h5>
          <dl>
            <dt>Degree:</dt>
            <dd>${escapeHtml(program.degree || 'N/A')}</dd>

            ${program.department ? `
              <dt>Department:</dt>
              <dd>${escapeHtml(program.department)}</dd>
            ` : ''}

            ${program.duration ? `
              <dt>Duration:</dt>
              <dd>${program.duration} ${program.duration === 1 ? 'year' : 'years'}</dd>
            ` : ''}

            ${program.tuitionPerYear ? `
              <dt>Tuition per Year:</dt>
              <dd data-amount-usd="${program.tuitionPerYear}">$${program.tuitionPerYear.toLocaleString()}</dd>
            ` : ''}
          </dl>
        </div>

        ${program.description ? `
          <div class="program-modal__section">
            <h5>Description</h5>
            <p>${escapeHtml(program.description)}</p>
          </div>
        ` : ''}

        ${program.requirements ? `
          <div class="program-modal__section">
            <h5>Requirements</h5>
            <dl>
              ${program.requirements.minGPA ? `
                <dt>Minimum GPA:</dt>
                <dd>${program.requirements.minGPA}</dd>
              ` : ''}

              ${program.requirements.minSAT ? `
                <dt>Minimum SAT:</dt>
                <dd>${program.requirements.minSAT}</dd>
              ` : ''}

              ${program.requirements.minACT ? `
                <dt>Minimum ACT:</dt>
                <dd>${program.requirements.minACT}</dd>
              ` : ''}

              ${program.requirements.requiredDocuments?.length ? `
                <dt>Required Documents:</dt>
                <dd>${program.requirements.requiredDocuments.join(', ')}</dd>
              ` : ''}
            </dl>
          </div>
        ` : ''}

        ${program.deadlines ? `
          <div class="program-modal__section">
            <h5>Deadlines</h5>
            <dl>
              ${program.deadlines.earlyDecision ? `
                <dt>Early Decision:</dt>
                <dd>${formatDate(program.deadlines.earlyDecision)}</dd>
              ` : ''}

              ${program.deadlines.regularDecision ? `
                <dt>Regular Decision:</dt>
                <dd>${formatDate(program.deadlines.regularDecision)}</dd>
              ` : ''}

              ${program.deadlines.finalDecision ? `
                <dt>Final Decision:</dt>
                <dd>${formatDate(program.deadlines.finalDecision)}</dd>
              ` : ''}
            </dl>
          </div>
        ` : ''}
      </div>
    `;

    // Apply currency formatting
    if (window.Flow && window.Flow.currency) {
      window.Flow.currency.apply();
    }

    // Show modal
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';

    // Set up close handlers
    const closeBtn = document.getElementById('closeProgramModal');
    const backdrop = modal.querySelector('.modal__backdrop');

    const closeModal = () => {
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
    };

    if (closeBtn) {
      closeBtn.onclick = closeModal;
    }

    if (backdrop) {
      backdrop.onclick = closeModal;
    }
  }

  // Handle apply to program
  async function handleApplyToProgram(program) {
    if (!window.FlowAuth || !window.FlowAuth.isAuthenticated()) {
      alert('Please log in to apply to programs.');
      window.location.href = '/auth/';
      return;
    }

    const user = window.FlowAuth.getCurrentUser();
    const profile = window.FlowAuth.getUserProfile();

    if (profile.accountType !== 'student') {
      alert('Only students can apply to programs.');
      return;
    }

    // Check if already applied
    try {
      const existingApps = await window.DataService.Application.getApplicationsByStudent(user.uid);
      const alreadyApplied = existingApps.some(app => app.programId === program.id);

      if (alreadyApplied) {
        alert('You have already applied to this program.');
        return;
      }

      // Create application
      const result = await window.DataService.Application.createApplication({
        studentId: user.uid,
        targetInstitutionId: program.institutionId,
        programId: program.id,
        personalStatement: '',
        academicInfo: profile.academicInfo || {},
        activities: [],
        awards: [],
        essays: []
      });

      if (result.success) {
        alert('Application started successfully! Complete it in your Applications page.');
        window.location.href = '/students/applications.html';
      }
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to start application. Please try again.');
    }
  }

  // Filter programs
  function filterPrograms(programs, filters) {
    return programs.filter(program => {
      // Search text
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          program.name.toLowerCase().includes(searchLower) ||
          program.institution.institutionName.toLowerCase().includes(searchLower) ||
          (program.description && program.description.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Country
      if (filters.country && program.institution.address?.country) {
        if (program.institution.address.country.toLowerCase() !== filters.country.toLowerCase()) {
          return false;
        }
      }

      // Degree level
      if (filters.level && program.degree) {
        if (program.degree.toLowerCase() !== filters.level.toLowerCase()) {
          return false;
        }
      }

      // Max tuition
      if (filters.maxTuition && program.tuitionPerYear) {
        if (program.tuitionPerYear > filters.maxTuition) {
          return false;
        }
      }

      return true;
    });
  }

  // Helper functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function getDegreeColor(degree) {
    const colors = {
      bachelor: 'primary',
      master: 'success',
      doctorate: 'warning',
      certificate: 'info',
      associate: 'secondary'
    };
    return colors[degree?.toLowerCase()] || 'default';
  }

  function formatDate(dateValue) {
    if (!dateValue) return 'N/A';

    try {
      let date;
      if (dateValue.toDate) {
        date = dateValue.toDate();
      } else {
        date = new Date(dateValue);
      }
      return date.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  }

  // Initialize programs loader
  async function initProgramsLoader() {
    console.log('🎓 Initializing programs loader...');

    try {
      await waitForDependencies();

      const programGrid = document.getElementById('programGrid');
      const resultCount = document.getElementById('resultCount');
      const emptyState = document.getElementById('emptyState');

      if (!programGrid) {
        console.log('Program grid not found on this page');
        return;
      }

      // Show loading state
      programGrid.innerHTML = '<div class="loading">Loading programs...</div>';

      // Fetch programs
      const programs = await getAllPrograms();
      console.log(`✅ Loaded ${programs.length} programs`);

      // Update count
      if (resultCount) {
        resultCount.textContent = programs.length;
      }

      // Render programs
      if (programs.length === 0) {
        programGrid.style.display = 'none';
        if (emptyState) {
          emptyState.hidden = false;
        }
      } else {
        programGrid.style.display = 'grid';
        if (emptyState) {
          emptyState.hidden = true;
        }
        renderPrograms(programs, programGrid);
      }

      // Set up filters
      setupFilters(programs, programGrid, resultCount, emptyState);

      console.log('✅ Programs loader initialized');
    } catch (error) {
      console.error('❌ Error initializing programs loader:', error);
    }
  }

  // Setup filter functionality
  function setupFilters(allPrograms, programGrid, resultCount, emptyState) {
    const searchInput = document.getElementById('programSearch');
    const countryFilter = document.getElementById('filterCountry');
    const levelFilter = document.getElementById('filterLevel');
    const tuitionFilter = document.getElementById('filterTuition');
    const resetBtn = document.getElementById('resetFilters');

    const applyFilters = () => {
      const filters = {
        search: searchInput?.value || '',
        country: countryFilter?.value || '',
        level: levelFilter?.value || '',
        maxTuition: tuitionFilter?.value ? parseInt(tuitionFilter.value) : Infinity
      };

      const filtered = filterPrograms(allPrograms, filters);

      if (resultCount) {
        resultCount.textContent = filtered.length;
      }

      if (filtered.length === 0) {
        programGrid.style.display = 'none';
        if (emptyState) {
          emptyState.hidden = false;
        }
      } else {
        programGrid.style.display = 'grid';
        if (emptyState) {
          emptyState.hidden = true;
        }
        renderPrograms(filtered, programGrid);
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    if (countryFilter) {
      countryFilter.addEventListener('change', applyFilters);
    }

    if (levelFilter) {
      levelFilter.addEventListener('change', applyFilters);
    }

    if (tuitionFilter) {
      tuitionFilter.addEventListener('input', applyFilters);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (countryFilter) countryFilter.value = '';
        if (levelFilter) levelFilter.value = '';
        if (tuitionFilter) tuitionFilter.value = '50000';
        applyFilters();
      });
    }
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProgramsLoader);
  } else {
    initProgramsLoader();
  }

  // Expose globally
  window.ProgramsLoader = {
    init: initProgramsLoader,
    getAllPrograms
  };

  console.log('🎓 Programs Loader loaded');

})();
