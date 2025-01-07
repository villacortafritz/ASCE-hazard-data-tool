// validation.js - Enhanced Input Validation for Hazard Tool

// Validation Rules
const validStandards = ['7-10', '7-16', '7-22', '41-17'];
const validRiskLevels = ['1', '2', '3', '4'];
const validSiteClasses = {
  '7-10': ['A', 'B', 'C', 'D', 'E', 'F'],
  '7-16': ['A', 'B', 'C', 'D', 'E', 'F', 'B-estimated', 'D-default', 'BC', 'DE'],
  '7-22': ['A', 'B', 'C', 'D', 'E', 'B-estimated', 'D-default', 'BC', 'CD', 'DE', 'Default'],
  '41-17': ['A', 'B', 'C', 'D', 'E', 'F']
};

// Validate Each Row
function validateRow(row, index) {
  const errors = [];

  // Column Count Validation
  if (!row.latitude || !row.longitude || !row.standards || !row.risk || !row.siteClass) {
    errors.push(`Row ${index + 1}: Missing required columns. Ensure all 5 columns are filled (Latitude, Longitude, Standards, Risk, Site Class).`);
    return errors; // Skip further validation if columns are missing
  }

  // Latitude Validation (-90 to 90)
  const latitude = parseFloat(row.latitude);
  if (isNaN(latitude)) {
    errors.push(`Row ${index + 1}: Latitude is missing or not a number.`);
  } else if (latitude < -90 || latitude > 90) {
    errors.push(`Row ${index + 1}: Invalid latitude (${row.latitude}). Must be between -90 and 90.`);
  }

  // Longitude Validation (-180 to 180)
  const longitude = parseFloat(row.longitude);
  if (isNaN(longitude)) {
    errors.push(`Row ${index + 1}: Longitude is missing or not a number.`);
  } else if (longitude < -180 || longitude > 180) {
    errors.push(`Row ${index + 1}: Invalid longitude (${row.longitude}). Must be between -180 and 180.`);
  }

  // Standards Version Validation
  if (!validStandards.includes(row.standards)) {
    errors.push(`Row ${index + 1}: Invalid standards version (${row.standards}). Allowed values: ${validStandards.join(', ')}.`);
  }

  // Risk Level Validation
  if (!validRiskLevels.includes(row.risk)) {
    errors.push(`Row ${index + 1}: Invalid risk level (${row.risk}). Allowed values: ${validRiskLevels.join(', ')}.`);
  }

  // Site Class Validation (depends on standards version)
  const siteClasses = validSiteClasses[row.standards];
  if (!siteClasses || !siteClasses.includes(row.siteClass)) {
    errors.push(`Row ${index + 1}: Invalid site class (${row.siteClass}) for standards version ${row.standards}. Allowed values: ${siteClasses ? siteClasses.join(', ') : 'None'}.`);
  }

  return errors;
}

// Validate All Rows
function validateData(data) {
  const errors = [];

  data.forEach((row, index) => {
    const rowErrors = validateRow(row, index);
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    }
  });

  return errors;
}

// Export Validation Function
function validateInputData(inputData) {
  const errors = validateData(inputData);

  // Disable process button if errors exist
  const processButton = document.getElementById('processButton');
  processButton.disabled = errors.length > 0;

  // Hide output table if errors exist
  const outputTable = document.getElementById('outputTable');
  outputTable.style.display = errors.length > 0 ? 'none' : 'table';

  // Display errors in error message section
  const errorMessages = document.getElementById('errorMessages');
  errorMessages.innerHTML = '';
  if (errors.length > 0) {
    errors.forEach(error => {
      const errorElement = document.createElement('p');
      errorElement.textContent = error;
      errorMessages.appendChild(errorElement);
    });
  }

  return errors;
}