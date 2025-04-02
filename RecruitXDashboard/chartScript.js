
// //chart.js

// document.addEventListener("jobFilterChanged", (event) => {
//   const selectedJob = event.detail.job;
//   console.log("Filter applied, fetching data for:", selectedJob);
  
//   fetchAndProcessData(selectedJob);
// });

// // Fetch and process data based on selected job
// function fetchAndProcessData(selectedJob) {
//   fetch("./updated_job_applications_data.json")
//     .then(response => response.json())
//     .then(data => {
//       if (!data.applications || !data.candidates) throw new Error("Missing data fields");

//       processHiringData(data.applications, selectedJob);
//       processCandidatesData(data.applications, data.candidates, selectedJob);
//     })
//     .catch(error => console.error("Error fetching data:", error));
// }

// // Process hiring data for time taken to hire chart
// function processHiringData(applications, selectedJob) {
//   const durationCounts = {"0-15 Days": 0, "16-30 Days": 0, "31-45 Days": 0, "46-60 Days": 0, "61-90 Days": 0, "Above 90 Days": 0};

//   Object.values(applications).forEach(app => {
//     if (selectedJob && jobIdMap[selectedJob] !== app.job_id) return; // Apply job filter
//     if (app.application_status === "Hired" && app.application_date && app.hire_date) {
//       const appDate = new Date(app.application_date);
//       const hireDate = new Date(app.hire_date);
//       if (isNaN(appDate) || isNaN(hireDate)) return;

//       const daysToHire = Math.ceil((hireDate - appDate) / (1000 * 60 * 60 * 24));
//       if (daysToHire <= 15) durationCounts["0-15 Days"]++;
//       else if (daysToHire <= 30) durationCounts["16-30 Days"]++;
//       else if (daysToHire <= 45) durationCounts["31-45 Days"]++;
//       else if (daysToHire <= 60) durationCounts["46-60 Days"]++;
//       else if (daysToHire <= 90) durationCounts["61-90 Days"]++;
//       else durationCounts["Above 90 Days"]++;
//     }
//   });

//   drawBarChart("barChartDuration", Object.values(durationCounts), ["0-15", "16-30", "31-45", "46-60", "61-90", "Above 90"], "Time Taken to Hire Candidates");
// }

// // Process candidates data and filter by job
// function processCandidatesData(applications, candidates, selectedJob) {
//   const ageRanges = {"20-30": 0, "30-40": 0, "40-50": 0, "50-60": 0, ">60": 0};

//   let filteredCandidates = new Set();
//   Object.values(applications).forEach(app => {
//     if (selectedJob && jobIdMap[selectedJob] !== app.job_id) return;
//     filteredCandidates.add(app.candidate_id);
//   });

//   Object.values(candidates).forEach(candidate => {
//     if (!filteredCandidates.has(candidate.candidateId) || !candidate.dob) return;
//     const birthYear = parseInt(candidate.dob.split("-")[0]);
//     const currentYear = new Date().getFullYear();
//     const age = currentYear - birthYear;

//     if (age >= 20 && age < 30) ageRanges["20-30"]++;
//     else if (age >= 30 && age < 40) ageRanges["30-40"]++;
//     else if (age >= 40 && age < 50) ageRanges["40-50"]++;
//     else if (age >= 50 && age < 60) ageRanges["50-60"]++;
//     else if (age >= 60) ageRanges[">60"]++;
//   });

//   drawBarChart("barChartAge", Object.values(ageRanges), ["20-30", "30-40", "40-50", "50-60", ">60"], "Age Distribution of Applicants");
// }

// // Function to draw bar chart
// function drawBarChart(chartId, chartData, labels, titleText) {
//   const chartCanvas = document.getElementById(chartId);
//   if (!chartCanvas) return;
  
//   new Chart(chartCanvas, {
//     type: "bar",
//     data: {
//       labels: labels,
//       datasets: [{
//         backgroundColor: "#1EBBF0",
//         borderColor: ["#f59b4f", "#f59b4f", "#f59b4f", "#f59b4f", "#f59b4f", "#f59b4f"], 
//         borderWidth: { left: 3, right: 0, top: 0, bottom: 0 },
//         data: chartData,
//         barThickness: 25
//       }]
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false,
//       legend: { display: false },
//       scales: {
//         yAxes: [{
//           ticks: { beginAtZero: true, stepSize: 2 }, 
//           gridLines: {
//             display: true,
//             color: "gray",
//             borderDash: [5, 5] 
//           }
//         }],
//         xAxes: [{
//           gridLines: { display: false }
//         }]
//       },
//       plugins: { title: { display: true, text: titleText } }
//     }
//   });
// }
console.log('chartscript.js is loading...');



