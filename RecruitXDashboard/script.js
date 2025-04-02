const FIREBASE_DB_URL = 'https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/';

function switchTab() {
  const analyticsDiv = document.getElementById("recruitmentAnalytics");
  const jobPostingsDiv = document.getElementById("jobPostings");
  const tabs = document.querySelectorAll(".tab");
  const tabContainer = document.querySelector(".tab-container");
  const articleContainer = document.querySelector(".article-container");
    const footerContainer = document.querySelector("footer");
  const primaryBlue = "#1EBBF0";
  const secondaryBlue = "#C8EAFF";
  const primaryOrange = "#FCB334";
  const secondaryOrange = "#FFE6BB";


  // Determine current active section
  const isAnalyticsActive = !analyticsDiv.classList.contains("hidden");

  // Toggle visibility correctly
  analyticsDiv.classList.toggle("hidden", isAnalyticsActive);
  jobPostingsDiv.classList.toggle("hidden", !isAnalyticsActive);

  // Remove 'active' class from all tabs and set the correct one
  tabs.forEach(tab => tab.classList.remove("active"));
  const activeTab = isAnalyticsActive ? tabs[1] : tabs[0]; // 0 = Analytics, 1 = Job Postings
  activeTab.classList.add("active");

  // Define styles for each tab
  const themes = {
    analytics: {
      body: "#ffffff",
      tabBg: secondaryBlue,
      articleContainerBg: secondaryBlue,
      activeTabBg: primaryBlue,
            footerContainerBg: primaryBlue
    },
    jobPostings: {
      body: "#ffffff",
      tabBg: secondaryOrange,
      articleContainerBg: secondaryOrange,
      activeTabBg: primaryOrange,
            footerContainerBg: primaryOrange
    }
  };

  // Apply the correct theme
  const activeTheme = isAnalyticsActive ? themes.jobPostings : themes.analytics;

  document.body.style.backgroundColor = activeTheme.body;
  tabContainer.style.backgroundColor = activeTheme.tabBg;
  articleContainer.style.backgroundColor = activeTheme.articleContainerBg;
  articleContainer.style.transition = "background-color 0.5s ease-in-out";
    footerContainer.style.backgroundColor = activeTheme.footerContainerBg;
  // Set active tab background color
  activeTab.style.backgroundColor = activeTheme.activeTabBg;

  // Reset inactive tab background to default (transparent or tab container color)
  tabs.forEach(tab => {
    if (!tab.classList.contains("active")) {
      tab.style.backgroundColor = "transparent";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab-container__button").forEach(button => {
    button.addEventListener("click", () => switchTab(button));
  });
  const navigateToTab = localStorage.getItem('navigateToTab');   
  if (navigateToTab === 'jobPostings') {     
    // Find the Job Postings tab button and simulate a click
    const jobPostingsButton = document.querySelector('.tab-container__button:nth-child(2)'); 
    // Assuming Job Postings is the second button
    if (jobPostingsButton) {       
      jobPostingsButton.click();    
    }    
    localStorage.removeItem('navigateToTab'); 
    // Clean up the flag 
    }
});

