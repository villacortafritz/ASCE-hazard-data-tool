// main.js - Core Logic for Hazard Tool

// Global Variables
let inputData = [];
let processedData = [];

// File Upload and Processing
const csvFileInput = document.getElementById('csvFile');
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const errorMessages = document.getElementById('errorMessages');
const outputTable = document.getElementById('outputTable');

// Enable Process Button When File is Uploaded
csvFileInput.addEventListener('change', () => {
  const file = csvFileInput.files[0];
  if (file && file.name.endsWith('.csv')) {
    processButton.disabled = false; // Enable process button
  } else {
    processButton.disabled = true; // Disable if invalid file
    showError('Invalid file type. Please upload a .csv file.');
  }
});

// Process CSV File
processButton.addEventListener('click', () => {
  const file = csvFileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const text = event.target.result;
    parseCSV(text);
  };

  reader.readAsText(file);
});

// Parse CSV File
function parseCSV(data) {
  const rows = data.split('\n');
  inputData = [];
  errorMessages.innerHTML = '';

  // Parse each row
  rows.forEach((row, index) => {
    const columns = row.split(',');
    if (columns.length === 5) { // Ensure 5 columns exist
      inputData.push({
        latitude: columns[0].trim(),
        longitude: columns[1].trim(),
        standards: columns[2].trim(),
        risk: columns[3].trim(),
        siteClass: columns[4].trim()
      });
    } else {
      showError(`Row ${index + 1}: Incorrect number of columns.`);
    }
  });

  // Process mock API call after parsing
  processMockAPI();
}

// Simulate Mock API Call
function processMockAPI() {
  processedData = inputData.map((row) => {
    return {
      ...row,
      seismic: Math.random().toFixed(2),
      wind: Math.random().toFixed(2),
      snow: Math.random().toFixed(2),
      ice: Math.random().toFixed(2),
      rain: Math.random().toFixed(2),
      flood: Math.random().toFixed(2),
      tsunami: Math.random().toFixed(2),
      tornado: Math.random().toFixed(2),
      responseCode: 200 // Mock success code
    };
  });

  displayResults();
  downloadButton.disabled = false; // Enable download button
}

// Display Results in Table
function displayResults() {
  const tbody = outputTable.querySelector('tbody');
  tbody.innerHTML = '';
  outputTable.style.display = 'table';

  processedData.forEach((row) => {
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
}

// Download Processed CSV
downloadButton.addEventListener('click', () => {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Latitude,Longitude,Standards,Risk Level,Site Class,Seismic,Wind,Snow,Ice,Rain,Flood,Tsunami,Tornado,Response Code\n';

  processedData.forEach((row) => {
    csvContent += `${row.latitude},${row.longitude},${row.standards},${row.risk},${row.siteClass},${row.seismic},${row.wind},${row.snow},${row.ice},${row.rain},${row.flood},${row.tsunami},${row.tornado},${row.responseCode}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'AWM-Hazard-Tool-Output.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Show Error Messages
function showError(message) {
  const error = document.createElement('p');
  error.textContent = message;
  errorMessages.appendChild(error);
}
