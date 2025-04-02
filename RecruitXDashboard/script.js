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

// Global Filter Module
const GlobalFilter = (function() {
    let currentYear = 'all'; // Default to show all years
    let allData = null;
    let subscribers = [];
    let availableYears = new Set();

    async function init() {
        try {
            const response = await axios.get(`${FIREBASE_DB_URL}/.json`);
            allData = response.data;
            extractAvailableYears();
            setupYearFilterUI();
            notifySubscribers();
        } catch (error) {
            console.error('Error initializing global filter:', error);
        }
    }

    function extractAvailableYears() {
        // Extract years from applications
        if (allData.applications) {
            Object.values(allData.applications).forEach(app => {
                if (app.application_date) {
                    availableYears.add(app.application_date.substring(0, 4)); //slive the year and add to the set
                }
            });
        }
        
        // Extract years from job postings
        if (allData.jobPostings) {
            Object.values(allData.jobPostings).forEach(job => {
                if (job.posted_date) availableYears.add(job.posted_date.substring(0, 4));
                if (job.closed_date && job.closed_date !== "N/A") {
                    availableYears.add(job.closed_date.substring(0, 4));
                }
            });
        }
    }

    function setupYearFilterUI() {   //creates the ui for select and notify all subscribers when change event triggers
        const yearSelect = document.getElementById('yearSelect');
        if (!yearSelect) {
            console.warn('Year filter select element not found');
            return;
        }
        
        // Clear existing options
        yearSelect.innerHTML = '';
        
        // Add "All Years" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Years';
        yearSelect.appendChild(allOption);
        
        // Add available years sorted in descending order
        Array.from(availableYears).sort().reverse().forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
        
        yearSelect.addEventListener('change', (e) => {
            currentYear = e.target.value;
            notifySubscribers();
        });
    }

    function filterData() {
        if (!allData) return null;
        
        if (currentYear === 'all') {
            // Return complete unfiltered data when "All Years" is selected
            return {
                applications: {...allData.applications},
                candidates: {...allData.candidates},
                jobPostings: {...allData.jobPostings}
            };
        }
        
        const filtered = {
            applications: {},
            candidates: {},
            jobPostings: {}
        };

        // Filter applications
        if (allData.applications) {
            Object.entries(allData.applications).forEach(([key, app]) => {
                if (app.application_date && app.application_date.includes(currentYear)) {
                    filtered.applications[key] = app;
                }
            });
        }

        // Filter job postings
        if (allData.jobPostings) {
            Object.entries(allData.jobPostings).forEach(([key, job]) => {
                if ((job.posted_date && job.posted_date.includes(currentYear)) || 
                    (job.closed_date && job.closed_date.includes(currentYear))) {
                    filtered.jobPostings[key] = job;
                }
            });
        }

        // Get relevant candidates from applications
        if (allData.candidates) {
            const candidateIds = new Set();
            Object.values(filtered.applications).forEach(app => {
                if (app.candidate_id) candidateIds.add(app.candidate_id);
            });
            
            candidateIds.forEach(id => {
                if (allData.candidates[id]) {
                    filtered.candidates[id] = allData.candidates[id];
                }
            });
        }

        return filtered;
    }

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

    return {
        init,
        subscribe: (callback) => {
            subscribers.push(callback);
            if (allData) callback(filterData());
        },
        getCurrentYear: () => currentYear,
        getAvailableYears: () => Array.from(availableYears).sort().reverse()
    };
})();

const FunnelChart = (function() {
    // Define the stage hierarchy in order
    const stageHierarchy = [
        "applicationsReceived",
        "applicationsScreened",
        "technicalRoundCompleted",
        "managementRoundCompleted",
        "documentsCollected",
        "salaryApproved",
        "offerAccepted"
    ];
    
    // Map statuses to their corresponding funnel stages
    const statusToStage = {
        "Applications Screened": "applicationsScreened",
        "Technical Interview Completed": "technicalRoundCompleted",
        "Management Interview Completed": "managementRoundCompleted",
        "Documents collected": "documentsCollected",
        "Salary approved": "salaryApproved",
        "Offer accepted": "offerAccepted"
    };

    function calculateFunnelData(applications) {
        const funnelData = {
            applicationsReceived: 0,
            applicationsScreened: 0,
            technicalRoundCompleted: 0,
            managementRoundCompleted: 0,
            documentsCollected: 0,
            salaryApproved: 0,
            offerAccepted: 0
        };

        // Count applications at each stage
        Object.values(applications).forEach(app => {
            // Every application counts in the initial stage
            funnelData.applicationsReceived++;
            
            // Determine which stages to increment based on current status
            const currentStage = statusToStage[app.application_status];
            
            if (currentStage) {
                // Find the index of the current stage in hierarchy
                const currentStageIndex = stageHierarchy.indexOf(currentStage);
                
                // Increment all stages up to and including the current one
                for (let i = 1; i <= currentStageIndex; i++) {
                    const stage = stageHierarchy[i];
                    funnelData[stage]++;
                }
            }
            // If no status matched, the application only counts in applicationsReceived
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

        // Find the maximum value for scaling
        const maxApplicants = funnelData.applicationsReceived || 1;
        let lastStagePercentage = 0;

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

        // Update final percentage
        const finalPercentageElement = document.querySelector(".width-line-final p");
        if (finalPercentageElement) {
            finalPercentageElement.textContent = `${lastStagePercentage}%`;
        }
    }

    // Public API
    return {
        init: function() {
            // Add CSS for tooltip
            const style = document.createElement('style');
            style.textContent = `
                .funnel-tooltip {
                    position: absolute;
                    pointer-events: none;
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    z-index: 100;
                    display: none;
                }
                .graph-bar {
                    transition: width 0.3s ease;
                    position: relative;
                    cursor: pointer;
                }
                .graph-bar:hover {
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(style);

            // Subscribe to global filter changes
            GlobalFilter.subscribe((filteredData) => {
                if (filteredData && filteredData.applications) {
                    const funnelData = calculateFunnelData(filteredData.applications);
                    update(funnelData);
                }
            });
        }
    };
})();

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    GlobalFilter.init();
    FunnelChart.init();
});