const jobPostings = async () => {
    // DOM Element references
    const loadingIndicatorElement = document.getElementById("loading-indicator");
    const errorMessageElement = document.getElementById("error-message");
    const locationFilterElement = document.getElementById("location-filter");
    const duFilterElement = document.getElementById("du-filter");
  
  
  
    // Table initialization variable
    let jobTable;
  
    // Initialize UI state: show loading, hide error
    errorMessageElement.style.display = "none";
    loadingIndicatorElement.style.display = "flex";
    // await new Promise(resolve => setTimeout(resolve, 1000))
    /**
     * Retrieves job data from Firebase, filters it, and initializes the table.
     */
    const fetchJobData = async () => {
      try {
        loadingIndicatorElement.style.display = "flex";
        errorMessageElement.style.display = "none";
  
        const response = await axios.get(`${FIREBASE_DB_URL}/jobPostings.json`);
  
        // Data transformation and filtering
        const jobsData = response.data
          ? Object.entries(response.data).map(([id, job]) => ({
              id,
              ...job,
              postedDate: job.posted_date ? new Date(job.posted_date) : null, // Date object conversion
            })).filter((job) => job.job_status === "Open")
          : [];
  
        initializeJobTable(jobsData);
        populateFilterDropdowns(jobsData);
        loadingIndicatorElement.style.display = "none";
      } catch (error) {
        console.error("Error fetching data:", error);
        loadingIndicatorElement.style.display = "none";
        errorMessageElement.style.display = "block";
      }
    };
  
    /**
     * Formats a Date object into an Indian date string (DD-MM-YYYY).
     *
     * @param {Date} date - The Date object to format.
     * @returns {string} The formatted date string.
     */
    const formatIndianDate = (date) => {
      if (!date) return "";
  
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
      const year = date.getFullYear();
  
      return `${day}-${month}-${year}`;
    };
  
    /**
     * Initializes the Tabulator table with job data.
     *
     * @param {Array<object>} data - An array of job objects to display in the table.
     */
    const initializeJobTable = (data) => {
      if (jobTable) {
        console.log("Updating existing job table data...");
        jobTable.setData(data);
        return;
      }
  
      jobTable = new Tabulator("#job-table", {
        data: data,
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 6,
        columns: [
          { title: "ID", field: "id", sorter: "string" },
          { title: "DU", field: "du", sorter: "string" },
          { title: "Position", field: "title", sorter: "string" },
          { title: "Location", field: "location", sorter: "string" },
          {
            title: "Experience",
            field: "experience",
            sorter: (a, b) => {
              // Extract numeric part from experience string
              const numA = parseInt(a.replace("+", "").split(" ")[0], 10);
              const numB = parseInt(b.replace("+", "").split(" ")[0], 10);
  
              // Handle cases where parsing might fail
              if (isNaN(numA) && isNaN(numB)) return 0;
              if (isNaN(numA)) return 1;
              if (isNaN(numB)) return -1;
  
              return numA - numB;
            },
          },
          {
            title: "Date Posted",
            field: "postedDate",
            sorter: (a, b) => {
              // Basic date sorting (can be improved for edge cases)
              if (!a) return -1;
              if (!b) return 1;
              return new Date(a) - new Date(b);
            },
            formatter: (cell) => {
              const dateValue = cell.getValue();
              return formatIndianDate(dateValue);
            },
          },
          {
            title: "Openings",
            field: "openings",
            formatter: (cell) =>
              `<span class="badge badge--primary">${cell.getValue()}</span>`,
          },
          {
            title: "Candidates",
            field: "candidates",
            formatter: (cell) =>
              `<span class="badge badge--info">${cell.getValue()}</span>`,
          },
        ],
    
      });
  
      //Add click event to rows for navigation
      jobTable.on("tableBuilt", () => {
        const rows = jobTable.element.querySelectorAll(".tabulator-row");
        rows.forEach((row) => {
          row.addEventListener("click", function () { // Use a regular function to access 'this'
            console.log("Row clicked:", this);
            const rowData = jobTable.getRow(this).getData();
            const jobId = rowData.id;
            const detailPageURL = `candidates.html?jobId=${jobId}`;
            window.location.href = detailPageURL;
          });
        });
      });
    };
  
    /**
     * Updates the table's filter based on search input and dropdown selections.
     */
    const updateJobFilters = () => {
      const searchValue = document.getElementById("search-input").value.toLowerCase();
      const locationValue = locationFilterElement.value;
      const duValue = duFilterElement.value;
  
      jobTable.setFilter((data) => {
        const matchesSearch =
          !searchValue ||
          Object.keys(data).some((key) => {
            if (data[key] !== null && data[key] !== undefined) {
              return String(data[key]).toLowerCase().includes(searchValue);
            }
            return false;
          });
        const matchesLocation = !locationValue || data.location === locationValue;
        const matchesDU = !duValue || data.du === duValue;
  
        return matchesSearch && matchesLocation && matchesDU;
      });
    };
  
    /**
     * Populates the location and DU filter dropdowns with unique values from the job data.
     *
     * @param {Array<object>} jobsData - An array of job objects.
     */
    const populateFilterDropdowns = (jobsData) => {
      const locations = [...new Set(jobsData.map((job) => job.location))].sort();
      const dus = [...new Set(jobsData.map((job) => job.du))].sort();
  
      // Clear existing options
      locationFilterElement.innerHTML = '<option value="">All Locations</option>';
      duFilterElement.innerHTML = '<option value="">All DUs</option>';
  
      // Add new options
      locations.forEach((location) => {
        const option = document.createElement("option");
        option.value = location;
        option.textContent = location;
        locationFilterElement.appendChild(option);
      });
  
      dus.forEach((du) => {
        const option = document.createElement("option");
        option.value = du;
        option.textContent = du;
        duFilterElement.appendChild(option);
      });
    };
  
    // Event listeners for filter updates
    document.getElementById("search-input").addEventListener("input", updateJobFilters);
    locationFilterElement.addEventListener("change", updateJobFilters);
    duFilterElement.addEventListener("change", updateJobFilters);
  
    // Initial data fetch
    fetchJobData();
  };

