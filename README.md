# AWM Hazard Data Tool

Web-based CSV tool to validate location inputs and fetch ASCE hazard parameters (seismic, wind, snow, ice, rain, flood, tsunami, tornado). Upload a CSV, validate against rules, retrieve data via API (or generate mock data), view results in a table, and download an enriched CSV.

## Features

- Upload CSV of locations with standards/risk/site class
- Client-side validation of inputs to avoid bad API calls
- Toggle between real API and mock data
- Progress spinner, error panel, and request counter
- Download results as a timestamped CSV

## Quick Start

1. Open `index.html` in a modern browser (no server required).
2. Click “Download Template,” fill rows, and save as `.csv`.
3. Upload the CSV and click “Process.”
4. Review results and click “Download CSV.”

## CSV Format

The tool reads the first row as a header and parses by column position (header names are not required but are recommended).

Columns (in order):

1) Latitude
2) Longitude
3) Standards Version (allowed: `7-10`, `7-16`, `7-22`, `41-17`)
4) Risk Level (allowed: `1`, `2`, `3`, `4`)
5) Site Class (depends on Standards Version)

Site Class rules:

- 7-10, 41-17: A, B, C, D, E, F
- 7-16: A, B, C, D, E, F, B-estimated, D-default, BC, DE
- 7-22: A, B, C, D, E, B-estimated, D-default, BC, CD, DE, Default

Sample files: `AWM-Hazard-Tool-Template.csv`, `Solar_Farms_CSV.csv`, and `Error_Test_CSV.csv` (with corresponding `Error_Reasons.txt`).

## Real API vs. Mock Data

- Toggle in `main.js`: set `useMockData = false` to call the API.
- Endpoint: `https://vt8pmhgbpp.us-east-1.awsapprunner.com/api/hazards`
- Auth: Bearer token in request headers.

Important: The included API key in `main.js` is visible to anyone loading the page. For production, proxy API calls through a backend you control and store keys securely.

## Validation Rules

- Latitude: -90 to 90 (numeric)
- Longitude: -180 to 180 (numeric)
- Standards Version: one of `7-10`, `7-16`, `7-22`, `41-17`
- Risk Level: one of `1`, `2`, `3`, `4`
- Site Class: must match set allowed for the chosen Standards Version

Validation is implemented in `validation.js`. Errors are displayed before any API call is attempted.

## UI Notes

- The header shows a “Requests” counter. It increments per processed row. When using the real API, this equals the number of API requests.
- The loading spinner overlays the page during processing.
- The error panel summarizes validation or processing errors.

## Development

- Core logic: `main.js`
- Validation: `validation.js`
- UI: `index.html`, `style.css`

Common tweaks:

- Change default behavior: set `useMockData` in `main.js`.
- Adjust CSV template headers: see `downloadTemplateButton` handler in `main.js`.
- Adjust download CSV headers: see the `downloadButton` click handler.

## Known Limitations

- CSV parser is simple (splits on commas). It does not support quoted fields containing commas.
- API key exposure in client-side code is not secure for production.

## License

Internal/Private project (no explicit license file). If you plan to open source, add a license file.
