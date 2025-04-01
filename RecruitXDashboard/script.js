const FIREBASE_DB_URL = 'https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com';

function switchTab() {
    const analyticsDiv = document.getElementById("recruitmentAnalytics");
    const jobPostingsDiv = document.getElementById("jobPostings");
    const tabs = document.querySelectorAll(".tab");
    const tabContainer = document.querySelector(".tab-container");
    const articleContainer = document.querySelector(".article-container");

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
            activeTabBg: primaryBlue
        },
        jobPostings: {
            body: "#ffffff",
            tabBg: secondaryOrange,
            articleContainerBg: secondaryOrange,
            activeTabBg: primaryOrange
        }
    };

    // Apply the correct theme
    const activeTheme = isAnalyticsActive ? themes.jobPostings : themes.analytics;

    document.body.style.backgroundColor = activeTheme.body;
    tabContainer.style.backgroundColor = activeTheme.tabBg;
    articleContainer.style.backgroundColor = activeTheme.articleContainerBg;
    articleContainer.style.transition = "background-color 0.5s ease-in-out";

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
});
const jobPostings = async () => {
    // DOM Element references
    const loadingIndicatorElement = document.getElementById("loading-indicator");
    const errorMessageElement = document.getElementById("error-message");
    const locationFilterElement = document.getElementById("location-filter");
    const duFilterElement = document.getElementById("du-filter");
  
    // Firebase URL constant
    const FIREBASE_URL =
      "https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/";
  
    // Table initialization variable
    let jobTable;
  
    // Initialize UI state: show loading, hide error
    errorMessageElement.style.display = "none";
    loadingIndicatorElement.style.display = "flex";
  
    /**
     * Retrieves job data from Firebase, filters it, and initializes the table.
     */
    const fetchJobData = async () => {
      try {
        loadingIndicatorElement.style.display = "flex";
        errorMessageElement.style.display = "none";
  
        const response = await axios.get(`${FIREBASE_URL}jobPostings.json`);
  
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
  
      // Add click event to rows for navigation
      jobTable.on("tableBuilt", () => {
        const rows = jobTable.element.querySelectorAll(".tabulator-row");
        rows.forEach((row) => {
          row.addEventListener("click", function () { // Use a regular function to access 'this'
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