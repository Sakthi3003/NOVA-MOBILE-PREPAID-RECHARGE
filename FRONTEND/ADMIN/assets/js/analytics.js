document.addEventListener('DOMContentLoaded', () => {
    // Navbar Toggler Functionality
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Subscriber Growth - Line Chart (#0a21c0)
    new Chart(document.getElementById('subscriberGrowthChart'), {
        type: 'line',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
            datasets: [{
                label: 'Subscribers',
                data: [800, 900, 950, 1100, 1200],
                borderColor: '#0a21c0',
                backgroundColor: 'rgba(10, 33, 192, 0.2)', // Light fill for better visibility
                pointBackgroundColor: '#0a21c0',
                pointRadius: 5, // Larger points for mobile
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                },
                x: { 
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                }
            },
            plugins: {
                legend: { 
                    display: true, // Show legend on desktop
                    position: 'top',
                    labels: { font: { size: 14 } }
                }
            }
        }
    });

    // Plan Distribution - Pie Chart (#0a21c0, #000000, #b3b4b3)
    new Chart(document.getElementById('planDistributionChart'), {
        type: 'pie',
        data: {
            labels: ['UPI', 'NETBANKING', 'CARD'],
            datasets: [{
                data: [15, 20, 4],
                backgroundColor: ['#0a21c0', '#000000', '#b3b4b3'],
                borderColor: '#ffffff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'top', // Legend at top on desktop
                    align: 'center',
                    labels: { font: { size: 14 } } // Default font size for desktop
                }
            }
        }
    });

    // Revenue Trend - Line Chart (#000000)
    new Chart(document.getElementById('revenueTrendChart'), {
        type: 'line',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [8000, 9500, 11000, 13000, 15000],
                borderColor: '#000000',
                backgroundColor: 'rgba(0, 0, 0, 0.2)', // Light fill for better visibility
                pointBackgroundColor: '#000000',
                pointRadius: 5, // Larger points for mobile
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                },
                x: { 
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                }
            },
            plugins: {
                legend: { 
                    display: true, // Show legend on desktop
                    position: 'top',
                    labels: { font: { size: 14 } }
                }
            }
        }
    });

    // Plan Renewals - Bar Chart (#0a21c0)
    new Chart(document.getElementById('planRenewalsChart'), {
        type: 'bar',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
            datasets: [{
                label: 'Renewals',
                data: [20, 25, 30, 28, 35],
                backgroundColor: '#0a21c0',
                borderColor: '#0a21c0',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                },
                x: { 
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                }
            },
            plugins: {
                legend: { 
                    display: true, // Show legend on desktop
                    position: 'top',
                    labels: { font: { size: 14 } }
                }
            }
        }
    });

    // Customer Acquisition - Line Chart (#b3b4b3)
    new Chart(document.getElementById('customerAcquisitionChart'), {
        type: 'line',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
            datasets: [{
                label: 'New Customers',
                data: [50, 60, 45, 70, 80],
                borderColor: '#b3b4b3',
                backgroundColor: 'rgba(179, 180, 179, 0.2)', // Light fill for better visibility
                pointBackgroundColor: '#b3b4b3',
                pointRadius: 5, // Larger points for mobile
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                },
                x: { 
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                }
            },
            plugins: {
                legend: { 
                    display: true, // Show legend on desktop
                    position: 'top',
                    labels: { font: { size: 14 } }
                }
            }
        }
    });

    // Revenue by Plan - Bar Chart (#0a21c0, #000000, #b3b4b3)
    new Chart(document.getElementById('revenueByPlanChart'), {
        type: 'bar',
        data: {
            labels: ['Basic', 'Premium', 'Pro'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [5000, 8000, 2000],
                backgroundColor: ['#0a21c0', '#000000', '#b3b4b3'],
                borderColor: '#ffffff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                },
                x: { 
                    ticks: { 
                        font: { size: 14 }, // Default font size for desktop
                        display: true
                    }
                }
            },
            plugins: {
                legend: { 
                    position: 'top', // Legend at top on desktop
                    align: 'center',
                    labels: { font: { size: 14 } } // Default font size for desktop
                }
            }
        }
    });

    // Logout with Loading
    const logoutBtn = document.querySelector('.logout-btn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadingOverlay.style.display = 'flex';
        setTimeout(() => {
            window.location.href = logoutBtn.href;
        }, 1500);
    });
});