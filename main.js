// main.js - Core Logic for Hazard Tool with API Integration

// Global Variables
let inputData = [];
let processedData = [];
let requestCount = 0; // API requests (or rows processed in mock mode)

// API Toggle
const useMockData = true; // Switch between mock data and real API data for testing purposes

const csvFileInput = document.getElementById('csvFile');
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const errorMessages = document.getElementById('errorMessages');
const outputTable = document.getElementById('outputTable');
const outputSection = document.getElementById('outputSection');
const apiUsageDisplay = document.getElementById('apiUsage');
const downloadTemplateButton = document.getElementById('downloadTemplateButton');

downloadTemplateButton.addEventListener('click', () => {
  // Define the CSV template content
  let templateContent = 'data:text/csv;charset=utf-8,';
  // Standardize headers to match examples and instructions
  templateContent += 'Latitude,Longitude,Standards Version,Risk Level,Site Class\n';
  templateContent += '40.7128,-74.0060,7-22,1,B\n'; // Example row (optional)

  // Encode the CSV content
  const encodedUri = encodeURI(templateContent);

  // Create a temporary anchor element for the download
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'AWM-Hazard-Template.csv'); // File name
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});


// Enable Process Button when a CSV file is chosen
csvFileInput.addEventListener('change', () => {
  const file = csvFileInput.files[0];
  // Accept files with a .csv extension regardless of case
  if (file && file.name.toLowerCase().endsWith('.csv')) {
    processButton.disabled = false;
    downloadButton.disabled = true;

    // Clear error messages
    errorMessages.innerHTML = '';
    errorMessages.style.display = 'none';
  } else {
    processButton.disabled = true;
    showError('Invalid file type. Please upload a .csv file.');
  }
});

// Process Button Click Event
processButton.addEventListener('click', async () => {

  // Clear previous error messages
  errorMessages.innerHTML = '';
  errorMessages.style.display = 'none';

  // Prevent double submissions during processing
  processButton.disabled = true;

  const file = csvFileInput.files[0];
  const reader = new FileReader();

  // Show loading spinner during processing
  toggleLoading(true);

  reader.onload = async (event) => {
    const text = event.target.result;
    inputData = parseCSV(text);
    console.log('Parsed CSV Data:', inputData); // Check if parseCSV really works

    // Validate Input Data
    const errors = validateInputData(inputData);
    console.log('Validation Errors:', errors);

    if (errors.length > 0) {
      // Hide spinner and show validation errors
      toggleLoading(false);
      showValidationErrors(errors);
      // Ensure output is hidden if previously shown
      outputTable.style.display = 'none';
      outputSection.style.display = 'none';
      processButton.disabled = false; // Re-enable button for retry
      return; // Stop processing on validation failure
    }

    // Clear error messages if processing is successful
    errorMessages.innerHTML = '';
    errorMessages.style.display = 'none';

    // Real processing of data begins here
    processedData = [];
    for (const row of inputData) {
      try {
        const data = useMockData ? generateMockData() : await fetchAllHazardData(row.latitude, row.longitude, row.standards, row.risk, row.siteClass);
        if (!data) {
          throw new Error('No data returned from API.');
        }
        // Extract hazard values from diverse API shapes
        const seismicVal = extractHazardValue(data.seismic, 'seismic', row.risk);
        const windVal = extractHazardValue(data.wind, 'wind', row.risk);
        const snowVal = extractHazardValue(data.snow, 'snow', row.risk);
        const iceVal = extractHazardValue(data.ice, 'ice', row.risk);
        const rainVal = extractHazardValue(data.rain, 'rain', row.risk);
        const floodVal = extractHazardValue(data.flood, 'flood', row.risk);
        const tsunamiVal = extractHazardValue(data.tsunami, 'tsunami', row.risk);
        const tornadoVal = extractHazardValue(data.tornado, 'tornado', row.risk);

        // Flatten and push data
        processedData.push({
          latitude: row.latitude,
          longitude: row.longitude,
          standards: row.standards,
          risk: row.risk,
          siteClass: row.siteClass,
          seismic: seismicVal,
          wind: windVal,
          snow: snowVal,
          ice: iceVal,
          rain: rainVal,
          flood: floodVal,
          tsunami: tsunamiVal,
          tornado: tornadoVal,
          responseCode: data.responseCode || data?.requestInfo ? 200 : 'N/A'
        });

        // Update usage counter (prefer server-provided count if available)
        const serverCount = data?.requestInfo?.currentMonthlyRequestNumber;
        if (serverCount) {
          updateApiUsage(serverCount);
        } else {
          requestCount++;
          updateApiUsage(requestCount);
        }
      } catch (error) {
        console.error('Error processing row:', error);
        toggleLoading(false); // Hide spinner if processing fails
        showError(`Error processing row: ${error.message}`);
        processButton.disabled = false; // Re-enable button for retry
        return; // Stop processing on failure
      }
    }

    // Display Results
    displayResults();
    processButton.disabled = false; // Re-enable button after success
    toggleLoading(false); // Hide spinner after success
  };

  reader.readAsText(file);
});