//chartScript.js
let chartInstances = {}; 

document.addEventListener("jobFilterChanged", (event) => {
  const selectedJob = event.detail.job;
  console.log("Filter applied, fetching data for:", selectedJob);
  notifySubscribers();
  fetchAndProcessData(selectedJob);
});

// Fetch and process data based on selected job
function fetchAndProcessData(selectedJob) {
  axios.get("https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/.json")
    .then(response => {
      const data = response.data;
      if (!data.applications || !data.candidates) throw new Error("Missing data fields");
      processHiringDate(data.applications, selectedJob);
      processCandidatesAge(data.applications, data.candidates, selectedJob);
      // Add new charts here and pass selectedJob to apply filtering
    })
    .catch(error => console.error("Error fetching data:", error));
}

// Process hiring data for time taken to hire chart
function processHiringDate(applications, selectedJob) {
  const durationCounts = {"0-15": 0, "16-30": 0, "31-45": 0, "46-60": 0, "61-90": 0, "Above 90": 0};
  const selectedYear = document.getElementById("yearSelect").value;

  Object.values(applications).forEach(app => {
    if (selectedJob && jobIdMap[selectedJob] !== app.job_id) return; // Apply job filter
    if (app.application_status === "Offer accepted" && app.application_date && app.hire_date) {
      const appDate = new Date(app.application_date);
      const applicationYear = appDate.getFullYear();
      const hireDate = new Date(app.hire_date);
      if (selectedYear != 'all' && applicationYear != selectedYear) {
        return;
      }
      
      if (isNaN(appDate) || isNaN(hireDate)) return;

      const daysToHire = Math.ceil((hireDate - appDate) / (1000 * 60 * 60 * 24));
      if (daysToHire <= 15) durationCounts["0-15"]++;
      else if (daysToHire <= 30) durationCounts["16-30"]++;
      else if (daysToHire <= 45) durationCounts["31-45"]++;
      else if (daysToHire <= 60) durationCounts["46-60"]++;
      else if (daysToHire <= 90) durationCounts["61-90"]++;
      else durationCounts["Above 90"]++;
    }
  });

  drawBarChart("barChartDuration", Object.values(durationCounts), ["0-15", "16-30", "31-45", "46-60", "61-90", "Above 90"], "Time Taken to Hire Candidates");
}

// Process candidates data and filter by job
function processCandidatesAge(applications, candidates, selectedJob) {
  const ageRanges = {"20-30": 0, "30-40": 0, "40-50": 0, "50-60": 0, ">60": 0};

  const selectedYear = document.getElementById("yearSelect").value;
  let filteredCandidates = []//new Set();
  Object.values(applications).forEach(app => {
    let applicationYear = new Date(app.application_date).getFullYear();
  

    if (selectedYear != 'all' && applicationYear != selectedYear) {
      return;
    }
    
    if (selectedJob && jobIdMap[selectedJob] !== app.job_id){

      return;
    }
    filteredCandidates.push(app.candidate_id);
  });
  Object.values(candidates).forEach(candidate => {
    if (!filteredCandidates.includes(candidate.candidateId) || !candidate.dob) return;
    const birthYear = parseInt(candidate.dob.split("-")[0]);
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age >= 20 && age < 30) ageRanges["20-30"]++;
    else if (age >= 30 && age < 40) ageRanges["30-40"]++;
    else if (age >= 40 && age < 50) ageRanges["40-50"]++;
    else if (age >= 50 && age < 60) ageRanges["50-60"]++;
    else if (age >= 60) ageRanges[">60"]++;
  });

  drawBarChart("barChartAge", Object.values(ageRanges), ["20-30", "30-40", "40-50", "50-60", ">60"], "Age Distribution of Applicants");
}

// Function to draw bar chart
function drawBarChart(chartId, chartData, labels, titleText) {
  const chartCanvas = document.getElementById(chartId);
  if (!chartCanvas) return;
  if (chartInstances[chartId]) {
    chartInstances[chartId].destroy();
  }
  
  chartInstances[chartId] =new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        backgroundColor: "#1EBBF0",
        borderColor: ["#FCB334", "#FCB334", "#FCB334", "#FCB334", "#FCB334", "#FCB334"], 
        borderWidth: { left: 3, right: 0, top: 0, bottom: 0 },
        data: chartData,
        barThickness: 25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        yAxes: [{
          ticks: { beginAtZero: true, stepSize: 3 }, 
          gridLines: {
            display: true,
            color: "gray",
            borderDash: [5, 5] 
          }
        }],
        xAxes: [{
          gridLines: { display: false }
        }]
      },
        title: { display: true, text: titleText } 
    }
  });
}
