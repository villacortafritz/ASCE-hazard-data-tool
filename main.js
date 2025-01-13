// main.js - Core Logic for Hazard Tool with API Integration

// Global Variables
let inputData = [];
let processedData = [];
let mockApiUsageCount = 0; // Mock API call counter

// API Toggle
const useMockData = true; // Switch between mock data and real API data for testing purpossssessss

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
  templateContent += 'Latitude,Longitude,Standards,Risk,SiteClass\n'; // CSV headers
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


// Enable Process Button When File is Uploaded alsoooo check if the file is CCSVVV
csvFileInput.addEventListener('change', () => {
  const file = csvFileInput.files[0];
  if (file && file.name.endsWith('.csv')) {
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

  const file = csvFileInput.files[0];
  const reader = new FileReader();

  // Tessst if loading spinnner will shows
  toggleLoading(true);

  reader.onload = async (event) => {
    const text = event.target.result;
    inputData = parseCSV(text);
    console.log('Parsed CSV Data:', inputData); // Check if parseCSV really works

    // Validate Input Data
    const errors = validateInputData(inputData);
    console.log('Validation Errors:', errors); // Check if validateInputData really works

    if (errors.length > 0) {
      toggleLoading(false); // Hide spinner if validation fails
      showValidationErrors(errors); // Show detailed validation errors
      processButton.disabled = false; // Re-enable button for retry
      return; // Stop processing on validation failure
    }

    // Clear error messages if processing is successful
    errorMessages.innerHTML = '';
    errorMessages.style.display = 'none';

    // Real processing of data begins heeeeerreeeeee
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
        updateApiUsage('Current Usage:', mockApiUsageCount);
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
async function fetchAllHazardData(latitude, longitude, standards, riskLevel) {
  const apiKey = 'f544df5b-572d-47e6-aeba-a661f4788dbd'; // API Key
  const endpoint = `https://vt8pmhgbpp.us-east-1.awsapprunner.com/api/hazards`;

  toggleLoading(true);

  try {
    const response = await fetch(`${endpoint}?latitude=${latitude}&longitude=${longitude}&standards=${standards}&risk=${riskLevel}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Check if the API response is not successful
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    // Parse the JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    // Log and rethrow the error for higher-level handling
    console.error('API call failed:', error);
    toggleLoading(false); // Hide spinner
    processButton.disabled = false; // Enable button for retry
    throw error;

  } finally {
    // Always hide the spinner!!!!!!! regardless of success or failure
    toggleLoading(false);
  }
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
 
  console.log('Errors to Display:', errors); ////check if showvalidationerrors really works
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
    // Show tspinneress
    spinner.classList.add('active');
  } else {
    // Add a delay before hiding the spinner
    setTimeout(() => {
      spinner.classList.remove('active');
    }, 1000); // Delay of 1000ms
  }
}