function displayNoResults(){
  const errorMessage = document.getElementById("error-msg");
  errorMessage.style.display = "block";
}


let table;
let activeFilters = {};
let sourceOptions = [];
let statusOptions = [];

function calculateAge(dob) {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getJobIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("jobId");
}

async function fetchData() {
  try {
    const response = await axios.get(`${FIREBASE_DB_URL}.json`);
    const data = response.data || {};

    if (!data.candidates || !data.applications) {
      console.error("Invalid data structure received from Firebase");
      displayNoResults();
      return;
    }

    const jobId = getJobIdFromURL(); // Get job ID from URL

    const candidates = Array.isArray(data.candidates) ? data.candidates : Object.values(data.candidates);
    const applications = Array.isArray(data.applications) ? data.applications : Object.values(data.applications).filter(app => app.job_id === jobId);

    const recruitmentData = applications
      .filter(app => app.application_status !== "Hired") // Exclude "Hired" candidates
      .map(app => {
        const candidate = candidates.find(c => c.candidateId === app.candidate_id) || {};
        return {
          candidateId: candidate.candidateId || "N/A",
          firstName: candidate.firstName || "",
          lastName: candidate.lastName || "",
          age: calculateAge(candidate.dob),
          experience: candidate.experience || "N/A",
          application_date: app.application_date || "N/A",
          source: candidate.source || "N/A",
          shortlisted: app.application_status || "Application Received",
          resumeUrl: candidate.resumeUrl || "#"
        };
      });

      if(recruitmentData.length === 0){
        displayNoResults();
      }else{
        renderTabulator(recruitmentData);
      }

  } catch (error) {
    console.error("Error fetching data:", error);
    displayNoResults();
  }
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return new Date(0); // Default to old date if invalid
  const parts = dateStr.split("-");
  return new Date(parts[2], parts[1] - 1, parts[0]); // Convert to (YYYY, MM, DD)
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return "N/A";

  const date = new Date(dateStr);
  if (isNaN(date)) return "Invalid Date";

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function renderTabulator(candidates) {
  table = new Tabulator("#candidate-table", {
      data: candidates,
      layout: "fitColumns",
      columns: [
          { title: "Candidate Id", field: "candidateId", sorter: "string" },
          { title: "Name", field: "firstName", sorter: "string", formatter: (cell) => `${cell.getData().firstName} ${cell.getData().lastName}` },
          { title: "Age", field: "age", sorter: "number" },
          { title: "Experience (Yrs)", field: "experience", sorter: "number" },
          {
              title: "Date Applied", field: "application_date", sorter: (a, b) => {
                  const dateA = parseDate(a);
                  const dateB = parseDate(b);
                  return dateA - dateB;
              },
              formatter: function (cell) {
                  return formatDate(cell.getValue());
              }
          },
          { title: "Source", field: "source", sorter: "string" },
          {
              title: "Resume", field: "resumeUrl", hozAlign: "center", formatter: "link", formatterParams: { label: "View", target: "_blank" }
          },
          {
              title: "Status", field: "shortlisted", hozAlign: "center", editor: "select", editorParams: {
                  values: [
                      "Applications Received", 
                      "Applications Screened", 
                      "Documents collected", 
                      "Technical Interview Completed", 
                      "Management Interview Completed", 
                      "Salary approved",
                      "Job Offered",
                      "Offer accepted"
                  ]
              },
              // , cellEdited: function(cell) {
              //     let updatedData = cell.getData();
              //     axios.patch(`https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/candidates/${updatedData.candidateId}.json`, {
              //         shortlisted: updatedData.shortlisted
              //     }).then(() => console.log("Status updated in database"))
              //     .catch(err => console.error("Error updating status:", err));
              // }
              sorter: (a, b) => {
                  const order = [
                      "Applications Received", 
                      "Applications Screened", 
                      "Documents collected", 
                      "Technical Interview Completed", 
                      "Management Interview Completed", 
                      "Salary approved",
                      "Job Offered",
                      "Offer accepted"
                  ];
                  return order.indexOf(a) - order.indexOf(b);
              }
          }
      ],
      pagination: "local",
      paginationSize: 8,
      movableColumns: true,
  });
  setupExportButtons();
}
function setupExportButtons() {
  // CSV Export
  document.getElementById("export-csv").addEventListener("click", function () {
    table.download("csv", "candidates_data.csv");
  });

  // JSON Export
  document.getElementById("export-json").addEventListener("click", function () {
    table.download("json", "candidates_data.json");
  });

  // Excel Export
  document.getElementById("export-xlsx").addEventListener("click", function () {
    // For Excel export, we need to load the xlsx formatter
    loadXLSXFormatter().then(() => {
      table.download("xlsx", "candidates_data.xlsx", { sheetName: "Candidates" });
    }).catch(err => {
      console.error("Error loading XLSX formatter:", err);
      alert("Failed to load Excel export functionality. Please try again later.");
    });
  });

  // PDF Export
  document.getElementById("export-pdf").addEventListener("click", function () {
    // For PDF export, we need to load the PDF formatter
    loadPDFFormatter().then(() => {
      // Custom PDF export to handle column widths better
      exportToPDF();
    }).catch(err => {
      console.error("Error loading PDF formatter:", err);
      alert("Failed to load PDF export functionality. Please try again later.");
    });
  });
}

// Function to dynamically load XLSX formatter library
function loadXLSXFormatter() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve();
      return;
    }

    // Load SheetJS (xlsx) library
    const xlsxScript = document.createElement('script');
    xlsxScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    xlsxScript.onload = () => resolve();
    xlsxScript.onerror = (err) => reject(err);
    document.head.appendChild(xlsxScript);
  });
}

