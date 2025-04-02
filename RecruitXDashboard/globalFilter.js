// let selectedJob = ""; // Global filter variable
// let jobIdMap = {}; // Map job titles to job IDs

// document.addEventListener("DOMContentLoaded", () => {
//   fetchJobTitles(); // Load job titles when the page loads

//   const jobFilter = document.getElementById("jobFilter");
//   if (jobFilter) {
//     jobFilter.addEventListener("change", function () {
//       selectedJob = this.value;
//       console.log("Selected Job:", selectedJob); // Debugging log

//       // Dispatch event to notify all scripts about the filter change
//       document.dispatchEvent(new CustomEvent("jobFilterChanged", { detail: { job: selectedJob } }));
//     });
//   }

//   // Automatically trigger event to load charts without filtering
//   setTimeout(() => {
//     document.dispatchEvent(new CustomEvent("jobFilterChanged", { detail: { job: "" } }));
//   }, 500); // Small delay to ensure dropdown is populated
// });

// // Fetch job titles from JSON and populate dropdown
// function fetchJobTitles() {
//   fetch("./updated_job_applications_data.json")
//     .then(response => response.json())
//     .then(data => {
//       if (!data.jobPostings) throw new Error("Missing jobPostings data");

//       const jobFilter = document.getElementById("jobFilter");
//       jobFilter.innerHTML = '<option value="">All Jobs</option>'; // Default option

//       Object.entries(data.jobPostings).forEach(([jobId, job]) => {
//         jobIdMap[job.title] = jobId; // Store job title to job ID mapping
//         const option = document.createElement("option");
//         option.value = job.title;
//         option.textContent = job.title;
//         jobFilter.appendChild(option);
//       });
//     })
//     .catch(error => console.error("Error fetching job titles:", error));
// }




// globalFilter.js
let jobIdMap = {}; // Map job titles to job IDs
// let selectedJob = ""; // Global filter variable
// let jobIdMap = {}; // Map job titles to job IDs

// // document.addEventListener("DOMContentLoaded", () => {
//   console.log('global filter dom loaded');
//   fetchJobTitles(); // Load job titles when the page loads
//   // GlobalFilter.init();
  
//   const jobFilter = document.getElementById("jobFilter");
//   if (jobFilter) {
//     jobFilter.addEventListener("change", function () {
//       selectedJob = this.value;
//       console.log("Selected Job:", selectedJob); // Debugging log

//       // Dispatch event to notify all scripts about the filter change
//       document.dispatchEvent(new CustomEvent("jobFilterChanged", { detail: { job: selectedJob } }));
//     });
//   }

//   // Automatically trigger event to load charts without filtering
//   setTimeout(() => {
//     document.dispatchEvent(new CustomEvent("jobFilterChanged", { detail: { job: "" } }));
//   }, 1); // Small delay to ensure dropdown is populated
// });

// Fetch job titles from JSON and populate dropdown
function fetchJobTitles() {
  axios.get("https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/.json")
    .then(response => {
      const data = response.data;
      if (!data.jobPostings) throw new Error("Missing jobPostings data");

      const jobFilter = document.getElementById("jobFilter");
      jobFilter.innerHTML = '<option value="">All Jobs</option>'; // Default option

      // Iterate over the job postings and create dropdown options
      Object.entries(data.jobPostings).forEach(([jobId, job]) => {
        jobIdMap[job.title] = jobId; // Store job title to job ID mapping
        const option = document.createElement("option");
        option.value = job.title;
        option.textContent = job.title;
        jobFilter.appendChild(option);
      });
    })
    .catch(error => console.error("Error fetching job titles:", error));
}
  



