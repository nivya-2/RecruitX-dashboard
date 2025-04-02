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


// Step 1: Data processing logic function
const RecruitmentMetrics = (function() {
  
    function processData(data) {
  
      function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
      }
  
      const metrics = {
        totalHired: 0,
        openPositions: 0,
        closedPositions: 0,
        avgApplicationsPerJob: 0,
        avgTimeToHire: 0,
        offerAcceptanceRate: 0
      };
      let acceptedOffers = 0;
      let totalOffers = 0;
  
      // Calculate total hired
      Object.values(data.applications).forEach(app => {
        if (app.application_status === "Offer accepted") {
          metrics.totalHired++;
        }
        
        if (app.application_status === "Offer accepted") {
          acceptedOffers++;
        }
        if (app.hire_date !== "N/A") {
            totalOffers++;
        }
      });
  
      // Calculate open and closed positions
      Object.values(data.jobPostings).forEach(job => {
        if (job.job_status === "Open") {
          metrics.openPositions++;
        } else if (job.job_status === "Closed") {
          metrics.closedPositions++;
        }
      });
  
      // Calculate avg applications per job
      const totalApplications = Object.keys(data.applications).length;
      const totalJobs = Object.keys(data.jobPostings).length;
      metrics.avgApplicationsPerJob = (totalApplications / totalJobs).toFixed(1);
  
      // Calculate avg time to hire
      let totalHireDays = 0;
      let hireCount = 0;
      Object.values(data.applications).forEach(app => {
        if (app.hire_date !== "N/A" && app.application_status === "Offer accepted") {
          const applicationDate = new Date(app.application_date);
          const hireDate = new Date(app.hire_date);
          const timeToHire = Math.abs((hireDate - applicationDate) / (1000 * 60 * 60 * 24)); // in days
          totalHireDays += timeToHire;
          hireCount++;
        }
      });
      metrics.avgTimeToHire = hireCount > 0 ? (totalHireDays / hireCount).toFixed(1) : 'N/A';
  
    metrics.offerAcceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : "N/A";
  
  
      return metrics;
    }
  
    // Step 2: UI update logic
    function update(metrics) {
      document.getElementById('totalHired').textContent = metrics.totalHired;
      document.getElementById('openPositions').textContent = metrics.openPositions;
      document.getElementById('closedPositions').textContent = metrics.closedPositions;
      document.getElementById('applicationsPerHire').textContent = metrics.avgApplicationsPerJob;
      document.getElementById('daysPerHire').textContent = metrics.avgTimeToHire;
  
      const offerAcceptanceElement = document.getElementById("offerAcceptanceRate");
      if (offerAcceptanceElement) {
          offerAcceptanceElement.textContent = `${metrics.offerAcceptanceRate}`;
      }
  }
  return {
    init: async function() {
      try {
        const response = await axios.get(`${FIREBASE_DB_URL}/.json`);

  
        // Ensure response.data is not null or undefined
        if (!response.data) {
          console.error("No data received from Firebase.");
          return;
        }
  
        const metrics = processData(response.data);
        update(metrics);
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    }
  };
  
})();

// Initialize the recruitment metrics processing
document.addEventListener('DOMContentLoaded', function() {
  RecruitmentMetrics.init();
});