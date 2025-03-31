document.addEventListener('DOMContentLoaded', () => {
    // Authentication Check
    function checkAuth() {
        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
            window.location.href = './login.html'; // Adjust path as per your structure
        }
    }

    // Run auth check on load
    checkAuth();

    // Display Username and Role from sessionStorage
    const userDetails = JSON.parse(sessionStorage.getItem('userDetails')) || {};
    const username = userDetails.username || 'Admin'; // Fallback to 'Admin' if not found
    const role = sessionStorage.getItem('role') || '';
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const avatarElement = document.getElementById('avatar');

    userNameElement.textContent = username;
    userRoleElement.textContent = role;
    avatarElement.textContent = username.charAt(0).toUpperCase(); // Set avatar to first letter

    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const toggleBtn = document.getElementById('toggleSidebar');

    function isMobile() {
        return window.innerWidth <= 992;
    }

    if (isMobile()) {
        sidebar.classList.add('collapsed');
        content.classList.add('expanded');
    }

    toggleBtn.addEventListener('click', function() {
        if (isMobile()) {
            sidebar.classList.toggle('expanded');
        } else {
            sidebar.classList.toggle('collapsed');
            content.classList.toggle('expanded');
        }
    });

    window.addEventListener('resize', function() {
        if (isMobile()) {
            if (!sidebar.classList.contains('collapsed') && !sidebar.classList.contains('expanded')) {
                sidebar.classList.add('collapsed');
                content.classList.add('expanded');
            }
        } else {
            sidebar.classList.remove('expanded');
            if (!sidebar.classList.contains('collapsed')) {
                content.classList.remove('expanded');
            }
        }
    });

    // Chart Configurations
    new Chart(document.getElementById('subscriberGrowthChart'), {
        type: 'line',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
            datasets: [{
                label: 'Subscribers',
                data: [800, 900, 950, 1100, 1200],
                borderColor: '#0a21c0',
                backgroundColor: 'rgba(10, 33, 192, 0.2)',
                pointBackgroundColor: '#0a21c0',
                pointRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, ticks: { font: { size: 14 } } },
                x: { ticks: { font: { size: 14 } } }
            },
            plugins: { legend: { display: true, position: 'top', labels: { font: { size: 14 } } } }
        }
    });

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
            plugins: { legend: { position: 'top', align: 'center', labels: { font: { size: 14 } } } }
        }
    });

    new Chart(document.getElementById('revenueTrendChart'), {
        type: 'line',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [8000, 9500, 11000, 13000, 15000],
                borderColor: '#000000',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                pointBackgroundColor: '#000000',
                pointRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, ticks: { font: { size: 14 } } },
                x: { ticks: { font: { size: 14 } } }
            },
            plugins: { legend: { display: true, position: 'top', labels: { font: { size: 14 } } } }
        }
    });

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
                y: { beginAtZero: true, ticks: { font: { size: 14 } } },
                x: { ticks: { font: { size: 14 } } }
            },
            plugins: { legend: { display: true, position: 'top', labels: { font: { size: 14 } } } }
        }
    });

    new Chart(document.getElementById('customerAcquisitionChart'), {
        type: 'line',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
            datasets: [{
                label: 'New Customers',
                data: [50, 60, 45, 70, 80],
                borderColor: '#b3b4b3',
                backgroundColor: 'rgba(179, 180, 179, 0.2)',
                pointBackgroundColor: '#b3b4b3',
                pointRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, ticks: { font: { size: 14 } } },
                x: { ticks: { font: { size: 14 } } }
            },
            plugins: { legend: { display: true, position: 'top', labels: { font: { size: 14 } } } }
        }
    });

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
                y: { beginAtZero: true, ticks: { font: { size: 14 } } },
                x: { ticks: { font: { size: 14 } } }
            },
            plugins: { legend: { position: 'top', align: 'center', labels: { font: { size: 14 } } } }
        }
    });

    // Logout Functionality
    const logoutBtn = document.getElementById('logoutBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadingOverlay.style.display = 'flex';
        fetch('http://localhost:8080/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}` }
        })
        .then(() => {
            sessionStorage.clear();
            setTimeout(() => {
                window.location.href = './login.html'; // Adjust path as per your structure
            }, 1500);
        })
        .catch(error => {
            console.error('Logout Error:', error);
            sessionStorage.clear();
            setTimeout(() => {
                window.location.href = '../login.html'; // Adjust path as per your structure
            }, 1500);
        });
    });

    // Prevent back button access
    window.addEventListener('popstate', () => {
        checkAuth();
    });

    // Push initial state to history
    history.pushState(null, null, window.location.href);
});