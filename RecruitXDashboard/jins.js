// const API_URL = 'https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/.json';
 
// // Step 1: Data processing logic function
// const RecruitmentMetrics = (function() {
 
//   function processData(data) {
 
//     function gcd(a, b) {
//       return b === 0 ? a : gcd(b, a % b);
//     }
 
//     const metrics = {
//       totalHired: 0,
//       openPositions: 0,
//       closedPositions: 0,
//       avgApplicationsPerJob: 0,
//       avgTimeToHire: 0,
//       offerAcceptanceRate: 0
//     };
//     let acceptedOffers = 0;
//     let totalOffers = 0;
 
//     // Calculate total hired
//     Object.values(data.applications).forEach(app => {
//       if (app.application_status === "Offer accepted") {
//         metrics.totalHired++;
//       }
     
//       if (app.application_status === "Offer accepted") {
//         acceptedOffers++;
//       }
//       if (app.hire_date !== "N/A") {
//           totalOffers++;
//       }
//     });
 
//     // Calculate open and closed positions
//     Object.values(data.jobPostings).forEach(job => {
//       if (job.job_status === "Open") {
//         metrics.openPositions++;
//       } else if (job.job_status === "Closed") {
//         metrics.closedPositions++;
//       }
//     });
 
//     // Calculate avg applications per job
//     const totalApplications = Object.keys(data.applications).length;
//     const totalJobs = Object.keys(data.jobPostings).length;
//     metrics.avgApplicationsPerJob = (totalApplications / totalJobs).toFixed(1);
 
//     // Calculate avg time to hire
//     let totalHireDays = 0;
//     let hireCount = 0;
//     Object.values(data.applications).forEach(app => {
//       if (app.hire_date !== "N/A" && app.application_status === "Offer accepted") {
//         const applicationDate = new Date(app.application_date);
//         const hireDate = new Date(app.hire_date);
//         const timeToHire = Math.abs((hireDate - applicationDate) / (1000 * 60 * 60 * 24)); // in days
//         totalHireDays += timeToHire;
//         hireCount++;
//       }
//     });
//     metrics.avgTimeToHire = hireCount > 0 ? (totalHireDays / hireCount).toFixed(1) : 'N/A';
 
//   metrics.offerAcceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : "N/A";
 
 
//     return metrics;
//   }
 
//   // Step 2: UI update logic
//   function update(metrics) {
//     document.getElementById('totalHired').textContent = metrics.totalHired;
//     document.getElementById('openPositions').textContent = metrics.openPositions;
//     document.getElementById('closedPositions').textContent = metrics.closedPositions;
//     document.getElementById('applicationsPerHire').textContent = metrics.avgApplicationsPerJob;
//     document.getElementById('daysPerHire').textContent = metrics.avgTimeToHire;
 
//     const offerAcceptanceElement = document.getElementById("offerAcceptanceRate");
//     if (offerAcceptanceElement) {
//         offerAcceptanceElement.textContent = `${metrics.offerAcceptanceRate}  %`;
//     }
// }
 
// return {
//     init: async function() {
//       try {
//         const response = await axios.get(API_URL);
 
//         // Ensure response.data is not null or undefined
//         if (!response.data) {
//           console.error("No data received from Firebase.");
//           return;
//         }
 
//         const metrics = processData(response.data);
//         update(metrics);
//       } catch (error) {
//         console.error("Error fetching data from Firebase:", error);
//       }
//     }
//   };
 
// })();
 
// // Initialize the recruitment metrics processing
// document.addEventListener('DOMContentLoaded', function() {
//   RecruitmentMetrics.init();
// });
 
 


// const API_URL = 'https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/.json';

// const RecruitmentMetrics = (function() {
//   function processData(data, selectedJob, selectedYear) {
//     const metrics = {
//       totalHired: 0,
//       openPositions: 0,
//       closedPositions: 0,
//       avgApplicationsPerJob: 0,
//       avgTimeToHire: 0,
//       offerAcceptanceRate: 0
//     };

//     let acceptedOffers = 0;
//     let totalOffers = 0;
//     let totalHireDays = 0;
//     let hireCount = 0;
//     let totalApplications = 0;
//     let totalJobs = 0;
//     let filteredApplications = [];

//     // Apply filters on applications
//     Object.values(data.applications).forEach(app => {
//       let applicationYear = new Date(app.application_date).getFullYear();

//       if (selectedYear !== "all" && applicationYear !== parseInt(selectedYear)) return;
//       if (selectedJob && jobIdMap[selectedJob] !== app.job_id) return;
      
//       filteredApplications.push(app);
//     });

//     // Calculate total hired
//     filteredApplications.forEach(app => {
//       if (app.application_status === "Offer accepted") {
//         metrics.totalHired++;
//         acceptedOffers++;
//       }
//       if (app.hire_date !== "N/A") {
//         totalOffers++;
//       }
//     });

//     // Calculate open and closed positions
//     Object.values(data.jobPostings).forEach(job => {
//       if (selectedJob && jobIdMap[selectedJob] !== job.job_id) return; // Apply job filter

//       if (job.job_status === "Open") {
//         metrics.openPositions++;
//       } else if (job.job_status === "Closed") {
//         metrics.closedPositions++;
//       }
//       totalJobs++;
//     });

//     // Calculate avg applications per job
//     totalApplications = filteredApplications.length;
//     metrics.avgApplicationsPerJob = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : "N/A";

//     // Calculate avg time to hire
//     filteredApplications.forEach(app => {
//       if (app.hire_date !== "N/A" && app.application_status === "Offer accepted") {
//         const applicationDate = new Date(app.application_date);
//         const hireDate = new Date(app.hire_date);
//         const timeToHire = Math.abs((hireDate - applicationDate) / (1000 * 60 * 60 * 24)); // in days
//         totalHireDays += timeToHire;
//         hireCount++;
//       }
//     });