// Function to dynamically load PDF formatter libraries
function loadPDFFormatter() {
  return new Promise((resolve, reject) => {
    if (window.jspdf && window.jspdf.jsPDF) {
      resolve();
      return;
    }

    // Load jsPDF and its dependencies
    const jsPDFScript = document.createElement('script');
    jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

    jsPDFScript.onload = () => {
      // After jsPDF is loaded, load jspdf-autotable
      const autoTableScript = document.createElement('script');
      autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
      autoTableScript.onload = () => resolve();
      autoTableScript.onerror = (err) => reject(err);
      document.head.appendChild(autoTableScript);
    };

    jsPDFScript.onerror = (err) => reject(err);
    document.head.appendChild(jsPDFScript);
  });
}
function exportToPDF() {
  try {
    // Get table data - ensure we have data to work with
    const tableData = table.getData("active");
    if (!tableData || tableData.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Create a safer version of the data for PDF export
    const pdfData = [];
    const resumeUrls = []; // Store URLs separately to avoid issues in the callback

    // Process data with validation
    tableData.forEach((row, index) => {
      // Store safe URL reference
      resumeUrls[index] = (row && typeof row.resumeUrl === 'string') ? row.resumeUrl : "#";

      // Create safe row object
      pdfData.push({
        candidateId: row.candidateId || "N/A",
        name: `${row.firstName || ""} ${row.lastName || ""}`.trim() || "N/A",
        age: row.age || "N/A",
        experience: row.experience || "N/A",
        application_date: row.application_date || "N/A",
        source: row.source || "N/A",
        resumeIndex: index, // Store index instead of URL
        shortlisted: row.shortlisted || "N/A"
      });
    });

    // Define columns with optimized widths
    const columns = [
      { title: "ID", dataKey: "candidateId", width: 30 },
      { title: "Name", dataKey: "name", width: 50 },
      { title: "Age", dataKey: "age", width: 20 },
      { title: "Exp (Yrs)", dataKey: "experience", width: 25 },
      { title: "Date Applied", dataKey: "application_date", width: 40 },
      { title: "Source", dataKey: "source", width: 40 },
      { title: "Resume", dataKey: "resumeIndex", width: 25 },
      { title: "Status", dataKey: "shortlisted", width: 50 }
    ];

    // Create PDF document
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error("jsPDF library not loaded properly");
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt"
    });

    // Add title
    doc.setFontSize(18);
    doc.text("Candidates Summary", 40, 40);

    // Create the table with custom cell renderers for hyperlinks
    doc.autoTable({
      head: [columns.map(col => col.title)],
      body: pdfData.map(row => {
        return columns.map(col => {
          if (col.dataKey === "resumeIndex") {
            return
          }
          return row[col.dataKey];
        });
      }),
      startY: 60,
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 80 },  // ID
        1: { cellWidth: 120 },  // Name
        2: { cellWidth: 30 },  // Age
        3: { cellWidth: 40 },  // Experience
        4: { cellWidth: 60 },  // Date Applied
        5: { cellWidth: 120 },  // Source
        6: { cellWidth: 40 },  // Resume
        7: { cellWidth: 160 }   // Status
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 60, right: 40, bottom: 40, left: 40 },
      didDrawCell: (data) => {
        try {
          // Add hyperlinks to "View" text in the Resume column
          if (data.section === 'body' && data.column.index === 6) {
            const rowIndex = data.row.index;

            // Verify we have a valid index and URL
            if (rowIndex !== undefined && rowIndex >= 0 && rowIndex < resumeUrls.length) {
              const url = resumeUrls[rowIndex];

              // Only add link if it's a valid URL
              if (url && url !== "#") {
                // Set hyperlink
                doc.link(
                  data.cell.x,
                  data.cell.y,
                  data.cell.width,
                  data.cell.height,
                  { url: url }
                );

                // Optionally, you can style the "View" text to indicate it's a link
                const centerX = data.cell.x + data.cell.width / 2;
                const centerY = data.cell.y + data.cell.height / 2;

                doc.setTextColor(0, 0, 255); // Blue color for links
                doc.setFont(undefined, 'underline');
                doc.text("View", centerX, centerY, { align: "center", baseline: "middle" });
              }
            }
          }
        } catch (err) {
          console.error("Error in PDF cell rendering:", err);
          // Continue rendering the PDF even if there's an error with a specific cell
        }
      }
    });

    // Save the PDF
    doc.save("candidates_data.pdf");

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("There was an error generating the PDF. Please try again.");
  }
}

