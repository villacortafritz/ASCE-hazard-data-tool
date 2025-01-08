// main.js - Core Logic for Hazard Tool with API Integration

// Global Variables
let inputData = [];
let processedData = [];
let mockApiUsageCount = 0; // Mock API call counter

// API Toggle - Mock vs Real Data
const useMockData = true; // Toggle to switch between mock data and real API data

// File Upload and Processing
const csvFileInput = document.getElementById('csvFile');
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const errorMessages = document.getElementById('errorMessages');
const outputTable = document.getElementById('outputTable');
const outputSection = document.getElementById('outputSection');
const apiUsageDisplay = document.getElementById('apiUsage');

// Enable Process Button When File is Uploaded
csvFileInput.addEventListener('change', () => {
  const file = csvFileInput.files[0];
  if (file && file.name.endsWith('.csv')) {
    processButton.disabled = false;
  } else {
    processButton.disabled = true;
    showError('Invalid file type. Please upload a .csv file.');
  }
});

// Process Button Click Event
processButton.addEventListener('click', async () => {
  const file = csvFileInput.files[0];
  const reader = new FileReader();

  reader.onload = async (event) => {
    const text = event.target.result;
    inputData = parseCSV(text);

    // Validate Input Data
    const errors = validateInputData(inputData);
    if (errors.length > 0) {
      toggleLoading(false);
      showValidationErrors(errors); // Show detailed validation errors
      processButton.disabled = false; // Re-enable button for retry
      return; // Stop processing on validation failure
    }

    // Process Data
    processedData = [];
    for (const row of inputData) {
      try {
        const data = useMockData ? generateMockData() : await fetchAllHazardData(row.latitude, row.longitude, row.standards, row.risk);
        if (!data) {
          throw new Error('No data returned from API.');
        }
        // Flatten and push data
        processedData.push({
          latitude: row.latitude,
          longitude: row.longitude,
          standards: row.standards,
          risk: row.risk,
          siteClass: row.siteClass,
          seismic: data.seismic?.value || 'N/A',
          wind: data.wind?.value || 'N/A',
          snow: data.snow?.value || 'N/A',
          ice: data.ice?.value || 'N/A',
          rain: data.rain?.value || 'N/A',
          flood: data.flood?.value || 'N/A',
          tsunami: data.tsunami?.value || 'N/A',
          tornado: data.tornado?.value || 'N/A',
          responseCode: data.responseCode || 'N/A'
        });

        // Update API Usage Counter
        mockApiUsageCount++;
        updateApiUsage('Jan', mockApiUsageCount);
      } catch (error) {
        console.error('Error processing row:', error);
        showError(`Error processing row: ${error.message}`);
        processButton.disabled = false; // Re-enable button for retry
        return; // Stop processing on failure
      }
    }

    // Display Results
    displayResults();
    processButton.disabled = false; // Re-enable button after success
  };

  reader.readAsText(file);
});

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

// Update API Usage Display
function updateApiUsage(month, count) {
  apiUsageDisplay.textContent = `API Requests (${month}): ${count}`;
}

// Download Processed Data
downloadButton.addEventListener('click', () => {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Latitude,Longitude,Standards,Risk,SiteClass,Seismic,Wind,Snow,Ice,Rain,Flood,Tsunami,Tornado,ResponseCode\n';

  processedData.forEach(row => {
    csvContent += `${row.latitude},${row.longitude},${row.standards},${row.risk},${row.siteClass},${row.seismic},${row.wind},${row.snow},${row.ice},${row.rain},${row.flood},${row.tsunami},${row.tornado},${row.responseCode}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'AWM-Hazard-Results.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
