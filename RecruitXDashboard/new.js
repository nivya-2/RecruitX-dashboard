// Main dashboard initialization
function initializeDashboard() {
    const FIREBASE_DB_URL = "https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/.json";
    let selectedJob = "";
    let rawData = null;
    let jobIdMap = {};
    let chartInstances = {};
    let allData = null;
    let subscribers = [];
    let availableYears = new Set();
    let currentYear = 'all';
    const statusElement = document.getElementById('status');

    // Load external scripts dynamically
    function loadScript(src, callback) {
        let script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        script.onload = callback;
        document.head.appendChild(script);
    }

    // Extract available years from the data
    function extractAvailableYears() {
        if (allData?.applications) {
            Object.values(allData.applications).forEach(app => {
                if (app.application_date) {
                    availableYears.add(app.application_date.substring(0, 4));
                }
            });
        }
        if (allData?.jobPostings) {
            Object.values(allData.jobPostings).forEach(job => {
                if (job.posted_date) availableYears.add(job.posted_date.substring(0, 4));
                if (job.closed_date && job.closed_date !== "N/A") {
                    availableYears.add(job.closed_date.substring(0, 4));
                }
            });
        }
    }

    // Setup the year filter dropdown UI
    function setupYearFilterUI() {
        const yearSelect = document.getElementById('yearSelect');
        if (!yearSelect) return;
        yearSelect.innerHTML = '';
        yearSelect.appendChild(new Option('All Years', 'all'));
        Array.from(availableYears).sort().reverse().forEach(year => {
            yearSelect.appendChild(new Option(year, year));
        });
        yearSelect.addEventListener('change', (e) => {
            currentYear = e.target.value;
            notifySubscribers();
            updateAllCharts();
        });
    }

    // Notify all subscribers when filter changes
    function notifySubscribers() {
        const filteredData = filterData();
        subscribers.forEach(callback => {
            try {
                callback(filteredData);
            } catch (error) {
                console.error('Error in filter subscriber:', error);
            }
        });
    }
    const subscribe = (callback) => {
        subscribers.push(callback);
        if (allData) callback(filterData());
    }
    

    // Filter data based on selected job and year
    function filterData() {
        if (!allData) return null;
        const selectedJob = document.getElementById('jobFilter').value;
        if (currentYear === 'all' && !selectedJob) return { ...allData };
        
        const filtered = {
            applications: {},
            candidates: {},
            jobPostings: {}
        };
        Object.entries(allData.applications || {}).forEach(([key, app]) => {
            let jobId = app.job_id;
            let selectedJobId = selectedJob ? jobIdMap[selectedJob] : null;
     
            if ((currentYear == 'all' || app.application_date?.includes(currentYear)) && (!selectedJobId || jobId == selectedJobId)) {
                filtered.applications[key] = app;
            }
        });

        Object.entries(allData.jobPostings || {}).forEach(([key, job]) => {
            if (job.posted_date?.includes(currentYear) || job.closed_date?.includes(currentYear)) {
                filtered.jobPostings[key] = job;
            }
        });

        const candidateIds = new Set();
        Object.values(filtered.applications).forEach(app => {
            if (app.candidate_id) candidateIds.add(app.candidate_id);
        });

        candidateIds.forEach(id => {
            if (allData.candidates?.[id]) {
                filtered.candidates[id] = allData.candidates[id];
            }
        });

        return filtered;
    }

    // Fetch job titles from Firebase
    function fetchJobTitles() {
        axios.get(FIREBASE_DB_URL)
            .then(response => {
                const data = response.data;
                if (!data.jobPostings) throw new Error("Missing jobPostings data");
        
                const jobFilter = document.getElementById("jobFilter");
                if (!jobFilter) return;
                
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

    // Fetch and process data based on selected filters
    function fetchAndProcessData() {
        const selectedJob = document.getElementById("jobFilter")?.value || "";
        const selectedYear = document.getElementById("yearSelect")?.value || "all";
        
        if (allData) {
            processHiringDate(allData.applications, selectedJob, selectedYear);
            processCandidatesAge(allData.applications, allData.candidates, selectedJob, selectedYear);
            RecruitmentMetrics.update(allData, selectedJob, selectedYear);
            updateCharts(allData, selectedJob, selectedYear);
        }
    }

    // Process hiring data for time taken to hire chart
    function processHiringDate(applications, selectedJob, selectedYear) {
        if (!applications) return;
        
        const durationCounts = {"0-15": 0, "16-30": 0, "31-45": 0, "46-60": 0, "61-90": 0, "Above 90": 0};

        Object.values(applications).forEach(app => {
            // Apply job filter
            if (selectedJob && jobIdMap[selectedJob] !== app.job_id) return;
            
            if (app.application_status === "Offer accepted" && app.application_date && app.hire_date) {
                const appDate = new Date(app.application_date);
                const applicationYear = appDate.getFullYear().toString();
                
                // Apply year filter
                if (selectedYear !== "all" && applicationYear !== selectedYear) return;
                
                const hireDate = new Date(app.hire_date);
                if (isNaN(appDate.getTime()) || isNaN(hireDate.getTime())) return;

                const daysToHire = Math.ceil((hireDate - appDate) / (1000 * 60 * 60 * 24));
                if (daysToHire <= 15) durationCounts["0-15"]++;
                else if (daysToHire <= 30) durationCounts["16-30"]++;
                else if (daysToHire <= 45) durationCounts["31-45"]++;
                else if (daysToHire <= 60) durationCounts["46-60"]++;
                else if (daysToHire <= 90) durationCounts["61-90"]++;
                else durationCounts["Above 90"]++;
            }
        });

        drawBarChart("barChartDuration", Object.values(durationCounts), 
            ["0-15", "16-30", "31-45", "46-60", "61-90", "Above 90"], 
            "Time Taken to Hire Candidates");
    }

    // Process candidates data for age distribution chart
    function processCandidatesAge(applications, candidates, selectedJob, selectedYear) {
        if (!applications || !candidates) return;
        
        const ageRanges = {"20-30": 0, "30-40": 0, "40-50": 0, "50-60": 0, ">60": 0};
        const filteredCandidateIds = [];

        // Filter applications based on job and year
        Object.values(applications).forEach(app => {
            if (!app.application_date) return;
            
            const applicationYear = new Date(app.application_date).getFullYear().toString();
            
            if ((selectedYear === "all" || applicationYear === selectedYear) && 
                (selectedJob === "" || jobIdMap[selectedJob] === app.job_id)) {
                filteredCandidateIds.push(app.candidate_id);
            }
        });

        // Count candidates by age range
        Object.values(candidates).forEach(candidate => {
            if (!filteredCandidateIds.includes(candidate.candidateId) || !candidate.dob) return;
            
            const birthYear = parseInt(candidate.dob.split("-")[0]);
            const currentYear = new Date().getFullYear();
            const age = currentYear - birthYear;

            if (age >= 20 && age < 30) ageRanges["20-30"]++;
            else if (age >= 30 && age < 40) ageRanges["30-40"]++;
            else if (age >= 40 && age < 50) ageRanges["40-50"]++;
            else if (age >= 50 && age < 60) ageRanges["50-60"]++;
            else if (age >= 60) ageRanges[">60"]++;
        });

        drawBarChart("barChartAge", Object.values(ageRanges), 
            ["20-30", "30-40", "40-50", "50-60", ">60"], 
            "Age Distribution of Applicants");
    }

    // Draw bar chart using Chart.js
    function drawBarChart(chartId, chartData, labels, titleText) {
        const chartCanvas = document.getElementById(chartId);
        if (!chartCanvas) return;
        
        // Destroy existing chart instance if it exists
        if (chartInstances[chartId]) {
            chartInstances[chartId].destroy();
        }
        
        chartInstances[chartId] = new Chart(chartCanvas, {
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

    // Process data for application source and gender charts
    function updateCharts(data, selectedJob, selectedYear) {
        if (!data) return;
        
        let filteredData = applyFilters(data, selectedJob, selectedYear);
        let metrics = processChartData(filteredData);
        
        renderChart('applicationsChart', metrics.applicationSources, 'bar');
        renderChart('genderChart', { Male: metrics.genderRatio.male, Female: metrics.genderRatio.female }, 'doughnut');
    }

    // Apply filters to data for charts
    function applyFilters(data, selectedJob, selectedYear) {
        if (!data || !data.candidates || !data.applications || !data.jobPostings) {
            return { candidates: {} };
        }
        
        let filteredCandidates = {};

        Object.values(data.applications).forEach(app => {
            const candidate = data.candidates[app.candidate_id];
            const job = data.jobPostings[app.job_id];

            if (!candidate || !job) return;

            const appYear = app.application_date ? app.application_date.substring(0, 4) : "";
            
            if ((selectedJob === "" || job.title === selectedJob) &&
                (selectedYear === "all" || appYear === selectedYear)) {
                filteredCandidates[candidate.candidateId] = candidate;
            }
        });
        
        return { ...data, candidates: filteredCandidates };
    }

    // Process data for application source and gender charts
    function processChartData(data) {
        let metrics = { 
            applicationSources: {}, 
            genderRatio: { male: 0, female: 0 } 
        };
        
        if (data.candidates) {
            Object.values(data.candidates).forEach(candidate => {
                // Process application sources
                const source = candidate.source || 'Unknown';
                metrics.applicationSources[source] = (metrics.applicationSources[source] || 0) + 1;
                
                // Process gender ratio
                if (candidate.gender) {
                    const gender = candidate.gender.toLowerCase();
                    if (gender === 'male') {
                        metrics.genderRatio.male++;
                    } else if (gender === 'female') {
                        metrics.genderRatio.female++;
                    }
                }
            });
        }
        
        return metrics;
    }

    // Render chart using Chart.js
    function renderChart(chartId, data, type) {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) return;
        
        const ctx = chartElement.getContext('2d');
        
        // Destroy existing chart instance if it exists
        if (chartInstances[chartId]) {
            chartInstances[chartId].destroy();
        }
        
        chartInstances[chartId] = new Chart(ctx, {
            type: type,
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: type === 'doughnut' ? ['#FCB334', '#1EBBF0'] : '#1EBBF0',
                    borderColor: '#1EBBF0',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: type === 'doughnut' ? '65%' : undefined,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // Update all charts based on current filters
    function updateAllCharts() {
        const selectedJob = document.getElementById("jobFilter")?.value || "";
        const selectedYear = document.getElementById("yearSelect")?.value || "all";
        
        // Update recruitment metrics
        RecruitmentMetrics.update(allData, selectedJob, selectedYear);
        
        // Update hiring date and candidates age charts
        processHiringDate(allData?.applications, selectedJob, selectedYear);
        processCandidatesAge(allData?.applications, allData?.candidates, selectedJob, selectedYear);
        
        // Update application source and gender charts
        updateCharts(allData, selectedJob, selectedYear);
    }

    // Handle export functionality
    function handleExport() {
        const exportBtn = document.getElementById('exportBtn');
        if (!exportBtn) return;
        
        exportBtn.addEventListener('click', () => {
            const overlay = document.getElementById('overlay');
            const exportOptions = document.getElementById('exportOptions');
            
            if (overlay && exportOptions) {
                overlay.style.display = 'block';
                exportOptions.style.display = 'block';
            }
        });
        
        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const overlay = document.getElementById('overlay');
                const exportOptions = document.getElementById('exportOptions');
                
                if (overlay && exportOptions) {
                    overlay.style.display = 'none';
                    exportOptions.style.display = 'none';
                }
            });
        }
        
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                const selectedCharts = Array.from(document.querySelectorAll('.chart-checkbox:checked'));
                if (!selectedCharts.length) {
                    alert("Please select at least one chart to export");
                    return;
                }
                
                const zip = new JSZip();
                let processedCount = 0;
                const totalToProcess = selectedCharts.length;
                
                // Process each selected chart
                for (const checkbox of selectedCharts) {
                    try {
                        const chartId = checkbox.value;
                        let chartData, fileName;
                        
                        switch(chartId) {
                            case 'funnelChart':
                                // Process funnel chart data
                                const funnelStages = [
                                    'applications-recieved',
                                    'applications-screened',
                                    'technical-round',
                                    'management-round',
                                    'documents-collected',
                                    'salary-approved',
                                    'offer-accepted'
                                ];
                                
                                chartData = [['Stage', 'Count']];
                                funnelStages.forEach(stage => {
                                    const element = document.querySelector(`.graph-bar.${stage}`);
                                    if (element) {
                                        const count = element.dataset.count || 0;
                                        const label = element.parentElement.parentElement.querySelector('.data-heading').textContent.trim();
                                        chartData.push([label, parseInt(count)]);
                                    }
                                });
                                fileName = 'Recruitment_Funnel';
                                break;
                                
                            case 'applicationsChart':
                                // Process application sources chart
                                if (!chartInstances['applicationsChart']) {
                                    console.error('Applications chart not found');
                                    continue;
                                }
                                const appChart = chartInstances['applicationsChart'];
                                chartData = [['Source', 'Count']];
                                appChart.data.labels.forEach((label, i) => {
                                    chartData.push([label, appChart.data.datasets[0].data[i]]);
                                });
                                fileName = 'Application_Sources';
                                break;
                                
                            case 'genderChart':
                                // Process gender chart
                                if (!chartInstances['genderChart']) {
                                    console.error('Gender chart not found');
                                    continue;
                                }
                                const genderChart = chartInstances['genderChart'];
                                chartData = [['Gender', 'Count']];
                                genderChart.data.labels.forEach((label, i) => {
                                    chartData.push([label, genderChart.data.datasets[0].data[i]]);
                                });
                                fileName = 'Gender_Ratio';
                                break;
                                
                            case 'hireTimeChart':
                                case 'ageChart':
                                // Process bar charts (time to hire and age distribution)
                                const barChartId = chartId === 'hireTimeChart' ? 'barChartDuration' : 'barChartAge';
                                if (!chartInstances[barChartId]) {
                                    console.error(`${barChartId} not found`);
                                    continue;
                                }
                                const barChart = chartInstances[barChartId];
                                const xLabel = chartId === 'hireTimeChart' ? 'Days to Hire' : 'Age Range';
                                chartData = [[xLabel, 'Count']];
                                barChart.data.labels.forEach((label, i) => {
                                    chartData.push([label, barChart.data.datasets[0].data[i]]);
                                });
                                fileName = chartId === 'hireTimeChart' ? 'Time_to_Hire' : 'Age_Distribution';
                                break;
                                
                            default:
                                console.error(`Unknown chart type: ${chartId}`);
                                continue;
                        }
                        
                        // Only proceed if we have data
                        if (chartData && chartData.length > 1) {
                            const ws = XLSX.utils.aoa_to_sheet(chartData);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, fileName);
                            
                            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                            zip.file(`${fileName}.xlsx`, excelBuffer);
                            processedCount++;
                        }
                    } catch (error) {
                        console.error(`Error processing ${chartId}:`, error);
                    }
                }
                
                // Only create zip if we successfully processed at least one chart
                if (processedCount > 0) {
                    zip.generateAsync({ type: 'blob' }).then(content => {
                        saveAs(content, 'recruitment_data.zip');
                        
                        // Hide export options after download
                        const overlay = document.getElementById('overlay');
                        const exportOptions = document.getElementById('exportOptions');
                        if (overlay && exportOptions) {
                            overlay.style.display = 'none';
                            exportOptions.style.display = 'none';
                        }
                    });
                } else {
                    alert("No valid chart data was available for export");
                }
            });
        }
    }

    // Initialize the dashboard when DOM is loaded
    async function init() {
        try {
            
            if (statusElement) {
                statusElement.textContent = 'Fetching data from Firebase...';
            }
            
            const response = await axios.get(FIREBASE_DB_URL);
            allData = response.data;
            rawData = response.data;
            
            if (statusElement) {
                statusElement.textContent = 'Data received. Processing...';
            }
            
            // Set up job filter
            fetchJobTitles();
            
            // Set up year filter
            extractAvailableYears();
            setupYearFilterUI();
            
            // Initialize components
            updateAllCharts();
            FunnelChart.init(allData);
            
            // Setup event listeners for filters
            setupEventListeners();
            
            if (statusElement) {
                statusElement.textContent = 'Charts successfully rendered!';
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            if (statusElement) {
                statusElement.textContent = `Error fetching data: ${error.message}`;
            }
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        const jobFilter = document.getElementById("jobFilter");
        if (jobFilter) {
            jobFilter.addEventListener("change", function() {
                selectedJob = this.value;
                updateAllCharts();
            });
        }
        
        // Handle export functionality
        handleExport();
    }

    // Initialize when DOM is loaded
    document.addEventListener("DOMContentLoaded", ()=>{
        init();
        const yearSelect = document.getElementById("yearSelect");

    if (yearSelect.options.length > 1) {
        yearSelect.selectedIndex = 1; // Select the second option
        yearSelect.dispatchEvent(new Event("change", { bubbles: true })); // Trigger change event
    }

    });

    // Return public methods
    return {
        init,
        updateAllCharts
    };
}

// Recruitment Metrics Module
const RecruitmentMetrics = (function() {
    // Process data and calculate metrics
    function processData(data, selectedJob, selectedYear) {
        if (!data || !data.applications || !data.jobPostings) {
            return defaultMetrics();
        }
        
        const metrics = defaultMetrics();
        const jobIdMap = createJobIdMap(data.jobPostings);

        let acceptedOffers = 0;
        let totalOffers = 0;
        let totalHireDays = 0;
        let hireCount = 0;
        let totalApplications = 0;
        let totalJobs = 0;
        let filteredApplications = [];

        // Apply filters on applications
        Object.values(data.applications).forEach(app => {
            if (!app.application_date) return;
            
            let applicationYear = new Date(app.application_date).getFullYear().toString();

            if ((selectedYear === "all" || applicationYear === selectedYear) && 
                (selectedJob === "" || jobIdMap[selectedJob] === app.job_id)) {
                filteredApplications.push(app);
            }
        });

        // Calculate total hired and offer acceptance
        filteredApplications.forEach(app => {
            if (app.application_status === "Offer accepted") {
                metrics.totalHired++;
                acceptedOffers++;
            }
            if (app.hire_date && app.hire_date !== "N/A") {
                totalOffers++;
            }
        });

        // Calculate open and closed positions
        Object.values(data.jobPostings).forEach(job => {
            if ((selectedJob === "" || jobIdMap[selectedJob] === job.job_id) &&
                (selectedYear === "all" || (job.posted_date && job.posted_date.startsWith(selectedYear)))) {
                
                if (job.job_status === "Open") {
                    metrics.openPositions++;
                } else if (job.job_status === "Closed") {
                    metrics.closedPositions++;
                }
                totalJobs++;
            }
        });

        // Calculate avg applications per job
        totalApplications = filteredApplications.length;
        metrics.avgApplicationsPerJob = totalJobs > 0 ? 
            (totalApplications / totalJobs).toFixed(1) : "N/A";

        // Calculate avg time to hire
        filteredApplications.forEach(app => {
            if (app.hire_date && app.hire_date !== "N/A" && app.application_status === "Offer accepted") {
                const applicationDate = new Date(app.application_date);
                const hireDate = new Date(app.hire_date);
                
                if (!isNaN(applicationDate.getTime()) && !isNaN(hireDate.getTime())) {
                    const timeToHire = Math.abs((hireDate - applicationDate) / (1000 * 60 * 60 * 24)); // in days
                    totalHireDays += timeToHire;
                    hireCount++;
                }
            }
        });

        metrics.avgTimeToHire = hireCount > 0 ? 
            (totalHireDays / hireCount).toFixed(1) : "N/A";
            
        metrics.offerAcceptanceRate = totalOffers > 0 ? 
            ((acceptedOffers / totalOffers) * 100).toFixed(1) : "N/A";

        return metrics;
    }

    // Create a default metrics object with zero values
    function defaultMetrics() {
        return {
            totalHired: 0,
            openPositions: 0,
            closedPositions: 0,
            avgApplicationsPerJob: "N/A",
            avgTimeToHire: "N/A",
            offerAcceptanceRate: "N/A"
        };
    }

    // Create a mapping of job titles to job IDs
    function createJobIdMap(jobPostings) {
        if (!jobPostings) return {};
        
        const map = {};
        Object.entries(jobPostings).forEach(([jobId, job]) => {
            if (job.title) {
                map[job.title] = jobId;
            }
        });
        return map;
    }

    // Update the UI with calculated metrics
    function updateUI(metrics) {
        const elements = {
            totalHired: document.getElementById('totalHired'),
            openPositions: document.getElementById('openPositions'),
            closedPositions: document.getElementById('closedPositions'),
            applicationsPerHire: document.getElementById('applicationsPerHire'),
            daysPerHire: document.getElementById('daysPerHire'),
            offerAcceptanceRate: document.getElementById('offerAcceptanceRate')
        };
        
        // Update each element if it exists
        if (elements.totalHired) elements.totalHired.textContent = metrics.totalHired;
        if (elements.openPositions) elements.openPositions.textContent = metrics.openPositions;
        if (elements.closedPositions) elements.closedPositions.textContent = metrics.closedPositions;
        if (elements.applicationsPerHire) elements.applicationsPerHire.textContent = metrics.avgApplicationsPerJob;
        if (elements.daysPerHire) elements.daysPerHire.textContent = metrics.avgTimeToHire;
        if (elements.offerAcceptanceRate) {
            elements.offerAcceptanceRate.textContent = metrics.offerAcceptanceRate === "N/A" ? 
                metrics.offerAcceptanceRate : `${metrics.offerAcceptanceRate}%`;
        }
    }

    // Public methods
    return {
        init: async function(selectedJob="", selectedYear="all") {
            try {
                const response = await axios.get("https://recruitmentanalyticsdashboard-default-rtdb.firebaseio.com/.json");
                if (!response.data) {
                    console.error("No data received from Firebase.");
                    return;
                }
                
                const metrics = processData(response.data, selectedJob, selectedYear);
                updateUI(metrics);
            } catch (error) {
                console.error("Error in RecruitmentMetrics.init:", error);
            }
        },
        update: function(data, selectedJob="", selectedYear="all") {
            if (!data) return;
            const metrics = processData(data, selectedJob, selectedYear);
            updateUI(metrics);
        }
    };
})();

// Funnel Chart Module (placeholder implementation)
// Funnel Chart Module with fixes
const FunnelChart = (function() {
    let subscribers = []; // Local subscribers array if needed
    
    const stageHierarchy = [
        "applicationsReceived",
        "applicationsScreened",
        "technicalRoundCompleted",
        "managementRoundCompleted",
        "documentsCollected",
        "salaryApproved",
        "offerAccepted"
    ];

    const statusToStage = {
        "Applications Screened": "applicationsScreened",
        "Technical Interview Completed": "technicalRoundCompleted",
        "Management Interview Completed": "managementRoundCompleted",
        "Documents collected": "documentsCollected",
        "Salary approved": "salaryApproved",
        "Offer accepted": "offerAccepted"
    };

    // Calculate funnel data with fixed stage progression logic
    function calculateFunnelData(applications) {
        
        
        // Initialize all stages to 0
        const funnelData = Object.fromEntries(stageHierarchy.map(stage => [stage, 0]));
        
        // All applications start at the received stage
        funnelData.applicationsReceived = Object.keys(applications || {}).length;
        
        // Count applications at each stage
        Object.values(applications || {}).forEach(app => {
            // Find the current stage for this application
            const currentStage = statusToStage[app.application_status];
            
            // If we found a valid stage, increment all stages up to and including this one
            if (currentStage) {
                const currentStageIndex = stageHierarchy.indexOf(currentStage);
                // Increment counts for all stages up to and including the current stage
                for (let i = 1; i <= currentStageIndex; i++) {
                    funnelData[stageHierarchy[i]]++;
                }
            }
        });
        
        
        return funnelData;
    }

    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'funnel-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '14px';
        tooltip.style.zIndex = '100';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        return tooltip;
    }


    // Update the visual funnel chart
    function update(funnelData) {
      
        
        const stageClasses = {
            "applicationsReceived": "applications-recieved",
            "applicationsScreened": "applications-screened",
            "technicalRoundCompleted": "technical-round",
            "managementRoundCompleted": "management-round",
            "documentsCollected": "documents-collected",
            "salaryApproved": "salary-approved",
            "offerAccepted": "offer-accepted"
        };

        // Avoid division by zero by using 1 as minimum
        const maxApplicants = Math.max(funnelData.applicationsReceived || 0, 1);
        let lastStagePercentage = 0;

        Object.entries(stageClasses).forEach(([key, className]) => {
            const bar = document.querySelector(`.graph-bar.${className}`);
          
            
            if (bar) {
                const count = funnelData[key] || 0;
                const percentage = (count / maxApplicants) * 100;
                
                bar.style.width = `${percentage}%`;
                bar.dataset.count = count;
                bar.dataset.percentage = percentage.toFixed(1);
                
                // Update the count display if it exists
                const countElement = bar.querySelector('.count');
                if (countElement) {
                    countElement.textContent = count;
                }
                
                if (key === "offerAccepted") {
                    lastStagePercentage = percentage.toFixed(1);
                }
            } else {
                console.warn(`Element with class .graph-bar.${className} not found`);
            }
        });

        // const maxApplicants = funnelData.applicationsReceived || 1;
        // let lastStagePercentage = 0;

        // Create or find tooltip
        let tooltip = document.querySelector('.funnel-tooltip');
        if (!tooltip) {
            tooltip = createTooltip();
        }

        Object.entries(stageClasses).forEach(([key, className]) => {
            const bar = document.querySelector(`.graph-bar.${className}`);
            if (bar && funnelData[key] !== undefined) {
                const percentage = (funnelData[key] / maxApplicants) * 100;
                bar.style.width = `${percentage}%`;
                
                // Store data attributes for tooltip
                bar.dataset.count = funnelData[key];
                bar.dataset.percentage = percentage.toFixed(1);
                
                if (key === "offerAccepted") {
                    lastStagePercentage = percentage.toFixed(1);
                }

                // Add hover events for tooltip
                bar.addEventListener('mouseenter', (e) => {
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `
                        <div><strong>${key.replace(/([A-Z])/g, ' $1').trim()}</strong></div>
                        <div>Count: ${funnelData[key]}</div>
                        <div>Percentage: ${percentage.toFixed(1)}%</div>
                    `;
                });

                bar.addEventListener('mousemove', (e) => {
                    tooltip.style.left = `${e.pageX + 10}px`;
                    tooltip.style.top = `${e.pageY + 10}px`;
                });

                bar.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });
            }
        });

        // Update the final percentage display
        const finalPercentageElement = document.querySelector(".width-line-final p");
        if (finalPercentageElement) {
            finalPercentageElement.textContent = `${lastStagePercentage}%`;
        } else {
            console.warn("Final percentage element not found");
        }
    }

    // Process data with filters
    function processData(data, selectedJob, selectedYear) {
       
        
        if (!data || !data.applications) {
            console.warn("No applications data available");
            return calculateFunnelData({});
        }
        
        // Create job ID map
        const jobIdMap = {};
        if (data.jobPostings) {
            Object.entries(data.jobPostings).forEach(([jobId, job]) => {
                if (job.title) {
                    jobIdMap[job.title] = jobId;
                }
            });
        }
        
        // Filter applications based on job and year
        const filteredApplications = {};
        Object.entries(data.applications).forEach(([appId, app]) => {
            if (!app.application_date) return;
            
            const applicationYear = new Date(app.application_date).getFullYear().toString();
            const jobId = app.job_id;
            const selectedJobId = selectedJob ? jobIdMap[selectedJob] : null;
            
            if ((selectedYear === "all" || applicationYear === selectedYear) && 
                (!selectedJobId || jobId === selectedJobId)) {
                filteredApplications[appId] = app;
            }
        });
        
        return calculateFunnelData(filteredApplications);
    }

    return {
        init: function(initialData) {
            
            
            if (!initialData) {
                console.warn("No initial data provided to FunnelChart.init");
                return;
            }
            
            // Initial update with all data
            const funnelData = calculateFunnelData(initialData.applications || {});
            update(funnelData);
            
            // Listen for filter changes
            // This replaces the missing 'subscribe' function
            const jobFilter = document.getElementById("jobFilter");
            const yearSelect = document.getElementById("yearSelect");
            
            if (jobFilter) {
                jobFilter.addEventListener("change", function() {
                    const selectedJob = this.value;
                    const selectedYear = yearSelect ? yearSelect.value : "all";
                    const funnelData = processData(initialData, selectedJob, selectedYear);
                    update(funnelData);
                });
            }
            
            if (yearSelect) {
                yearSelect.addEventListener("change", function() {
                    const selectedJob = jobFilter ? jobFilter.value : "";
                    const selectedYear = this.value;
                    const funnelData = processData(initialData, selectedJob, selectedYear);
                    update(funnelData);
                });
            }
            

        },
        
        // Method to be called when filters change
        update: function(data, selectedJob="", selectedYear="all") {
            
            if (!data) {
                console.warn("No data provided to FunnelChart.update");
                return;
            }
            
            const funnelData = processData(data, selectedJob, selectedYear);
            update(funnelData);
        }
    };
})();

// Initialize the dashboard
initializeDashboard();

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