// Initialize filter functionality after the table is initialized
function initializeFilters() {
  // Cache DOM elements for filters
  const filterModal = document.getElementById('filter-modal');
  const advancedFilterBtn = document.getElementById('advanced-filter-btn');
  const closeModalBtn = document.querySelector('.close-modal-button');
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const activeFiltersCount = document.getElementById('active-filters-count');

  // Setup event listeners
  advancedFilterBtn.addEventListener('click', openFilterModal);
  closeModalBtn.addEventListener('click', closeFilterModal);
  applyFiltersBtn.addEventListener('click', applyFilters);
  resetFiltersBtn.addEventListener('click', resetFilters);
  clearFiltersBtn.addEventListener('click', clearAllFilters);

  // Close modal if clicked outside of content
  window.addEventListener('click', (event) => {
    if (event.target === filterModal) {
      closeFilterModal();
    }
  });

  // Dynamically populate source checkboxes based on data
  populateSourceOptions();

  // Initialize status options (these are fixed from the table definition)
  statusOptions = [
    "Applications Received",
    "Applications Screened",
    "Documents collected",
    "Technical Interview Completed",
    "Management Interview Completed",
    "Salary approved"
  ];
}

function openFilterModal() {
  const filterModal = document.getElementById('filter-modal');
  filterModal.classList.add('show');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling

  // Pre-fill filters with active values if they exist
  restoreFilterValues();
}

