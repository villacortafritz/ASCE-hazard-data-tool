
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const errorMessages = document.getElementById('errorMessages');
const outputTable = document.getElementById('outputTable').getElementsByTagName('thead')[0];
const outputBody = document.getElementById('outputTable').getElementsByTagName('tbody')[0];

// Will hold all the data from the uploaded CSV file
let csvData = [];

// Hazard types
const hazardTypes = [
  'seismic', 'wind', 'snow', 'ice', 'rain', 'flood', 'tsunami', 'tornado'
];

// Listen for file uploads
document.getElementById('csvFile').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0]; // Grab the uploaded file

  // Check if it's a CSV
  if (file && file.name.endsWith('.csv')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result; // Read the file content
      processCSV(content); // Process
    };
    reader.readAsText(file); // Read the file as plain text
  } else {
    showError('Invalid file format. Please upload a .csv file.'); //NOOOOOOOOOOO CSV
  }
}

// Parse the CSV content and validate it
function processCSV(content) {
  const rows = content.split('\n'); // Split by lines
  csvData = [];
  clearErrors(); 
  let hasErrors = false; 

  rows.forEach((row, index) => {
    // Skip the first row (assumes header exists)
    if (index === 0) return;

    //check if it's blank row and skip it
    if (row.trim() === '') return;

    const columns = row.split(','); // Split each row by commas

    // Make sure we only have two columns
    if (columns.length === 2) {
      const lat = parseFloat(columns[0].trim()); // Latitude tired tiured tired teired
      const lon = parseFloat(columns[1].trim()); // Longitude

      // Validate the coordinates
      if (isValidCoordinate(lat, lon)) {
        csvData.push({ lat, lon, hazardData: {} }); // Add hazardData placeholder for download asdasd
      } else {
        hasErrors = true;
        showError(`Row ${index + 1}: Invalid latitude or longitude.`); // Flag bad rows
      }
    } else {
      hasErrors = true;
      showError(`Row ${index + 1}: Incorrect number of columns.`); // WHYYYYYYYYYYYY
    }
  });

  processButton.disabled = hasErrors; // Disable button if errors exist
}

// Check if coordinates are legit
function isValidCoordinate(lat, lon) {
  return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Display errors
function showError(message) {
  const error = document.createElement('p');
  error.textContent = message;
  errorMessages.appendChild(error);
}

// Clear all errors because...why keep bad news around?
function clearErrors() {
  errorMessages.innerHTML = '';
}

// Process the data when the button is clicked
processButton.addEventListener('click', () => {
  // Uncomment the next line for real API call when feeling brave
  // fetchHazardDataWithColumns();

  // For now, let's keep it fake and safe
  fetchMockHazardDataWithColumns();
});

// Function to dynamically create table headers for hazard types
function createTableHeaders() {
  const headerRow = outputTable.querySelector('tr');
  headerRow.innerHTML = '<th>Latitude</th><th>Longitude</th>';
  hazardTypes.forEach(type => {
    headerRow.innerHTML += `<th>${type}</th>`;
  });
}

// Mock API with dynamic columns
function fetchMockHazardDataWithColumns() {
  clearTable();
  createTableHeaders();
  csvData.forEach((row, index) => {
    const mockData = {};
    hazardTypes.forEach(type => {
      mockData[type] = Math.random().toFixed(2); // Random fake data for each hazard type
    });
    appendToTable(row.lat, row.lon, mockData); // Show the fake data in the table
    csvData[index].hazardData = mockData; // Attach data for CSV download
  });
  downloadButton.disabled = false; // Enable download button
}

// Real API function with dynamic columns
function fetchHazardDataWithColumns() {
  clearTable();
  createTableHeaders();
  const apiKey = 'f544df5b-572d-47e6-aeba-a661f4788dbd';
  const promises = csvData.map((row, index) => {
    const url = `https://vt8pmhgbpp.us-east-1.awsapprunner.com/api/hazards?lat=${row.lat}&lon=${row.lon}`;
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })
      .then(response => response.json())
      .then(data => {
        appendToTable(row.lat, row.lon, data);
        csvData[index].hazardData = data; // Attach real API data for CSV download
      })
      .catch(() => showError(`Failed to fetch data for ${row.lat}, ${row.lon}`));
  });
  Promise.all(promises).then(() => downloadButton.disabled = false);
}

// Add rows to the website table
function appendToTable(lat, lon, data) {
  const row = outputBody.insertRow();
  row.insertCell(0).textContent = lat;
  row.insertCell(1).textContent = lon;
  hazardTypes.forEach(type => {
    row.insertCell(-1).textContent = data[type] || 'N/A';
  });
}

// Clear table content
function clearTable() {
  outputBody.innerHTML = '';
}

// Download the results as a CSV file
downloadButton.addEventListener('click', () => {
  const csvContent = [
    ['Latitude', 'Longitude', ...hazardTypes].join(',')
  ];
  csvData.forEach(row => {
    const values = [row.lat, row.lon];
    hazardTypes.forEach(type => {
      values.push(row.hazardData[type] || 'N/A'); // Fetch data for download
    });
    csvContent.push(values.join(','));
  });

  const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Add timestamp to filename
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
  link.download = `hazard_data_${timestamp}.csv`;

  link.href = url;
  link.click();
});