//     metrics.avgTimeToHire = hireCount > 0 ? (totalHireDays / hireCount).toFixed(1) : "N/A";
//     metrics.offerAcceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : "N/A";

//     return metrics;
//   }

//   function update(metrics) {
//     document.getElementById('totalHired').textContent = metrics.totalHired;
//     document.getElementById('openPositions').textContent = metrics.openPositions;
//     document.getElementById('closedPositions').textContent = metrics.closedPositions;
//     document.getElementById('applicationsPerHire').textContent = metrics.avgApplicationsPerJob;
//     document.getElementById('daysPerHire').textContent = metrics.avgTimeToHire;

//     const offerAcceptanceElement = document.getElementById("offerAcceptanceRate");
//     if (offerAcceptanceElement) {
//         offerAcceptanceElement.textContent = `${metrics.offerAcceptanceRate} %`;
//     }
//   }

//   return {
//     init: async function(selectedJob = "", selectedYear = "all") {
//       try {
//         const response = await axios.get(API_URL);

//         if (!response.data) {
//           console.error("No data received from Firebase.");
//           return;
//         }

//         const metrics = processData(response.data, selectedJob, selectedYear);
//         update(metrics);
//       } catch (error) {
//         console.error("Error fetching data from Firebase:", error);
//       }
//     }
//   };
// })();

// // Event listener to update metrics when filters change
// document.addEventListener("jobFilterChanged", (event) => {
//   const selectedJob = event.detail.job;
//   const selectedYear = document.getElementById("yearSelect").value;
//   RecruitmentMetrics.init(selectedJob, selectedYear);
// });

// document.addEventListener("yearFilterChanged", (event) => {
//   const selectedYear = event.detail.year;
//   const selectedJob = document.getElementById("jobFilter").value;
//   RecruitmentMetrics.init(selectedJob, selectedYear);
// });

// // Initialize on page load
// document.addEventListener('DOMContentLoaded', function() {
//   RecruitmentMetrics.init();
// });



const API_URL = 'https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/.json';

const RecruitmentMetrics = (function() {
  function processData(data, selectedJob, selectedYear) {
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
    let totalHireDays = 0;
    let hireCount = 0;
    let totalApplications = 0;
    let totalJobs = 0;
    let filteredApplications = [];

    // Apply filters on applications
    Object.values(data.applications).forEach(app => {
      let applicationYear = new Date(app.application_date).getFullYear();

      if (selectedYear !== "all" && applicationYear !== parseInt(selectedYear)) return;
      if (selectedJob && jobIdMap[selectedJob] !== app.job_id) return;
      
      filteredApplications.push(app);
    });

    // Calculate total hired
    filteredApplications.forEach(app => {
      if (app.application_status === "Offer accepted") {
        metrics.totalHired++;
        acceptedOffers++;
      }
      if (app.hire_date !== "N/A") {
        totalOffers++;
      }
    });

    // Calculate open and closed positions
    Object.values(data.jobPostings).forEach(job => {
      if (selectedJob && jobIdMap[selectedJob] !== job.job_id) return; // Apply job filter

      if (job.job_status === "Open") {
        metrics.openPositions++;
      } else if (job.job_status === "Closed") {
        metrics.closedPositions++;
      }
      totalJobs++;
    });

    // Calculate avg applications per job
    totalApplications = filteredApplications.length;
    metrics.avgApplicationsPerJob = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : "N/A";

    // Calculate avg time to hire
    filteredApplications.forEach(app => {
      if (app.hire_date !== "N/A" && app.application_status === "Offer accepted") {
        const applicationDate = new Date(app.application_date);
        const hireDate = new Date(app.hire_date);
        const timeToHire = Math.abs((hireDate - applicationDate) / (1000 * 60 * 60 * 24)); // in days
        totalHireDays += timeToHire;
        hireCount++;
      }
    });

    metrics.avgTimeToHire = hireCount > 0 ? (totalHireDays / hireCount).toFixed(1) : "N/A";
    metrics.offerAcceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : "N/A";

    return metrics;
  }

  function update(metrics) {
    document.getElementById('totalHired').textContent = metrics.totalHired;
    document.getElementById('openPositions').textContent = metrics.openPositions;
    document.getElementById('closedPositions').textContent = metrics.closedPositions;
    document.getElementById('applicationsPerHire').textContent = metrics.avgApplicationsPerJob;
    document.getElementById('daysPerHire').textContent = metrics.avgTimeToHire;

    const offerAcceptanceElement = document.getElementById("offerAcceptanceRate");
    if (offerAcceptanceElement) {
        offerAcceptanceElement.textContent = `${metrics.offerAcceptanceRate} %`;
    }
  }

  return {
    init: async function(selectedJob, selectedYear='') {
        console.log(123);
        selectedYear=document.getElementById("yearSelect").value;
      try {
        const response = await axios.get(API_URL);

        if (!response.data) {
          console.error("No data received from Firebase.");
          return;
        }

        const metrics = processData(response.data, selectedJob, selectedYear);
        update(metrics);
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    }
  };
})();

// Event listener to update metrics when filters change
document.getElementById("jobFilter").addEventListener("change", function() {
    console.log(321);
  const selectedJob = this.value;
  const selectedYear = document.getElementById("yearSelect").value;
  RecruitmentMetrics.init(selectedJob, selectedYear);
});


document.getElementById("yearSelect").addEventListener("change", function() {
  const selectedYear = this.value;
  const selectedJob = document.getElementById("jobFilter").value;
  console.log(456);
  RecruitmentMetrics.init(selectedJob, selectedYear);
});

// Initialize on page load