function closeFilterModal() {
  const filterModal = document.getElementById('filter-modal');
  filterModal.classList.remove('show');
  document.body.style.overflow = '';
}

function populateSourceOptions() {
  // Get unique sources from table data
  const allData = table.getData();
  const uniqueSources = new Set();

  allData.forEach(row => {
    if (row.source && row.source !== "N/A") {
      uniqueSources.add(row.source);
    }
  });

  sourceOptions = Array.from(uniqueSources);

  // Create checkboxes for each source
  const sourceCheckboxes = document.querySelector('.source-checkboxes');
  sourceCheckboxes.innerHTML = '';

  // Add predefined options first
  const predefinedSources = ["LinkedIn", "Indeed", "Referral", "Direct", "Other"];
  predefinedSources.forEach(source => {
    const exists = sourceOptions.includes(source);
    if (exists) {
      createSourceCheckbox(source, sourceCheckboxes);
    }
  });

  // Add any other sources from the data
  sourceOptions.forEach(source => {
    if (!predefinedSources.includes(source)) {
      createSourceCheckbox(source, sourceCheckboxes);
    }
  });
}

function createSourceCheckbox(source, container) {
  const id = `source-${source.toLowerCase().replace(/\s+/g, '-')}`;

  const checkboxGroup = document.createElement('div');
  checkboxGroup.className = 'checkbox-group';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = id;
  checkbox.value = source;

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = source;

  checkboxGroup.appendChild(checkbox);
  checkboxGroup.appendChild(label);
  container.appendChild(checkboxGroup);
}

function restoreFilterValues() {
  // Restore basic information
  document.getElementById('filter-name').value = activeFilters.name || '';
  document.getElementById('filter-id').value = activeFilters.id || '';

  // Restore age range
  document.getElementById('filter-age-min').value = activeFilters.ageMin || '';
  document.getElementById('filter-age-max').value = activeFilters.ageMax || '';

  // Restore experience range
  document.getElementById('filter-exp-min').value = activeFilters.expMin || '';
  document.getElementById('filter-exp-max').value = activeFilters.expMax || '';

  // Restore date range
  document.getElementById('filter-date-from').value = activeFilters.dateFrom || '';
  document.getElementById('filter-date-to').value = activeFilters.dateTo || '';

  // Restore source checkboxes
  if (activeFilters.sources && activeFilters.sources.length) {
    document.querySelectorAll('.source-checkboxes input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = activeFilters.sources.includes(checkbox.value);
    });
  }

  // Restore status checkboxes
  if (activeFilters.statuses && activeFilters.statuses.length) {
    document.querySelectorAll('.status-checkboxes input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = activeFilters.statuses.includes(checkbox.value);
    });
  }
}

function collectFilterValues() {
  const filters = {};

  // Collect basic information
  const name = document.getElementById('filter-name').value.trim();
  if (name) filters.name = name;

  const id = document.getElementById('filter-id').value.trim();
  if (id) filters.id = id;

  // Collect age range
  const ageMin = document.getElementById('filter-age-min').value;
  if (ageMin) filters.ageMin = parseInt(ageMin);

  const ageMax = document.getElementById('filter-age-max').value;
  if (ageMax) filters.ageMax = parseInt(ageMax);

  // Collect experience range
  const expMin = document.getElementById('filter-exp-min').value;
  if (expMin) filters.expMin = parseInt(expMin);

  const expMax = document.getElementById('filter-exp-max').value;
  if (expMax) filters.expMax = parseInt(expMax);

  // Collect date range
  const dateFrom = document.getElementById('filter-date-from').value;
  if (dateFrom) filters.dateFrom = dateFrom;

  const dateTo = document.getElementById('filter-date-to').value;
  if (dateTo) filters.dateTo = dateTo;

  // Collect selected sources
  const selectedSources = [];
  document.querySelectorAll('.source-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
    selectedSources.push(checkbox.value);
  });
  if (selectedSources.length) filters.sources = selectedSources;

  // Collect selected statuses
  const selectedStatuses = [];
  document.querySelectorAll('.status-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
    selectedStatuses.push(checkbox.value);
  });
  if (selectedStatuses.length) filters.statuses = selectedStatuses;

  return filters;
}