// Real API Call Function
async function fetchAllHazardData(latitude, longitude, standards, riskLevel, siteClass) {
  const apiKey = 'f544df5b-572d-47e6-aeba-a661f4788dbd'; // API Key
  const endpoint = `https://vt8pmhgbpp.us-east-1.awsapprunner.com/api/hazards`;

  try {
    // Include siteClass for APIs that need it; keep param names used by the backend
    const url = `${endpoint}?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&standards=${encodeURIComponent(standards)}&risk=${encodeURIComponent(riskLevel)}&siteClass=${encodeURIComponent(siteClass)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Check if the API response is not successful
    if (!response.ok) {
      let detail = '';
      try {
        const errBody = await response.clone().json();
        detail = errBody?.message || errBody?.error || JSON.stringify(errBody);
      } catch (_) {
        try { detail = await response.text(); } catch (_) {}
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}${detail ? ' - ' + String(detail).slice(0,200) : ''}`);
    }

    // Parse the JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    // Log and rethrow the error for higher-level handling
    console.error('API call failed:', error);
    processButton.disabled = false; // Enable button for retry
    throw error;

  }
}

// Extract a single display value from diverse hazard payloads
function extractHazardValue(hazardData, hazardName, riskLevel) {
  if (!hazardData) return 'N/A';

  // Straight scalar pattern: { value: ... }
  if (typeof hazardData === 'object' && hazardData !== null && 'value' in hazardData) {
    return safeValue(hazardData.value);
  }

  // Array-of-key/values pattern: e.g., snow: { snowResults: [{key,value}, ...] }
  const resultsField = Object.keys(hazardData).find(k => k.toLowerCase().endsWith('results') && Array.isArray(hazardData[k]));
  if (resultsField) {
    const items = hazardData[resultsField];
    const riskKey = `riskCategory${String(riskLevel).trim()}`;

    const preferredByHazard = {
      snow: [riskKey, 'mri50yr', 'mri100yr', 'mri20yr'],
      wind: [riskKey, 'Vult', 'ult', 'Vasd', 'asd'],
      seismic: ['SDS', 'SD1', 'Ss', 'S1'],
      ice: ['radialThickness', 'iceThickness'],
      rain: ['100yr', '60min', '24hr', '1hr'],
      flood: ['baseFloodElevation', 'bfe'],
      tsunami: ['amplitude', 'runup'],
      tornado: [riskKey, 'tornadoSpeed']
    };

    const prefs = preferredByHazard[hazardName] || [riskKey];
    for (const key of prefs) {
      const match = items.find(it => String(it.key).toLowerCase() === String(key).toLowerCase());
      if (match && match.value != null && match.value !== '') return safeValue(match.value);
    }

    // Fallback: first numeric-like value
    const firstNumeric = items.find(it => it && it.value != null && isFinite(parseFloat(it.value)));
    if (firstNumeric) return safeValue(firstNumeric.value);
  }

  // Fallback: stringifiable
  if (typeof hazardData === 'string' || typeof hazardData === 'number') return String(hazardData);
  return 'N/A';
}

