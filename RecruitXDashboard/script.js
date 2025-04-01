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
