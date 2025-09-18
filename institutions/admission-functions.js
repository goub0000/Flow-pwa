// Admission Requirements Management Functions
// All the complex functions from the original implementation

// Configure specific requirement
window.configureRequirement = function(reqId) {
  // Ensure library is properly initialized with templates
  if (!window.admissionRequirementsLibrary || 
      window.admissionRequirementsLibrary.length === 0 || 
      !window.admissionRequirementsLibrary[0].configTemplate) {
    console.warn('⚠️ Library needs reinitialization for configuration');
    initializeDefaultLibrary();
  }

  const requirement = window.admissionRequirementsLibrary.find(req => req.id === reqId);
  if (!requirement) {
    alert('❌ Requirement not found in library');
    return;
  }

  console.log('⚙️ Configuring requirement:', reqId);

  // Get current configuration
  const selectedProgram = window.currentSelectedProgram;
  if (!selectedProgram) {
    alert('Please select a program first');
    return;
  }

  const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
  let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
  
  if (!programConfig.requirements) programConfig.requirements = {};
  if (!programConfig.requirements[reqId]) programConfig.requirements[reqId] = { required: false };
  
  const currentConfig = programConfig.requirements[reqId].config || {};
  const template = requirement.configTemplate || {};

  // Generate form fields based on template
  const formFields = Object.entries(template).map(([key, defaultValue]) => {
    const currentValue = currentConfig[key] || defaultValue;
    const fieldType = typeof defaultValue === 'boolean' ? 'checkbox' : 
                     key.toLowerCase().includes('number') || key.toLowerCase().includes('minimum') || key.toLowerCase().includes('score') ? 'number' :
                     key.toLowerCase().includes('notes') || key.toLowerCase().includes('description') ? 'textarea' : 'text';
    
    return `
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 6px;">
          ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </label>
        ${fieldType === 'checkbox' ? `
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="config_${key}" ${currentValue ? 'checked' : ''} style="margin-right: 8px;">
            <span style="font-size: 13px; color: #6b7280;">Enable this option</span>
          </label>
        ` : fieldType === 'textarea' ? `
          <textarea id="config_${key}" placeholder="Enter ${key.toLowerCase()}..." style="width: 100%; height: 60px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; resize: vertical;">${currentValue}</textarea>
        ` : `
          <input type="${fieldType}" id="config_${key}" value="${currentValue}" placeholder="Enter ${key.toLowerCase()}..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;">
        `}
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div id="configModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10002; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7);">
      <div onclick="closeConfigModal()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
      <div style="position: relative; max-width: 90vw; width: 600px; max-height: 80vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow-y: auto;">
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
          <h2 style="margin: 0; color: #1f2937;">⚙️ Configure ${requirement.name}</h2>
          <button onclick="closeConfigModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
        </div>
        <div style="padding: 20px;">
          <div style="margin-bottom: 20px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
            <p style="margin: 0; color: #1e40af; font-size: 13px;">
              ${requirement.icon} ${requirement.description}
            </p>
          </div>
          <form id="configForm">
            ${formFields}
          </form>
        </div>
        <div style="padding: 20px; border-top: 1px solid #e5e7eb; background: #f8fafc; display: flex; justify-content: space-between;">
          <button onclick="closeConfigModal()" style="padding: 10px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Cancel</button>
          <button onclick="saveRequirementConfig('${reqId}')" style="padding: 10px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Save Configuration</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// Save requirement configuration
window.saveRequirementConfig = function(reqId) {
  const selectedProgram = window.currentSelectedProgram;
  if (!selectedProgram) return;

  const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
  let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
  
  if (!programConfig.requirements) programConfig.requirements = {};
  if (!programConfig.requirements[reqId]) programConfig.requirements[reqId] = { required: false };

  // Collect form data
  const requirement = window.admissionRequirementsLibrary.find(req => req.id === reqId);
  const template = requirement.configTemplate || {};
  const config = {};

  Object.keys(template).forEach(key => {
    const element = document.getElementById(`config_${key}`);
    if (element) {
      if (element.type === 'checkbox') {
        config[key] = element.checked;
      } else if (element.type === 'number') {
        config[key] = element.value ? parseFloat(element.value) : template[key];
      } else {
        config[key] = element.value || template[key];
      }
    }
  });

  programConfig.requirements[reqId].config = config;
  localStorage.setItem(programKey, JSON.stringify(programConfig));

  console.log('✅ Saved configuration for', reqId, config);
  closeConfigModal();
  
  // Refresh the display
  loadProgramRequirements(selectedProgram);
};

// Close configuration modal
window.closeConfigModal = function() {
  const modal = document.getElementById('configModal');
  if (modal) modal.remove();
};

// Preview admission requirements
window.previewAdmissionRequirements = function() {
  console.log('👁️ Preview button clicked');
  
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) {
      alert('Please select a program first from the dropdown');
      return;
    }
    
    console.log('👁️ Previewing requirements for program:', selectedProgram);
    
    // Get program configuration
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = {};
    
    try {
      const stored = localStorage.getItem(programKey);
      if (stored) programConfig = JSON.parse(stored);
    } catch (e) {
      console.warn('⚠️ Error loading config:', e);
    }
    
    const requirements = programConfig.requirements || {};
    const requiredReqs = Object.entries(requirements).filter(([_, req]) => req.required);
    const optionalReqs = Object.entries(requirements).filter(([_, req]) => !req.required);
    
    // Generate preview content
    const previewHtml = `
      <div id="previewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10003; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7);">
        <div onclick="closePreviewModal()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        <div style="position: relative; max-width: 90vw; width: 700px; max-height: 80vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow-y: auto;">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
            <h2 style="margin: 0; color: #1f2937;">👁️ Student View: ${selectedProgram}</h2>
            <button onclick="closePreviewModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          </div>
          <div style="padding: 20px;">
            <div style="text-align: center; padding: 20px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 8px 0; font-size: 24px;">🎓 Admission Requirements</h3>
              <p style="color: #6b7280; margin: 0; font-size: 16px;">${selectedProgram}</p>
            </div>
            
            ${requiredReqs.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h4 style="color: #dc2626; margin: 0 0 12px 0; display: flex; align-items: center; font-size: 18px;">
                  <span style="margin-right: 8px;">📋</span> Required for Admission
                </h4>
                ${requiredReqs.map(([reqId, reqData]) => {
                  const reqInfo = window.admissionRequirementsLibrary.find(r => r.id === reqId);
                  return `
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
                      <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 24px; margin-right: 12px;">${reqInfo?.icon || '📋'}</span>
                        <h5 style="margin: 0; color: #991b1b; font-size: 16px;">${reqInfo?.name || reqId}</h5>
                      </div>
                      <p style="color: #7f1d1d; margin: 0; font-size: 14px;">${reqInfo?.description || 'No description available'}</p>
                      ${reqData.config ? Object.entries(reqData.config).map(([key, value]) => {
                        if (value && key !== 'notes') {
                          return `<div style="font-size: 12px; color: #7f1d1d; margin-top: 4px;"><strong>${key}:</strong> ${value}</div>`;
                        }
                        return '';
                      }).join('') : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            
            ${optionalReqs.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h4 style="color: #059669; margin: 0 0 12px 0; display: flex; align-items: center; font-size: 18px;">
                  <span style="margin-right: 8px;">📄</span> Optional (Recommended)
                </h4>
                ${optionalReqs.map(([reqId, reqData]) => {
                  const reqInfo = window.admissionRequirementsLibrary.find(r => r.id === reqId);
                  return `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
                      <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 24px; margin-right: 12px;">${reqInfo?.icon || '📄'}</span>
                        <h5 style="margin: 0; color: #047857; font-size: 16px;">${reqInfo?.name || reqId}</h5>
                      </div>
                      <p style="color: #065f46; margin: 0; font-size: 14px;">${reqInfo?.description || 'No description available'}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            
            ${requiredReqs.length === 0 && optionalReqs.length === 0 ? `
              <div style="text-align: center; color: #6b7280; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
                <h3 style="margin: 0 0 8px 0;">No Requirements Configured</h3>
                <p style="margin: 0;">This program doesn't have any admission requirements set up yet.</p>
              </div>
            ` : ''}
            
            <div style="margin-top: 24px; padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px;">📞 Questions?</h4>
              <p style="margin: 0; color: #1e3a8a; font-size: 13px;">Contact our admissions office for more information about these requirements and the application process.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHtml);
    
    console.log('✅ Preview modal opened successfully');
    
  } catch (error) {
    console.error('❌ Error opening preview:', error);
    alert('Error opening preview. Please try again.');
  }
};

// Close preview modal
window.closePreviewModal = function() {
  const modal = document.getElementById('previewModal');
  if (modal) modal.remove();
};

// Export configuration
window.exportAdmissionConfig = function() {
  console.log('📤 Export button clicked');
  
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) {
      alert('Please select a program first from the dropdown');
      return;
    }
    
    console.log('📤 Exporting config for program:', selectedProgram);
    
    // Get program configuration
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = {};
    
    try {
      const stored = localStorage.getItem(programKey);
      if (stored) programConfig = JSON.parse(stored);
    } catch (e) {
      console.warn('⚠️ Error loading config for export:', e);
      programConfig = {};
    }
    
    // Create export data with metadata
    const exportData = {
      program: selectedProgram,
      exportDate: new Date().toISOString(),
      version: '1.0',
      configuration: programConfig
    };
    
    // Create and download file
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `admission-config-${selectedProgram.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`✅ Configuration exported successfully!\n\nFile: ${link.download}\nProgram: ${selectedProgram}\nData: Configuration with ${Object.keys(programConfig.requirements || {}).length} requirements`);
    
    console.log('✅ Export completed successfully');
    
  } catch (error) {
    console.error('❌ Error exporting config:', error);
    alert('Error exporting configuration. Please try again.');
  }
};

// Import configuration
window.importAdmissionConfig = function() {
  console.log('📥 Import button clicked');
  
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) {
      alert('Please select a program first from the dropdown');
      return;
    }
    
    console.log('📥 Starting import for program:', selectedProgram);
    
    const fileInput = document.getElementById('importFileInput');
    if (!fileInput) {
      console.error('❌ File input not found');
      return;
    }
    
    fileInput.onchange = function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      console.log('📁 File selected:', file.name);
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jsonData = JSON.parse(e.target.result);
          console.log('📋 Parsed import data:', jsonData);
          
          // Show import preview modal
          showImportPreview(jsonData, selectedProgram);
          
        } catch (parseError) {
          console.error('❌ Error parsing JSON:', parseError);
          alert('❌ Invalid JSON file. Please select a valid admission configuration file.');
        }
      };
      
      reader.readAsText(file);
    };
    
    fileInput.click();
    
  } catch (error) {
    console.error('❌ Error importing config:', error);
    alert('Error starting import process. Please try again.');
  }
};

// Show import preview
function showImportPreview(importData, currentProgram) {
  const sourceProgram = importData.program || 'Unknown Program';
  const config = importData.configuration || {};
  const requirements = config.requirements || {};
  
  const previewHtml = `
    <div id="importPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10003; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7);">
      <div onclick="closeImportPreview()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
      <div style="position: relative; max-width: 90vw; width: 600px; max-height: 80vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow-y: auto;">
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
          <h2 style="margin: 0; color: #1f2937;">📥 Import Configuration Preview</h2>
          <button onclick="closeImportPreview()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
        </div>
        <div style="padding: 20px;">
          <div style="margin-bottom: 20px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
            <h4 style="margin: 0 0 4px 0; color: #1e40af;">📊 Import Summary</h4>
            <p style="margin: 0; color: #1e3a8a; font-size: 13px;">
              <strong>Source:</strong> ${sourceProgram}<br>
              <strong>Target:</strong> ${currentProgram}<br>
              <strong>Requirements:</strong> ${Object.keys(requirements).length} configured<br>
              <strong>Export Date:</strong> ${importData.exportDate ? new Date(importData.exportDate).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          
          ${Object.keys(requirements).length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h4 style="margin: 0 0 12px 0; color: #374151;">📋 Requirements to Import</h4>
              ${Object.entries(requirements).map(([reqId, reqData]) => {
                const reqInfo = window.admissionRequirementsLibrary.find(r => r.id === reqId);
                return `
                  <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                      <span style="font-weight: 500; color: #1f2937;">${reqInfo?.name || reqId}</span>
                      <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; background: ${reqData.required ? '#dc2626' : '#059669'}; color: white;">
                        ${reqData.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
          
          <div style="margin-bottom: 16px; padding: 12px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              ⚠️ <strong>Warning:</strong> This will replace the current configuration for ${currentProgram}. Any existing requirements will be overwritten.
            </p>
          </div>
        </div>
        <div style="padding: 20px; border-top: 1px solid #e5e7eb; background: #f8fafc; display: flex; justify-content: space-between;">
          <button onclick="closeImportPreview()" style="padding: 10px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Cancel</button>
          <button onclick="confirmImport()" style="padding: 10px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">📥 Import Configuration</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', previewHtml);
  
  // Store import data temporarily for confirmation
  window.tempImportData = importData;
}

// Confirm import
window.confirmImport = function() {
  try {
    const importData = window.tempImportData;
    const selectedProgram = window.currentSelectedProgram;
    
    if (!importData || !selectedProgram) {
      alert('❌ Import data not found. Please try again.');
      return;
    }
    
    console.log('📥 Confirming import for program:', selectedProgram);
    
    // Save imported configuration
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const configToImport = importData.configuration || {};
    
    localStorage.setItem(programKey, JSON.stringify(configToImport));
    
    console.log('✅ Import completed successfully');
    
    // Clean up
    delete window.tempImportData;
    closeImportPreview();
    
    // Refresh the display
    loadProgramRequirements(selectedProgram);
    
    alert(`✅ Configuration imported successfully!\n\nProgram: ${selectedProgram}\nYou can now preview the imported requirements.`);
    
  } catch (error) {
    console.error('❌ Error confirming import:', error);
    alert('❌ Error importing configuration. Please try again.');
  }
};

// Close import preview
window.closeImportPreview = function() {
  const modal = document.getElementById('importPreviewModal');
  if (modal) modal.remove();
  delete window.tempImportData;
};

// Validate configuration
window.validateAdmissionConfig = function() {
  console.log('✅ Validate button clicked');
  
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) {
      alert('Please select a program first from the dropdown');
      return;
    }
    
    console.log('🔍 Validating configuration for program:', selectedProgram);
    
    // Perform validation analysis
    const validationResults = performValidationAnalysis(selectedProgram);
    
    // Show validation results modal
    const validationModalHtml = `
      <div id="validationModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10003; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7);">
        <div onclick="closeValidationModal()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        <div style="position: relative; max-width: 90vw; width: 700px; max-height: 80vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow-y: auto;">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
            <h2 style="margin: 0; color: #1f2937;">✅ Validation Results: ${selectedProgram}</h2>
            <button onclick="closeValidationModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          </div>
          <div style="padding: 20px;">
            <div style="text-align: center; padding: 20px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px;">
              <div style="font-size: 48px; margin-bottom: 10px;">${validationResults.overall.icon}</div>
              <h3 style="color: ${validationResults.overall.color}; margin: 0; font-size: 18px;">${validationResults.overall.status}</h3>
              <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">${validationResults.overall.description}</p>
            </div>
            
            ${validationResults.errors.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h4 style="color: #dc2626; margin: 0 0 12px 0; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">❌</span> Errors (${validationResults.errors.length})
                </h4>
                ${validationResults.errors.map(error => `
                  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <p style="color: #991b1b; margin: 0; font-size: 14px;">${error}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${validationResults.warnings.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h4 style="color: #d97706; margin: 0 0 12px 0; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">⚠️</span> Warnings (${validationResults.warnings.length})
                </h4>
                ${validationResults.warnings.map(warning => `
                  <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">${warning}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${validationResults.suggestions.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h4 style="color: #059669; margin: 0 0 12px 0; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">💡</span> Suggestions (${validationResults.suggestions.length})
                </h4>
                ${validationResults.suggestions.map(suggestion => `
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <p style="color: #047857; margin: 0; font-size: 14px;">${suggestion}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', validationModalHtml);
    
    console.log('✅ Validation modal opened successfully');
    
  } catch (error) {
    console.error('❌ Error validating config:', error);
    alert('❌ Validation failed: ' + error.message);
  }
};

// Perform validation analysis
function performValidationAnalysis(programName) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  
  // Get real program configuration
  const programKey = `admission_config_${programName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  let programConfig = {};
  
  try {
    const stored = localStorage.getItem(programKey);
    if (stored) programConfig = JSON.parse(stored);
  } catch (e) {
    console.warn('⚠️ Error loading config for validation:', e);
    errors.push('Error loading program configuration for validation');
  }
  
  // Validate configuration structure
  if (!programConfig.requirements) {
    errors.push('No requirements configuration found');
    return {
      overall: { 
        icon: '❌', 
        status: 'Invalid Configuration', 
        description: 'Program configuration is missing or corrupted',
        color: '#dc2626'
      },
      errors,
      warnings,
      suggestions
    };
  }
  
  const requirements = Object.keys(programConfig.requirements);
  
  // Basic validation checks
  if (requirements.length === 0) {
    errors.push('No admission requirements have been configured');
  }
  
  const requiredCount = Object.values(programConfig.requirements).filter(req => req.required).length;
  const optionalCount = requirements.length - requiredCount;
  
  if (requiredCount === 0 && requirements.length > 0) {
    warnings.push('All requirements are set to optional - consider making some required');
  }
  
  // Check each requirement for proper configuration
  requirements.forEach(reqId => {
    const reqData = programConfig.requirements[reqId];
    const libraryReq = window.admissionRequirementsLibrary?.find(r => r.id === reqId);
    
    if (!libraryReq) {
      warnings.push(`Requirement "${reqId}" not found in current library`);
      return;
    }
    
    // Check if requirement has detailed configuration
    if (!reqData.config || Object.keys(reqData.config).length === 0) {
      suggestions.push(`Consider configuring detailed settings for ${libraryReq.name}`);
    }
  });
  
  // Program-specific validation
  if (programName.toLowerCase().includes('computer science')) {
    if (!requirements.includes('coursework')) {
      suggestions.push('Computer Science programs typically require prerequisite coursework');
    }
    if (!requirements.includes('gpa')) {
      suggestions.push('Consider adding GPA requirement for Computer Science program');
    }
  }
  
  if (programName.toLowerCase().includes('m.s.') || programName.toLowerCase().includes('master')) {
    if (!requirements.includes('degree')) {
      errors.push('Master\'s programs must require a bachelor\'s degree');
    }
    if (!requirements.includes('test-scores')) {
      suggestions.push('Graduate programs typically require standardized test scores');
    }
  }
  
  // Calculate overall status
  let overall;
  if (errors.length > 0) {
    overall = {
      icon: '❌',
      status: 'Configuration Has Errors',
      description: `Found ${errors.length} error(s) that need to be fixed`,
      color: '#dc2626'
    };
  } else if (warnings.length > 0) {
    overall = {
      icon: '⚠️',
      status: 'Configuration Needs Attention',
      description: `Found ${warnings.length} warning(s) to review`,
      color: '#d97706'
    };
  } else if (suggestions.length > 0) {
    overall = {
      icon: '✅',
      status: 'Configuration Valid',
      description: `Configuration is valid with ${suggestions.length} improvement suggestion(s)`,
      color: '#059669'
    };
  } else {
    overall = {
      icon: '🎉',
      status: 'Perfect Configuration',
      description: 'Configuration is complete and optimized',
      color: '#059669'
    };
  }
  
  return {
    overall,
    errors,
    warnings,
    suggestions
  };
}

// Close validation modal
window.closeValidationModal = function() {
  const modal = document.getElementById('validationModal');
  if (modal) modal.remove();
};

// Document & Deadlines Management function
window.manageDocumentsDeadlines = function() {
  console.log('📋 Document & Deadlines button clicked');
  
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) {
      alert('Please select a program first from the dropdown');
      return;
    }
    
    console.log('📋 Managing documents & deadlines for program:', selectedProgram);
    
    // Get current document/deadline configuration
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = {};
    
    try {
      const stored = localStorage.getItem(programKey);
      if (stored) programConfig = JSON.parse(stored);
    } catch (e) {
      console.warn('⚠️ Error loading config:', e);
    }
    
    // Initialize documents and deadlines structure
    if (!programConfig.documents) programConfig.documents = {};
    if (!programConfig.deadlines) programConfig.deadlines = {};
    
    // Document types library
    const documentTypes = [
      { id: 'transcript', name: 'Official Transcript', icon: '📜', required: true, quantity: 1 },
      { id: 'recommendation', name: 'Letters of Recommendation', icon: '💌', required: true, quantity: 3 },
      { id: 'essay', name: 'Personal Statement/Essay', icon: '📝', required: true, quantity: 1 },
      { id: 'portfolio', name: 'Portfolio', icon: '🎨', required: false, quantity: 1 },
      { id: 'test_scores', name: 'Standardized Test Scores', icon: '📊', required: true, quantity: 1 },
      { id: 'resume', name: 'Resume/CV', icon: '📄', required: false, quantity: 1 },
      { id: 'research_proposal', name: 'Research Proposal', icon: '🔬', required: false, quantity: 1 },
      { id: 'writing_sample', name: 'Writing Sample', icon: '✍️', required: false, quantity: 1 }
    ];
    
    // Deadline types library
    const deadlineTypes = [
      { id: 'early_admission', name: 'Early Admission', icon: '🚀', date: '', description: 'Priority deadline for early consideration' },
      { id: 'regular_admission', name: 'Regular Admission', icon: '📅', date: '', description: 'Standard application deadline' },
      { id: 'late_admission', name: 'Late Admission', icon: '⏰', date: '', description: 'Final deadline with limited availability' },
      { id: 'financial_aid', name: 'Financial Aid', icon: '💰', date: '', description: 'Deadline for financial aid applications' },
      { id: 'scholarship', name: 'Scholarship Applications', icon: '🎓', date: '', description: 'Merit-based scholarship deadline' },
      { id: 'housing', name: 'Housing Application', icon: '🏠', date: '', description: 'Dormitory and housing application deadline' }
    ];
    
    // Create modal
    const modalHtml = `
      <div id="documentsDeadlinesModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10003; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7);">
        <div onclick="closeDocumentsDeadlinesModal()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        <div style="position: relative; max-width: 95vw; width: 1000px; max-height: 90vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: white;">
            <h2 style="margin: 0; color: #1f2937;">📋 Document & Deadlines Management: ${selectedProgram}</h2>
            <button onclick="closeDocumentsDeadlinesModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          </div>
          
          <div style="flex: 1; display: flex; overflow: hidden;">
            <!-- Left Panel: Document Requirements -->
            <div style="width: 50%; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column;">
              <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; background: #f8fafc;">
                <h3 style="margin: 0; color: #1f2937; font-size: 16px;">📄 Required Documents</h3>
                <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">Manage application documents and quantities</p>
              </div>
              <div style="flex: 1; overflow-y: auto; padding: 16px;">
                ${documentTypes.map(doc => {
                  const currentDoc = programConfig.documents[doc.id] || { required: doc.required, quantity: doc.quantity, instructions: '' };
                  return `
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                      <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 20px; margin-right: 8px;">${doc.icon}</span>
                        <span style="font-weight: 500; color: #1f2937;">${doc.name}</span>
                      </div>
                      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                        <label style="display: flex; align-items: center; font-size: 12px; color: #374151;">
                          <input type="checkbox" id="doc_${doc.id}_required" ${currentDoc.required ? 'checked' : ''} onchange="updateDocumentConfig('${doc.id}', 'required', this.checked)" style="margin-right: 4px;">
                          Required
                        </label>
                        <div style="display: flex; align-items: center; font-size: 12px; color: #374151;">
                          <span style="margin-right: 4px;">Quantity:</span>
                          <input type="number" id="doc_${doc.id}_quantity" value="${currentDoc.quantity}" min="0" max="10" onchange="updateDocumentConfig('${doc.id}', 'quantity', parseInt(this.value))" style="width: 40px; padding: 2px 4px; border: 1px solid #d1d5db; border-radius: 3px;">
                        </div>
                      </div>
                      <textarea id="doc_${doc.id}_instructions" placeholder="Special instructions or requirements..." onchange="updateDocumentConfig('${doc.id}', 'instructions', this.value)" style="width: 100%; height: 40px; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px; resize: none;">${currentDoc.instructions || ''}</textarea>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            
            <!-- Right Panel: Application Deadlines -->
            <div style="width: 50%; display: flex; flex-direction: column;">
              <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; background: #f8fafc;">
                <h3 style="margin: 0; color: #1f2937; font-size: 16px;">⏰ Application Deadlines</h3>
                <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">Set critical dates for application process</p>
              </div>
              <div style="flex: 1; overflow-y: auto; padding: 16px;">
                ${deadlineTypes.map(deadline => {
                  const currentDeadline = programConfig.deadlines[deadline.id] || { enabled: false, date: '', time: '23:59', description: deadline.description };
                  return `
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                      <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <input type="checkbox" id="deadline_${deadline.id}_enabled" ${currentDeadline.enabled ? 'checked' : ''} onchange="updateDeadlineConfig('${deadline.id}', 'enabled', this.checked)" style="margin-right: 8px;">
                        <span style="font-size: 16px; margin-right: 8px;">${deadline.icon}</span>
                        <span style="font-weight: 500; color: #1f2937;">${deadline.name}</span>
                      </div>
                      <div style="display: flex; gap: 8px; margin-bottom: 8px; ${currentDeadline.enabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
                        <input type="date" id="deadline_${deadline.id}_date" value="${currentDeadline.date}" onchange="updateDeadlineConfig('${deadline.id}', 'date', this.value)" style="flex: 1; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px;">
                        <input type="time" id="deadline_${deadline.id}_time" value="${currentDeadline.time}" onchange="updateDeadlineConfig('${deadline.id}', 'time', this.value)" style="padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px;">
                      </div>
                      <textarea id="deadline_${deadline.id}_description" placeholder="${deadline.description}" onchange="updateDeadlineConfig('${deadline.id}', 'description', this.value)" style="width: 100%; height: 35px; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px; resize: none; ${currentDeadline.enabled ? '' : 'opacity: 0.5; pointer-events: none;'}">${currentDeadline.description || ''}</textarea>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
          
          <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: #6b7280;">
              Documents & deadlines are automatically saved
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="previewDocumentsDeadlines()" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">👁️ Preview</button>
              <button onclick="closeDocumentsDeadlinesModal()" style="padding: 8px 12px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    console.log('✅ Document & Deadlines modal opened successfully');
    
  } catch (error) {
    console.error('❌ Error opening Document & Deadlines modal:', error);
    alert('Error opening Document & Deadlines management. Please try again.');
  }
};

// Document configuration update function
window.updateDocumentConfig = function(docId, field, value) {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    if (!programConfig.documents) programConfig.documents = {};
    if (!programConfig.documents[docId]) programConfig.documents[docId] = {};
    
    programConfig.documents[docId][field] = value;
    
    localStorage.setItem(programKey, JSON.stringify(programConfig));
    console.log(`📋 Updated document ${docId}.${field}:`, value);
  } catch (error) {
    console.error('❌ Error updating document config:', error);
  }
};

// Deadline configuration update function
window.updateDeadlineConfig = function(deadlineId, field, value) {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    if (!programConfig.deadlines) programConfig.deadlines = {};
    if (!programConfig.deadlines[deadlineId]) programConfig.deadlines[deadlineId] = {};
    
    programConfig.deadlines[deadlineId][field] = value;
    
    // Handle enabled/disabled state for UI
    if (field === 'enabled') {
      const deadlineDiv = document.getElementById(`deadline_${deadlineId}_enabled`).closest('div').parentNode;
      const inputs = deadlineDiv.querySelectorAll('input[type="date"], input[type="time"], textarea');
      inputs.forEach(input => {
        if (input.id !== `deadline_${deadlineId}_enabled`) {
          input.style.opacity = value ? '1' : '0.5';
          input.style.pointerEvents = value ? 'auto' : 'none';
        }
      });
    }
    
    localStorage.setItem(programKey, JSON.stringify(programConfig));
    console.log(`📋 Updated deadline ${deadlineId}.${field}:`, value);
  } catch (error) {
    console.error('❌ Error updating deadline config:', error);
  }
};

// Preview documents and deadlines
window.previewDocumentsDeadlines = function() {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    const documents = programConfig.documents || {};
    const deadlines = programConfig.deadlines || {};
    
    // Generate preview content
    const requiredDocs = Object.entries(documents).filter(([_, doc]) => doc.required);
    const optionalDocs = Object.entries(documents).filter(([_, doc]) => !doc.required);
    const enabledDeadlines = Object.entries(deadlines).filter(([_, deadline]) => deadline.enabled);
    
    const previewHtml = `
      <div id="documentsDeadlinesPreview" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10004; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8);">
        <div onclick="closeDocumentsDeadlinesPreview()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        <div style="position: relative; max-width: 90vw; width: 700px; max-height: 80vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow-y: auto;">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
            <h2 style="margin: 0; color: #1f2937;">📋 Application Requirements Preview: ${selectedProgram}</h2>
            <button onclick="closeDocumentsDeadlinesPreview()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          </div>
          <div style="padding: 20px;">
            ${requiredDocs.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #dc2626; margin: 0 0 12px 0; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">📄</span> Required Documents
                </h3>
                ${requiredDocs.map(([id, doc]) => `
                  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-weight: 500; color: #991b1b; margin-bottom: 4px;">${getDocumentName(id)} ${doc.quantity > 1 ? `(${doc.quantity} required)` : ''}</div>
                    ${doc.instructions ? `<p style="color: #7f1d1d; margin: 0; font-size: 13px;">${doc.instructions}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${optionalDocs.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #059669; margin: 0 0 12px 0; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">📄</span> Optional Documents
                </h3>
                ${optionalDocs.map(([id, doc]) => `
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-weight: 500; color: #047857; margin-bottom: 4px;">${getDocumentName(id)} ${doc.quantity > 1 ? `(up to ${doc.quantity})` : ''}</div>
                    ${doc.instructions ? `<p style="color: #065f46; margin: 0; font-size: 13px;">${doc.instructions}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${enabledDeadlines.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #d97706; margin: 0 0 12px 0; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">⏰</span> Important Deadlines
                </h3>
                ${enabledDeadlines.sort((a, b) => new Date(a[1].date) - new Date(b[1].date)).map(([id, deadline]) => `
                  <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span style="font-weight: 500; color: #92400e;">${getDeadlineName(id)}</span>
                      <span style="color: #92400e; font-weight: 500;">${formatDate(deadline.date)} at ${deadline.time}</span>
                    </div>
                    ${deadline.description ? `<p style="color: #78350f; margin: 0; font-size: 13px;">${deadline.description}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${requiredDocs.length === 0 && optionalDocs.length === 0 && enabledDeadlines.length === 0 ? `
              <div style="text-align: center; color: #6b7280; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
                <h3 style="margin: 0 0 8px 0;">No Requirements Configured</h3>
                <p style="margin: 0;">Configure documents and deadlines to see them here.</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHtml);
  } catch (error) {
    console.error('❌ Error showing preview:', error);
  }
};

// Helper functions for document and deadline names
function getDocumentName(id) {
  const names = {
    'transcript': 'Official Transcript',
    'recommendation': 'Letters of Recommendation',
    'essay': 'Personal Statement/Essay',
    'portfolio': 'Portfolio',
    'test_scores': 'Standardized Test Scores',
    'resume': 'Resume/CV',
    'research_proposal': 'Research Proposal',
    'writing_sample': 'Writing Sample'
  };
  return names[id] || id;
}

function getDeadlineName(id) {
  const names = {
    'early_admission': 'Early Admission',
    'regular_admission': 'Regular Admission',
    'late_admission': 'Late Admission',
    'financial_aid': 'Financial Aid',
    'scholarship': 'Scholarship Applications',
    'housing': 'Housing Application'
  };
  return names[id] || id;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Not set';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
}

// Close modal functions
window.closeDocumentsDeadlinesModal = function() {
  const modal = document.getElementById('documentsDeadlinesModal');
  if (modal) modal.remove();
};

window.closeDocumentsDeadlinesPreview = function() {
  const modal = document.getElementById('documentsDeadlinesPreview');
  if (modal) modal.remove();
};

// Global logic rule types definition
window.logicRuleTypes = [
  { 
    id: 'conditional_requirement', 
    name: 'Conditional Requirement', 
    icon: '🔄', 
    description: 'If condition A is met, then requirement B applies',
    examples: [
      'If GPA < 3.0, then require interview',
      'If international student, then require TOEFL score',
      'If no work experience, then require portfolio'
    ],
    template: { condition: '', requirement: '', alternative: '' }
  },
  { 
    id: 'either_or', 
    name: 'Either/Or Logic', 
    icon: '⚡', 
    description: 'Student must meet either requirement A or requirement B',
    examples: [
      'SAT score 1200+ OR ACT score 26+',
      'Bachelor\'s degree OR 5 years work experience',
      'Research paper OR capstone project'
    ],
    template: { optionA: '', optionB: '', optionC: '' }
  },
  { 
    id: 'progressive_requirement', 
    name: 'Progressive Requirement', 
    icon: '📈', 
    description: 'Requirements that scale based on other factors',
    examples: [
      'Higher GPA = fewer recommendation letters needed',
      'More experience = lower test score requirement',
      'Age-based prerequisite adjustments'
    ],
    template: { baseRequirement: '', scaleFactor: '', maximum: '', minimum: '' }
  },
  { 
    id: 'exception_rule', 
    name: 'Exception Rule', 
    icon: '🚫', 
    description: 'Conditions under which requirements may be waived',
    examples: [
      'Waive test scores for applicants with 10+ years experience',
      'Waive prerequisite courses for related degree holders',
      'Waive interview for honors graduates'
    ],
    template: { exceptionCondition: '', affectedRequirements: '', approvalRequired: true }
  }
];

// Prerequisites & Logic Management function
window.managePrerequisitesLogic = function() {
  console.log('🔗 Prerequisites & Logic button clicked');
  
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) {
      alert('Please select a program first from the dropdown');
      return;
    }
    
    console.log('🔗 Managing prerequisites & logic for program:', selectedProgram);
    
    // Get current prerequisites/logic configuration
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = {};
    
    try {
      const stored = localStorage.getItem(programKey);
      if (stored) programConfig = JSON.parse(stored);
    } catch (e) {
      console.warn('⚠️ Error loading config:', e);
    }
    
    // Initialize prerequisites and logic structure
    if (!programConfig.prerequisites) programConfig.prerequisites = {};
    if (!programConfig.logicRules) programConfig.logicRules = {};
    
    // Prerequisite categories library
    const prerequisiteCategories = [
      { 
        id: 'academic_coursework', 
        name: 'Academic Coursework', 
        icon: '📚', 
        description: 'Required courses and subjects',
        fields: { courses: '', creditHours: 0, minimumGrade: 'C', mustBeRecent: false, timeLimit: '' }
      },
      { 
        id: 'degree_requirements', 
        name: 'Degree Requirements', 
        icon: '🎓', 
        description: 'Specific degree or educational background',
        fields: { degreeType: '', field: '', accreditation: false, equivalency: true }
      },
      { 
        id: 'gpa_requirements', 
        name: 'GPA Requirements', 
        icon: '📊', 
        description: 'Minimum grade point average',
        fields: { minimumGPA: 0.0, scale: '4.0', lastTwoYears: false, majorGPA: false }
      },
      { 
        id: 'work_experience', 
        name: 'Work Experience', 
        icon: '💼', 
        description: 'Professional or related work experience',
        fields: { yearsRequired: 0, fieldRelevant: true, partTime: false, internships: true }
      },
      { 
        id: 'language_proficiency', 
        name: 'Language Proficiency', 
        icon: '🌍', 
        description: 'Language skills and test scores',
        fields: { language: 'English', testType: '', minimumScore: 0, exemptions: '' }
      },
      { 
        id: 'technical_skills', 
        name: 'Technical Skills', 
        icon: '⚙️', 
        description: 'Specific technical competencies',
        fields: { skills: '', certification: false, portfolio: false, demonstration: false }
      }
    ];
    
    // Create modal
    const modalHtml = `
      <div id="prerequisitesLogicModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10003; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7);">
        <div onclick="closePrerequisitesLogicModal()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        <div style="position: relative; max-width: 95vw; width: 1200px; max-height: 90vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: white;">
            <h2 style="margin: 0; color: #1f2937;">🔗 Prerequisites & Logic Management: ${selectedProgram}</h2>
            <button onclick="closePrerequisitesLogicModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          </div>
          
          <div style="flex: 1; display: flex; overflow: hidden;">
            <!-- Left Panel: Prerequisite Categories -->
            <div style="width: 50%; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column;">
              <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; background: #f8fafc;">
                <h3 style="margin: 0; color: #1f2937; font-size: 16px;">📚 Prerequisite Categories</h3>
                <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">Define academic and professional prerequisites</p>
              </div>
              <div style="flex: 1; overflow-y: auto; padding: 16px;">
                ${prerequisiteCategories.map(category => {
                  const currentPrereq = programConfig.prerequisites[category.id] || { enabled: false, ...category.fields };
                  return `
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <input type="checkbox" id="prereq_${category.id}_enabled" ${currentPrereq.enabled ? 'checked' : ''} onchange="updatePrerequisiteConfig('${category.id}', 'enabled', this.checked)" style="margin-right: 8px;">
                        <span style="font-size: 18px; margin-right: 8px;">${category.icon}</span>
                        <div>
                          <span style="font-weight: 500; color: #1f2937; display: block; font-size: 14px;">${category.name}</span>
                          <span style="color: #6b7280; font-size: 11px;">${category.description}</span>
                        </div>
                      </div>
                      <div id="prereq_${category.id}_fields" style="${currentPrereq.enabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
                        ${Object.entries(category.fields).map(([fieldName, defaultValue]) => {
                          const currentValue = currentPrereq[fieldName] !== undefined ? currentPrereq[fieldName] : defaultValue;
                          const fieldType = typeof defaultValue === 'boolean' ? 'checkbox' : 
                                          typeof defaultValue === 'number' ? 'number' : 'text';
                          
                          return `
                            <div style="margin-bottom: 6px;">
                              <label style="display: block; font-size: 11px; font-weight: 500; color: #374151; margin-bottom: 2px;">
                                ${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                              ${fieldType === 'checkbox' ? `
                                <label style="display: flex; align-items: center; font-size: 11px; color: #6b7280;">
                                  <input type="checkbox" id="prereq_${category.id}_${fieldName}" ${currentValue ? 'checked' : ''} onchange="updatePrerequisiteConfig('${category.id}', '${fieldName}', this.checked)" style="margin-right: 4px; transform: scale(0.9);">
                                  Required
                                </label>
                              ` : `
                                <input type="${fieldType}" id="prereq_${category.id}_${fieldName}" value="${currentValue}" onchange="updatePrerequisiteConfig('${category.id}', '${fieldName}', ${fieldType === 'number' ? 'parseFloat(this.value)' : 'this.value'})" style="width: 100%; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px;" ${fieldType === 'number' ? 'step="0.1"' : ''}>
                              `}
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            
            <!-- Right Panel: Logic Rules -->
            <div style="width: 50%; display: flex; flex-direction: column;">
              <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                  <h3 style="margin: 0; color: #1f2937; font-size: 16px;">⚡ Custom Logic Rules</h3>
                  <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Define conditional and complex admission logic</p>
                  <div style="margin-top: 6px; padding: 6px 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px;">
                    <p style="margin: 0; color: #1e40af; font-size: 10px; font-weight: 500;">💡 Tip: Click on examples within each rule to auto-populate fields</p>
                  </div>
                </div>
                <button onclick="addNewLogicRule()" style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">+ Add Rule</button>
              </div>
              <div style="flex: 1; overflow-y: auto; padding: 16px;">
                <div id="logicRulesContainer">
                  ${Object.entries(programConfig.logicRules || {}).map(([ruleId, rule]) => {
                    const ruleType = window.logicRuleTypes.find(type => type.id === rule.type) || window.logicRuleTypes[0];
                    return generateLogicRuleHtml(ruleId, rule, ruleType);
                  }).join('')}
                  ${Object.keys(programConfig.logicRules || {}).length === 0 ? `
                    <div style="text-align: center; color: #6b7280; padding: 20px;">
                      <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
                      <p style="margin: 0; font-size: 13px;">No logic rules defined yet</p>
                      <p style="margin: 4px 0 0; font-size: 11px;">Click "Add Rule" to create custom admission logic</p>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
          
          <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: #6b7280;">
              Prerequisites & logic rules are automatically saved
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="testLogicRules()" style="padding: 8px 12px; background: #8b5cf6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🧪 Test Rules</button>
              <button onclick="previewPrerequisitesLogic()" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">👁️ Preview</button>
              <button onclick="closePrerequisitesLogicModal()" style="padding: 8px 12px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    console.log('✅ Prerequisites & Logic modal opened successfully');
    
  } catch (error) {
    console.error('❌ Error opening Prerequisites & Logic modal:', error);
    alert('Error opening Prerequisites & Logic management. Please try again.');
  }
};

// Generate logic rule HTML
function generateLogicRuleHtml(ruleId, rule, ruleType) {
  return `
    <div id="rule_${ruleId}" style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 16px; margin-right: 8px;">${ruleType.icon}</span>
          <span style="font-weight: 500; color: #1f2937; font-size: 13px;">${ruleType.name}</span>
        </div>
        <button onclick="removeLogicRule('${ruleId}')" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 16px; padding: 2px;" title="Remove rule">×</button>
      </div>
      <p style="color: #6b7280; font-size: 11px; margin: 0 0 8px 0;">${ruleType.description}</p>
      
      ${ruleType.examples ? `
        <div style="margin-bottom: 10px; padding: 8px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px;">
          <div style="font-size: 10px; font-weight: 500; color: #0369a1; margin-bottom: 4px;">💡 Examples:</div>
          ${ruleType.examples.map(example => `
            <div style="font-size: 10px; color: #0c4a6e; margin-bottom: 2px; cursor: pointer;" onclick="useExample('${ruleId}', '${example.replace(/'/g, "\\'")}', '${ruleType.id}')" title="Click to use this example">• ${example}</div>
          `).join('')}
        </div>
      ` : ''}
      
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 11px; font-weight: 500; color: #374151; margin-bottom: 2px;">Rule Type</label>
        <select id="rule_${ruleId}_type" onchange="changeLogicRuleType('${ruleId}', this.value)" style="width: 100%; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px;">
          ${window.logicRuleTypes.map(type => `
            <option value="${type.id}" ${rule.type === type.id ? 'selected' : ''}>${type.name}</option>
          `).join('')}
        </select>
      </div>
      
      <div id="rule_${ruleId}_fields">
        ${Object.entries(ruleType.template).map(([fieldName, defaultValue]) => {
          const currentValue = rule[fieldName] || defaultValue;
          return `
            <div style="margin-bottom: 6px;">
              <label style="display: block; font-size: 11px; font-weight: 500; color: #374151; margin-bottom: 2px;">
                ${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
              ${typeof defaultValue === 'boolean' ? `
                <label style="display: flex; align-items: center; font-size: 11px; color: #6b7280;">
                  <input type="checkbox" id="rule_${ruleId}_${fieldName}" ${currentValue ? 'checked' : ''} onchange="updateLogicRuleField('${ruleId}', '${fieldName}', this.checked)" style="margin-right: 4px; transform: scale(0.9);">
                  Required
                </label>
              ` : `
                <input type="text" id="rule_${ruleId}_${fieldName}" value="${currentValue}" onchange="updateLogicRuleField('${ruleId}', '${fieldName}', this.value)" style="width: 100%; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px;" placeholder="Enter ${fieldName.toLowerCase()}...">
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Update prerequisite configuration
window.updatePrerequisiteConfig = function(categoryId, field, value) {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    if (!programConfig.prerequisites) programConfig.prerequisites = {};
    if (!programConfig.prerequisites[categoryId]) programConfig.prerequisites[categoryId] = {};
    
    programConfig.prerequisites[categoryId][field] = value;
    
    // Handle enabled/disabled state for UI
    if (field === 'enabled') {
      const fieldsContainer = document.getElementById(`prereq_${categoryId}_fields`);
      if (fieldsContainer) {
        fieldsContainer.style.opacity = value ? '1' : '0.5';
        fieldsContainer.style.pointerEvents = value ? 'auto' : 'none';
      }
    }
    
    localStorage.setItem(programKey, JSON.stringify(programConfig));
    console.log(`🔗 Updated prerequisite ${categoryId}.${field}:`, value);
  } catch (error) {
    console.error('❌ Error updating prerequisite config:', error);
  }
};

// Add new logic rule
window.addNewLogicRule = function() {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const ruleId = `rule_${Date.now()}`;
    const defaultRuleType = window.logicRuleTypes[0]; // Use first rule type as default
    
    const newRule = {
      type: defaultRuleType.id,
      ...defaultRuleType.template
    };
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    if (!programConfig.logicRules) programConfig.logicRules = {};
    programConfig.logicRules[ruleId] = newRule;
    
    localStorage.setItem(programKey, JSON.stringify(programConfig));
    
    // Update UI
    const container = document.getElementById('logicRulesContainer');
    const existingEmpty = container.querySelector('div[style*="text-align: center"]');
    if (existingEmpty) existingEmpty.remove();
    
    container.insertAdjacentHTML('beforeend', generateLogicRuleHtml(ruleId, newRule, defaultRuleType));
    
    console.log('✅ Added new logic rule:', ruleId);
  } catch (error) {
    console.error('❌ Error adding logic rule:', error);
  }
};

// Remove logic rule
window.removeLogicRule = function(ruleId) {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    if (programConfig.logicRules && programConfig.logicRules[ruleId]) {
      delete programConfig.logicRules[ruleId];
      localStorage.setItem(programKey, JSON.stringify(programConfig));
      
      // Remove from UI
      const ruleElement = document.getElementById(`rule_${ruleId}`);
      if (ruleElement) ruleElement.remove();
      
      // Show empty state if no rules left
      const container = document.getElementById('logicRulesContainer');
      if (container.children.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: #6b7280; padding: 20px;">
            <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
            <p style="margin: 0; font-size: 13px;">No logic rules defined yet</p>
            <p style="margin: 4px 0 0; font-size: 11px;">Click "Add Rule" to create custom admission logic</p>
          </div>
        `;
      }
      
      console.log('✅ Removed logic rule:', ruleId);
    }
  } catch (error) {
    console.error('❌ Error removing logic rule:', error);
  }
};

// Change logic rule type
window.changeLogicRuleType = function(ruleId, newType) {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const newRuleType = window.logicRuleTypes.find(type => type.id === newType);
    if (!newRuleType) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    if (!programConfig.logicRules || !programConfig.logicRules[ruleId]) return;
    
    // Update rule type and reset fields to template
    programConfig.logicRules[ruleId] = {
      type: newType,
      ...newRuleType.template
    };
    
    localStorage.setItem(programKey, JSON.stringify(programConfig));
    
    // Update UI
    const ruleElement = document.getElementById(`rule_${ruleId}`);
    if (ruleElement) {
      ruleElement.outerHTML = generateLogicRuleHtml(ruleId, programConfig.logicRules[ruleId], newRuleType);
    }
    
    console.log('✅ Changed rule type for', ruleId, 'to', newType);
  } catch (error) {
    console.error('❌ Error changing logic rule type:', error);
  }
};

// Update logic rule field
window.updateLogicRuleField = function(ruleId, field, value) {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    if (!programConfig.logicRules) programConfig.logicRules = {};
    if (!programConfig.logicRules[ruleId]) programConfig.logicRules[ruleId] = {};
    
    programConfig.logicRules[ruleId][field] = value;
    
    localStorage.setItem(programKey, JSON.stringify(programConfig));
    console.log(`🔗 Updated logic rule ${ruleId}.${field}:`, value);
  } catch (error) {
    console.error('❌ Error updating logic rule field:', error);
  }
};

// Test logic rules
window.testLogicRules = function() {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    const prerequisites = programConfig.prerequisites || {};
    const logicRules = programConfig.logicRules || {};
    
    // Create test scenarios
    const testScenarios = [
      { name: 'High-performing Student', gpa: 3.8, hasCoursework: true, hasExperience: true, testScore: 85 },
      { name: 'Average Student', gpa: 3.2, hasCoursework: true, hasExperience: false, testScore: 75 },
      { name: 'Below-average Student', gpa: 2.8, hasCoursework: false, hasExperience: true, testScore: 65 }
    ];
    
    const testResultsHtml = `
      <div id="logicTestModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10004; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8);">
        <div onclick="closeLogicTestModal()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        <div style="position: relative; max-width: 90vw; width: 800px; max-height: 80vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow-y: auto;">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
            <h2 style="margin: 0; color: #1f2937;">🧪 Logic Rules Test Results</h2>
            <button onclick="closeLogicTestModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 20px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
              <p style="margin: 0; color: #1e40af; font-size: 13px;">
                <strong>Test Overview:</strong> Simulating ${testScenarios.length} different student profiles against your admission logic
              </p>
            </div>
            
            ${testScenarios.map(scenario => {
              const results = evaluateStudentAgainstRules(scenario, prerequisites, logicRules);
              return `
                <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="margin: 0; color: #1f2937;">${scenario.name}</h4>
                    <span style="padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; ${results.eligible ? 'background: #10b981; color: white;' : 'background: #ef4444; color: white;'}">
                      ${results.eligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}
                    </span>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 12px; font-size: 12px;">
                    <div>GPA: <strong>${scenario.gpa}</strong></div>
                    <div>Coursework: <strong>${scenario.hasCoursework ? 'Yes' : 'No'}</strong></div>
                    <div>Experience: <strong>${scenario.hasExperience ? 'Yes' : 'No'}</strong></div>
                    <div>Test Score: <strong>${scenario.testScore}</strong></div>
                  </div>
                  
                  ${results.details.length > 0 ? `
                    <div style="margin-top: 12px;">
                      <h5 style="margin: 0 0 6px 0; color: #374151; font-size: 12px;">Evaluation Details:</h5>
                      ${results.details.map(detail => `
                        <div style="padding: 6px 8px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; margin-bottom: 4px; font-size: 11px; color: #6b7280;">
                          ${detail}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
            
            ${Object.keys(prerequisites).length === 0 && Object.keys(logicRules).length === 0 ? `
              <div style="text-align: center; color: #6b7280; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 12px;">🧪</div>
                <h3 style="margin: 0 0 8px 0;">No Rules to Test</h3>
                <p style="margin: 0;">Configure prerequisites and logic rules to see test results here.</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', testResultsHtml);
    
    console.log('✅ Logic test modal opened successfully');
  } catch (error) {
    console.error('❌ Error testing logic rules:', error);
  }
};

// Evaluate student against rules
function evaluateStudentAgainstRules(student, prerequisites, logicRules) {
  const details = [];
  let eligible = true;
  
  // Check prerequisites
  Object.entries(prerequisites).forEach(([prereqId, prereq]) => {
    if (!prereq.enabled) return;
    
    switch (prereqId) {
      case 'gpa_requirements':
        if (prereq.minimumGPA && student.gpa < prereq.minimumGPA) {
          eligible = false;
          details.push(`❌ GPA requirement not met: ${student.gpa} < ${prereq.minimumGPA}`);
        } else if (prereq.minimumGPA) {
          details.push(`✅ GPA requirement met: ${student.gpa} >= ${prereq.minimumGPA}`);
        }
        break;
      
      case 'academic_coursework':
        if (prereq.courses && !student.hasCoursework) {
          eligible = false;
          details.push(`❌ Required coursework not completed`);
        } else if (prereq.courses) {
          details.push(`✅ Required coursework completed`);
        }
        break;
      
      case 'work_experience':
        if (prereq.yearsRequired > 0 && !student.hasExperience) {
          eligible = false;
          details.push(`❌ Work experience requirement not met`);
        } else if (prereq.yearsRequired > 0) {
          details.push(`✅ Work experience requirement satisfied`);
        }
        break;
      
      case 'language_proficiency':
        if (prereq.minimumScore && student.testScore < prereq.minimumScore) {
          eligible = false;
          details.push(`❌ Language test score too low: ${student.testScore} < ${prereq.minimumScore}`);
        } else if (prereq.minimumScore) {
          details.push(`✅ Language test score sufficient: ${student.testScore} >= ${prereq.minimumScore}`);
        }
        break;
    }
  });
  
  // Apply logic rules
  Object.entries(logicRules).forEach(([ruleId, rule]) => {
    switch (rule.type) {
      case 'conditional_requirement':
        if (rule.condition && rule.requirement) {
          const conditionMet = evaluateCondition(rule.condition, student);
          if (conditionMet) {
            details.push(`🔄 Conditional rule triggered: ${rule.condition} → ${rule.requirement}`);
          }
        }
        break;
      
      case 'either_or':
        if (rule.optionA && rule.optionB) {
          details.push(`⚡ Either/Or rule: Must meet "${rule.optionA}" OR "${rule.optionB}"`);
        }
        break;
    }
  });
  
  return { eligible, details };
}

// Evaluate condition (simplified)
function evaluateCondition(condition, student) {
  condition = condition.toLowerCase();
  if (condition.includes('gpa') && condition.includes('3.5')) {
    return student.gpa >= 3.5;
  }
  if (condition.includes('experience')) {
    return student.hasExperience;
  }
  return true;
}

// Preview prerequisites and logic
window.previewPrerequisitesLogic = function() {
  try {
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    const prerequisites = programConfig.prerequisites || {};
    const logicRules = programConfig.logicRules || {};
    
    const enabledPrereqs = Object.entries(prerequisites).filter(([_, prereq]) => prereq.enabled);
    const activeRules = Object.entries(logicRules);
    
    const previewHtml = `
      <div id="prerequisitesLogicPreview" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10004; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8);">
        <div onclick="closePrerequisitesLogicPreview()" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        <div style="position: relative; max-width: 90vw; width: 700px; max-height: 80vh; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); overflow-y: auto;">
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
            <h2 style="margin: 0; color: #1f2937;">🔗 Prerequisites & Logic Preview: ${selectedProgram}</h2>
            <button onclick="closePrerequisitesLogicPreview()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
          </div>
          <div style="padding: 20px;">
            ${enabledPrereqs.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #dc2626; margin: 0 0 12px 0; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">📚</span> Academic Prerequisites
                </h3>
                ${enabledPrereqs.map(([id, prereq]) => {
                  const categoryName = getPrerequisiteCategoryName(id);
                  return `
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                      <div style="font-weight: 500; color: #991b1b; margin-bottom: 4px;">${categoryName}</div>
                      <div style="color: #7f1d1d; font-size: 13px;">
                        ${formatPrerequisiteDetails(id, prereq)}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            
            ${activeRules.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #8b5cf6; margin: 0 0 12px 0; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">⚡</span> Custom Logic Rules
                </h3>
                ${activeRules.map(([ruleId, rule]) => {
                  const ruleTypeName = getLogicRuleTypeName(rule.type);
                  return `
                    <div style="background: #faf5ff; border: 1px solid #d8b4fe; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                      <div style="font-weight: 500; color: #7c3aed; margin-bottom: 4px;">${ruleTypeName}</div>
                      <div style="color: #6b46c1; font-size: 13px;">
                        ${formatLogicRuleDetails(rule)}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            
            ${enabledPrereqs.length === 0 && activeRules.length === 0 ? `
              <div style="text-align: center; color: #6b7280; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔗</div>
                <h3 style="margin: 0 0 8px 0;">No Prerequisites or Logic Rules</h3>
                <p style="margin: 0;">Configure prerequisites and logic rules to see them here.</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHtml);
  } catch (error) {
    console.error('❌ Error showing prerequisites logic preview:', error);
  }
};

// Helper functions
function getPrerequisiteCategoryName(id) {
  const names = {
    'academic_coursework': 'Academic Coursework',
    'degree_requirements': 'Degree Requirements',
    'gpa_requirements': 'GPA Requirements',
    'work_experience': 'Work Experience',
    'language_proficiency': 'Language Proficiency',
    'technical_skills': 'Technical Skills'
  };
  return names[id] || id;
}

function getLogicRuleTypeName(type) {
  const names = {
    'conditional_requirement': 'Conditional Requirement',
    'either_or': 'Either/Or Logic',
    'progressive_requirement': 'Progressive Requirement',
    'exception_rule': 'Exception Rule'
  };
  return names[type] || type;
}

function formatPrerequisiteDetails(id, prereq) {
  const details = [];
  
  switch (id) {
    case 'gpa_requirements':
      if (prereq.minimumGPA) details.push(`Minimum GPA: ${prereq.minimumGPA} (${prereq.scale || '4.0'} scale)`);
      if (prereq.lastTwoYears) details.push('Applied to last two years only');
      if (prereq.majorGPA) details.push('Major GPA considered separately');
      break;
    
    case 'academic_coursework':
      if (prereq.courses) details.push(`Required courses: ${prereq.courses}`);
      if (prereq.creditHours > 0) details.push(`Credit hours: ${prereq.creditHours}`);
      if (prereq.minimumGrade) details.push(`Minimum grade: ${prereq.minimumGrade}`);
      break;
    
    case 'work_experience':
      if (prereq.yearsRequired > 0) details.push(`${prereq.yearsRequired} years required`);
      if (prereq.fieldRelevant) details.push('Must be field-relevant');
      if (prereq.internships) details.push('Internships accepted');
      break;
  }
  
  return details.length > 0 ? details.join(' • ') : 'Standard requirements apply';
}

function formatLogicRuleDetails(rule) {
  const details = [];
  
  if (rule.condition) details.push(`Condition: ${rule.condition}`);
  if (rule.requirement) details.push(`Then: ${rule.requirement}`);
  if (rule.optionA) details.push(`Option A: ${rule.optionA}`);
  if (rule.optionB) details.push(`Option B: ${rule.optionB}`);
  if (rule.baseRequirement) details.push(`Base: ${rule.baseRequirement}`);
  
  return details.length > 0 ? details.join(' • ') : 'Rule configured';
}

// Close modal functions
window.closePrerequisitesLogicModal = function() {
  const modal = document.getElementById('prerequisitesLogicModal');
  if (modal) modal.remove();
};

window.closePrerequisitesLogicPreview = function() {
  const modal = document.getElementById('prerequisitesLogicPreview');
  if (modal) modal.remove();
};

window.closeLogicTestModal = function() {
  const modal = document.getElementById('logicTestModal');
  if (modal) modal.remove();
};

// Use example to populate rule fields
window.useExample = function(ruleId, example, ruleType) {
  try {
    console.log('🔄 Using example for rule:', ruleId, example);
    
    const selectedProgram = window.currentSelectedProgram;
    if (!selectedProgram) return;
    
    const programKey = `admission_config_${selectedProgram.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let programConfig = JSON.parse(localStorage.getItem(programKey) || '{}');
    
    if (!programConfig.logicRules) programConfig.logicRules = {};
    if (!programConfig.logicRules[ruleId]) programConfig.logicRules[ruleId] = {};
    
    // Parse example and populate fields based on rule type
    switch (ruleType) {
      case 'conditional_requirement':
        if (example.includes('If ') && example.includes(', then ')) {
          const parts = example.split(', then ');
          const condition = parts[0].replace('If ', '');
          const requirement = parts[1];
          
          programConfig.logicRules[ruleId].condition = condition;
          programConfig.logicRules[ruleId].requirement = requirement;
          programConfig.logicRules[ruleId].alternative = '';
          
          // Update UI
          const conditionField = document.getElementById(`rule_${ruleId}_condition`);
          const requirementField = document.getElementById(`rule_${ruleId}_requirement`);
          if (conditionField) conditionField.value = condition;
          if (requirementField) requirementField.value = requirement;
        }
        break;
      
      case 'either_or':
        if (example.includes(' OR ')) {
          const parts = example.split(' OR ');
          const optionA = parts[0];
          const optionB = parts[1] || '';
          
          programConfig.logicRules[ruleId].optionA = optionA;
          programConfig.logicRules[ruleId].optionB = optionB;
          programConfig.logicRules[ruleId].optionC = '';
          
          // Update UI
          const optionAField = document.getElementById(`rule_${ruleId}_optionA`);
          const optionBField = document.getElementById(`rule_${ruleId}_optionB`);
          if (optionAField) optionAField.value = optionA;
          if (optionBField) optionBField.value = optionB;
        }
        break;
      
      case 'progressive_requirement':
        if (example.includes(' = ')) {
          const parts = example.split(' = ');
          const scaleFactor = parts[0];
          const baseRequirement = parts[1] || example;
          
          programConfig.logicRules[ruleId].baseRequirement = baseRequirement;
          programConfig.logicRules[ruleId].scaleFactor = scaleFactor;
          programConfig.logicRules[ruleId].minimum = '';
          programConfig.logicRules[ruleId].maximum = '';
          
          // Update UI
          const baseField = document.getElementById(`rule_${ruleId}_baseRequirement`);
          const scaleField = document.getElementById(`rule_${ruleId}_scaleFactor`);
          if (baseField) baseField.value = baseRequirement;
          if (scaleField) scaleField.value = scaleFactor;
        }
        break;
      
      case 'exception_rule':
        if (example.includes('Waive ') && example.includes(' for ')) {
          const parts = example.split(' for ');
          const affectedRequirements = parts[0].replace('Waive ', '');
          const exceptionCondition = parts[1] || '';
          
          programConfig.logicRules[ruleId].exceptionCondition = exceptionCondition;
          programConfig.logicRules[ruleId].affectedRequirements = affectedRequirements;
          programConfig.logicRules[ruleId].approvalRequired = true;
          
          // Update UI
          const conditionField = document.getElementById(`rule_${ruleId}_exceptionCondition`);
          const affectedField = document.getElementById(`rule_${ruleId}_affectedRequirements`);
          const approvalField = document.getElementById(`rule_${ruleId}_approvalRequired`);
          if (conditionField) conditionField.value = exceptionCondition;
          if (affectedField) affectedField.value = affectedRequirements;
          if (approvalField) approvalField.checked = true;
        }
        break;
    }
    
    // Save to localStorage
    localStorage.setItem(programKey, JSON.stringify(programConfig));
    
    console.log('✅ Example applied successfully');
    
  } catch (error) {
    console.error('❌ Error applying example:', error);
  }
};