function safeValue(v) {
  if (v == null) return 'N/A';
  const n = Number(v);
  if (Number.isFinite(n)) return n.toString();
  return String(v);
}


// Mock Data Generator
function generateMockData() {
  return {
    seismic: { value: (Math.random() * 10).toFixed(2) },
    wind: { value: (Math.random() * 100).toFixed(2) },
    snow: { value: (Math.random() * 50).toFixed(2) },
    ice: { value: (Math.random() * 5).toFixed(2) },
    rain: { value: (Math.random() * 200).toFixed(2) },
    flood: { value: (Math.random() * 30).toFixed(2) },
    tsunami: { value: (Math.random() * 3).toFixed(2) },
    tornado: { value: (Math.random() * 2).toFixed(2) },
    responseCode: 200
  };
}

// CSV Parsing
function parseCSV(data) {
  const rows = data.trim().split('\n');
  const parsed = [];

  rows.slice(1).forEach(row => {
    const columns = row.split(',');
    if (columns.length === 5) {
      parsed.push({
        latitude: columns[0].trim(),
        longitude: columns[1].trim(),
        standards: columns[2].trim(),
        risk: columns[3].trim(),
        siteClass: columns[4].trim()
      });
    }
  });
  return parsed;
}

// Show Validation Errors
function showValidationErrors(errors) {
  errorMessages.innerHTML = '';
  errorMessages.style.display = 'block';
  errors.forEach(error => {
    const errorElement = document.createElement('p');
    errorElement.textContent = error;
    errorMessages.appendChild(errorElement);
  });
 
  console.log('Errors to Display:', errors);
  errorMessages.style.display = errors.length > 0 ? 'block' : 'none';

}

// Display Results
function displayResults() {
  const tbody = outputTable.querySelector('tbody');
  tbody.innerHTML = '';
  outputTable.style.display = 'table';
  outputSection.style.display = 'block';

  processedData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.latitude}</td>
      <td>${row.longitude}</td>
      <td>${row.standards}</td>
      <td>${row.risk}</td>
      <td>${row.siteClass}</td>
      <td>${row.seismic}</td>
      <td>${row.wind}</td>
      <td>${row.snow}</td>
      <td>${row.ice}</td>
      <td>${row.rain}</td>
      <td>${row.flood}</td>
      <td>${row.tsunami}</td>
      <td>${row.tornado}</td>
      <td>${row.responseCode}</td>
    `;
    tbody.appendChild(tr);
  });

  downloadButton.disabled = processedData.length === 0;
}

// Update API/Processing Usage Display
function updateApiUsage(count) {
  apiUsageDisplay.textContent = `Requests: ${count}`;
}

// Download Processed Data
downloadButton.addEventListener('click', () => {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Latitude,Longitude,Standards Version,Risk Level,Site Class,Seismic,Wind,Snow,Ice,Rain,Flood,Tsunami,Tornado,ResponseCode\n';

  processedData.forEach(row => {
    csvContent += `${row.latitude},${row.longitude},${row.standards},${row.risk},${row.siteClass},${row.seismic},${row.wind},${row.snow},${row.ice},${row.rain},${row.flood},${row.tsunami},${row.tornado},${row.responseCode}\n`;
  });

  // Generate current date-time for the file name
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').split('.')[0]; // Format: YYYY-MM-DDTHH-MM-SS

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `AWM-Hazard-Results-${timestamp}.csv`); // Append timestamp to the file name
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});


function toggleLoading(isLoading) {
  const spinner = document.getElementById('loadingSpinner');

  if (isLoading) {
    // Show spinner
    spinner.classList.add('active');
  } else {
    // Add a delay before hiding the spinner
    setTimeout(() => {
      spinner.classList.remove('active');
    }, 1000); // Delay of 1000ms
  }
}

// Simple helper to show a single error message
function showError(message) {
  errorMessages.innerHTML = '';
  errorMessages.style.display = 'block';
  const p = document.createElement('p');
  p.textContent = message;
  errorMessages.appendChild(p);
}