function applyFilters() {
  // Collect filter values
  activeFilters = collectFilterValues();

  // Apply custom filters
  table.clearFilter();

  if (Object.keys(activeFilters).length > 0) {
    table.setFilter(customFilter);
    updateActiveFilterCount();
    if (table.getDataCount("visible") === 0) {
      displayNoResults();
  }
  } else {
    // No filters selected
    document.getElementById('active-filters-count').classList.add('hidden');
  }

  closeFilterModal();
}

function customFilter(data) {
  // Check if any filters are active
  if (Object.keys(activeFilters).length === 0) {
    return true; // No filters, show all data
  }

  // Name filter
  if (activeFilters.name) {
    const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
    if (!fullName.includes(activeFilters.name.toLowerCase())) {
      return false;
    }
  }

  // ID filter
  if (activeFilters.id && !data.candidateId.toString().includes(activeFilters.id)) {
    return false;
  }

  // Age filter
  if (activeFilters.ageMin !== undefined && (data.age === "N/A" || data.age < activeFilters.ageMin)) {
    return false;
  }

  if (activeFilters.ageMax !== undefined && (data.age === "N/A" || data.age > activeFilters.ageMax)) {
    return false;
  }

  // Experience filter
  if (activeFilters.expMin !== undefined) {
    const exp = typeof data.experience === 'string' ? parseFloat(data.experience) : data.experience;
    if (isNaN(exp) || exp < activeFilters.expMin) {
      return false;
    }
  }

  if (activeFilters.expMax !== undefined) {
    const exp = typeof data.experience === 'string' ? parseFloat(data.experience) : data.experience;
    if (isNaN(exp) || exp > activeFilters.expMax) {
      return false;
    }
  }

  // Date filter
  if (activeFilters.dateFrom || activeFilters.dateTo) {
    if (data.application_date === "N/A") {
      return false;
    }

    const appDate = new Date(data.application_date);

    if (activeFilters.dateFrom) {
      const fromDate = new Date(activeFilters.dateFrom);
      if (appDate < fromDate) {
        return false;
      }
    }

    if (activeFilters.dateTo) {
      const toDate = new Date(activeFilters.dateTo);
      // Set time to end of day for inclusive range
      toDate.setHours(23, 59, 59, 999);
      if (appDate > toDate) {
        return false;
      }
    }
  }

  // Source filter
  if (activeFilters.sources && activeFilters.sources.length > 0) {
    if (!activeFilters.sources.includes(data.source)) {
      return false;
    }
  }

  // Status filter
  if (activeFilters.statuses && activeFilters.statuses.length > 0) {
    if (!activeFilters.statuses.includes(data.shortlisted)) {
      return false;
    }
  }

  return true; // All filters passed
}

function resetFilters() {
  // Clear all filter inputs in the modal but don't apply
  document.getElementById('filter-name').value = '';
  document.getElementById('filter-id').value = '';
  document.getElementById('filter-age-min').value = '';
  document.getElementById('filter-age-max').value = '';
  document.getElementById('filter-exp-min').value = '';
  document.getElementById('filter-exp-max').value = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';

  // Uncheck all checkboxes
  document.querySelectorAll('.source-checkboxes input[type="checkbox"], .status-checkboxes input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
}

function clearAllFilters() {
  // Clear all active filters and reset the table
  activeFilters = {};
  table.clearFilter();
  document.getElementById('active-filters-count').classList.add('hidden');
}

function updateActiveFilterCount() {
  const badge = document.getElementById('active-filters-count');
  const count = Object.keys(activeFilters).length;

  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// Modify the document ready function to initialize filters
document.addEventListener("DOMContentLoaded", () => {
  fetchData().then(() => {
    // Initialize filters after table is ready
    setTimeout(initializeFilters, 500);
    // Add event listener to the close button
    document.querySelector(".close-button").addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = 'index.html';
      localStorage.setItem('navigateToTab', 'jobPostings');
    });
  });
});