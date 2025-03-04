let dashboardData = {};
let turnoverChart = null;
let recruitmentChart = null;

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Fetch and initialize dashboard data
async function initializeDashboard() {
    try {
        const response = await fetch('data.json');
        dashboardData = await response.json();
        console.log('Initial data loaded:', dashboardData);
        
        // Update current metrics
        updateCurrentMetrics(dashboardData.currentMetrics);
        
        // Initialize charts
        initializeCharts(dashboardData.monthlyData['2024']);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Read Excel file
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                console.log('Parsed Excel Data:', jsonData); // Add this log
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });
}

// Merge Excel data with existing dashboard data
function mergeExcelData(excelData) {
    try {
        console.log('Processing Excel data:', excelData);
        
        const monthlyData = {
            labels: MONTHS,
            turnover: {
                joining: new Array(12).fill(0),
                leaving: new Array(12).fill(0)
            },
            recruitment: {
                target: new Array(12).fill(0),
                achieved: new Array(12).fill(0)
            }
        };

        excelData.forEach(row => {
            const monthName = row.Month || row.month || '';
            const monthIndex = MONTHS.findIndex(m => m.toLowerCase() === monthName.toLowerCase());

            console.log(monthIndex, monthName, row);
            
            if (monthIndex !== -1) {
                console.log('Processing row:', row);
                monthlyData.turnover.joining[monthIndex] = Number(row.Joining || row.joining || 0);
                monthlyData.turnover.leaving[monthIndex] = Number(row.Leaving || row.leaving || 0);
                monthlyData.recruitment.target[monthIndex] = Number(row.Target || row.target || 0);
                monthlyData.recruitment.achieved[monthIndex] = Number(row.Achieved || row.achieved || 0);
            }
        });

        console.log('Processed monthly data:', monthlyData);

        dashboardData.monthlyData['2024'] = monthlyData;
        
        if (excelData.length > 0) {
            const latest = excelData[excelData.length - 1];
            dashboardData.currentMetrics = {
                recruitmentTarget: Number(latest.Target || latest.target || 0),
                currentEmployees: Number(latest.CurrentEmployees || latest.currentEmployees || dashboardData.currentMetrics.currentEmployees),
                monthlyTurnover: {
                    joining: Number(latest.Joining || latest.joining || 0),
                    leaving: Number(latest.Leaving || latest.leaving || 0)
                }
            };
        }

        updateCurrentMetrics(dashboardData.currentMetrics);
        initializeCharts(dashboardData.monthlyData['2024']);
    } catch (error) {
        console.error('Error in mergeExcelData:', error);
        throw new Error('Failed to process Excel data');
    }
}

// Update current metrics
function updateCurrentMetrics(metrics) {
    document.getElementById('recruitment-target').innerText = metrics.recruitmentTarget;
    document.getElementById('current-employees').innerText = metrics.currentEmployees;
    document.getElementById('employees-in').innerText = metrics.monthlyTurnover.joining;
    document.getElementById('employees-out').innerText = metrics.monthlyTurnover.leaving;
}

// Initialize charts
function initializeCharts(monthlyData) {
    try {
        console.log('Initializing charts with data:', monthlyData);

        // Destroy existing charts if they exist
        if (turnoverChart) {
            turnoverChart.destroy();
        }
        if (recruitmentChart) {
            recruitmentChart.destroy();
        }

        // Initialize Turnover Chart
        const turnoverCtx = document.getElementById('turnoverChart');
        if (!turnoverCtx) {
            console.error('Turnover chart canvas not found');
            return;
        }

        turnoverChart = new Chart(turnoverCtx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Employees Joining',
                        data: monthlyData.turnover.joining,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Employees Leaving',
                        data: monthlyData.turnover.leaving,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Initialize Recruitment Progress Chart
        const recruitmentCtx = document.getElementById('recruitmentChart');
        if (!recruitmentCtx) {
            console.error('Recruitment chart canvas not found');
            return;
        }

        recruitmentChart = new Chart(recruitmentCtx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Target',
                        data: monthlyData.recruitment.target,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Achieved',
                        data: monthlyData.recruitment.achieved,
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        console.log('Charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Initialize the dashboard when the page loads
// Add this inside the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    // First initialize dashboard with JSON data
    await initializeDashboard();
    
    // Set up the upload button click handler
    const fileInput = document.getElementById('excelFile');
    
    if (fileInput) {

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            const statusDiv = document.getElementById('uploadStatus');
            
            if (!file) {
                statusDiv.innerHTML = '<span class="text-red-500">Please select a file first!</span>';
                return;
            }

            statusDiv.innerHTML = '<span class="text-blue-500">Reading file...</span>';

            try {
                console.log('Reading file:', file.name);
                const data = await readExcelFile(file);
                console.log('Excel data before merge:', data);
                mergeExcelData(data);
                statusDiv.innerHTML = '<span class="text-green-500">Data successfully imported!</span>';
            } catch (error) {
                console.error('Error processing Excel:', error);
                statusDiv.innerHTML = `<span class="text-red-500">Error: ${error.message}</span>`;
            }
        });
    }
});
