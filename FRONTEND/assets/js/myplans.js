 const guestPages = [
    { id: "home", label: "Home", url: "../index.html" },
    { id: "plans", label: "Plans", url: "./plans.html" },
    { id: "support", label: "Support", url: "./support.html" },
    { id: "about", label: "About Us", url: "./about.html" }
];

const loggedInDropdownPages = [
    { id: "myplans", label: "My Plans", url: "./myplans.html" },
    { id: "transactions", label: "Transactions", url: "./transaction.html" },
    { id: "profile", label: "Profile", url: "./profilef.html" }
];

let currentPage = "myplans";
let plansData = { activePlans: [], pendingPlans: [], expiredPlans: [] };
let isLoggedIn = false;
let userInitials = "U";

// Check login status and set initials
function checkLoginStatus() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    isLoggedIn = !!loggedInUser && !!loggedInUser.accessToken;
    if (isLoggedIn) {
        const userDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails')) || {};
        userInitials = userDetails.firstName?.charAt(0)?.toUpperCase() || 'U';
    } else {
        isLoggedIn = false;
        userInitials = "U";
    }
}

// Generate navigation
function generateNavigation() {
    const navLinks = document.getElementById("nav-links");
    navLinks.innerHTML = "";

    checkLoginStatus();

    if (isLoggedIn) {
        guestPages.forEach(page => {
            const link = document.createElement("a");
            link.href = page.url;
            link.className = `nav-link ${currentPage === page.id ? 'active' : ''}`;
            link.textContent = page.label;
            link.onclick = function(e) {
                e.preventDefault();
                setCurrentPage(page.id);
            };
            navLinks.appendChild(link);
        });

        const dropdownDiv = document.createElement('div');
        dropdownDiv.className = 'dropdown';

        const avatar = document.createElement('div');
        avatar.className = 'user-avatar dropdown-toggle';
        avatar.id = 'profileDropdown';
        avatar.setAttribute('data-bs-toggle', 'dropdown');
        avatar.textContent = userInitials; // Ensure initial (e.g., "T") is set here
        dropdownDiv.appendChild(avatar);

        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu dropdown-menu-end';

        loggedInDropdownPages.forEach(page => {
            const link = document.createElement('a');
            link.href = page.url;
            link.className = `dropdown-item ${currentPage === page.id ? 'active' : ''}`;
            link.textContent = page.label;
            link.onclick = (e) => {
                e.preventDefault();
                setCurrentPage(page.id);
            };
            dropdownMenu.appendChild(link);
        });

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = 'dropdown-item';
        logoutLink.textContent = 'Logout';
        logoutLink.onclick = (e) => {
            e.preventDefault();
            logout();
        };
        dropdownMenu.appendChild(logoutLink);

        dropdownDiv.appendChild(dropdownMenu);
        navLinks.appendChild(dropdownDiv);
    } else {
        guestPages.forEach(page => {
            const link = document.createElement("a");
            link.href = page.url;
            link.className = `nav-link ${currentPage === page.id ? 'active' : ''}`;
            link.textContent = page.label;
            link.onclick = function(e) {
                e.preventDefault();
                setCurrentPage(page.id);
            };
            navLinks.appendChild(link);
        });

        const loginBtn = document.createElement("a");
        loginBtn.href = "../login.html";
        loginBtn.className = "btn login-btn";
        loginBtn.textContent = "Login";
        navLinks.appendChild(loginBtn);

        Swal.fire({
            icon: 'warning',
            title: 'Login Required',
            text: 'Please log in to view your plans.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0a21c0'
        }).then(() => {
            window.location.href = '../login.html';
        });
    }
}

// Set current page and navigate
function setCurrentPage(pageId) {
    currentPage = pageId;
    const guestPage = guestPages.find(p => p.id === pageId);
    const loggedInPage = loggedInDropdownPages.find(p => p.id === pageId);
    showLoadingOverlay();
    setTimeout(() => {
        if (guestPage) {
            window.location.href = guestPage.url;
        } else if (loggedInPage) {
            window.location.href = loggedInPage.url;
        }
        hideLoadingOverlay();
    }, 1000);
}

// Fetch user plans
async function fetchUserPlans() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const accessToken = loggedInUser?.accessToken;

    if (!accessToken) {
        Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Please log in to view your plans.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0a21c0'
        }).then(() => {
            window.location.href = '../login.html';
        });
        return;
    }

    showLoadingOverlay();
    try {
        const response = await fetch('http://localhost:8080/api/user/plans', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        plansData = {
            activePlans: data.activePlans || [],
            pendingPlans: data.pendingPlans || [],
            expiredPlans: data.expiredPlans || []
        };
        renderCurrentPlan(plansData.activePlans);
        renderPendingPlans(plansData.pendingPlans);
        renderExpiredPlans(plansData.expiredPlans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            Swal.fire({
                icon: 'warning',
                title: 'Session Expired',
                text: 'Your session has expired. Please log in again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#0a21c0'
            }).then(() => {
                logout();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load plans. Please try again later.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#0a21c0'
            });
        }
        renderCurrentPlan([]);
        renderPendingPlans([]);
        renderExpiredPlans([]);
    } finally {
        hideLoadingOverlay();
    }
}

// Render current plan
function renderCurrentPlan(activePlans) {
    const currentPlanSection = $('#currentPlanSection');
    currentPlanSection.empty();

    if (activePlans.length === 0) {
        currentPlanSection.html('<div class="no-plan-message">No active plan found.</div>');
        return;
    }

    activePlans.sort((a, b) => {
        if (a.category?.toLowerCase() === 'data' && b.category?.toLowerCase() !== 'data') return -1;
        if (a.category?.toLowerCase() !== 'data' && b.category?.toLowerCase() === 'data') return 1;
        return new Date(b.startDate) - new Date(a.startDate);
    });

    activePlans.forEach(plan => {
        const startDate = new Date(plan.startDate);
        const endDate = new Date(plan.endDate);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        currentPlanSection.append(`
            <div class="current-plan-card">
                <div class="current-plan-header">
                    <div class="plan-name">${plan.name || 'Unknown Plan'}</div>
                    <div class="plan-badge">${plan.status || 'Active'}</div>
                </div>
                <div class="plan-details">
                    <div class="plan-detail">
                        <div class="detail-label">Subscription Fee</div>
                        <div class="detail-value price-value">₹${plan.price?.toLocaleString() || '0'}/month</div>
                    </div>
                    <div class="plan-detail">
                        <div class="detail-label">Start Date</div>
                        <div class="detail-value">${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    <div class="plan-detail">
                        <div class="detail-label">End Date</div>
                        <div class="detail-value">${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    <div class="plan-detail">
                        <div class="detail-label">Days Remaining</div>
                        <div class="detail-value">${daysRemaining} days</div>
                    </div>
                </div>
                <div class="usage-info">
                    <div class="usage-item">
                        <div class="usage-label">Data</div>
                        <div class="usage-value">${plan.data || 'Unlimited'}</div>
                    </div>
                    <div class="usage-item">
                        <div class="usage-label">SMS</div>
                        <div class="usage-value">${plan.sms || 'Unlimited'}</div>
                    </div>
                    <div class="usage-item">
                        <div class="usage-label">Voice Minutes</div>
                        <div class="usage-value">${plan.calls || 'Unlimited'}</div>
                    </div>
                </div>
                <div class="plan-actions">
                    <button class="button button-secondary view-details" data-plan-id="${plan.id}" data-plan-type="active">View Details</button>
                    <button class="button">Renew Plan</button>
                </div>
            </div>
        `);
    });
}

// Render pending plans
function renderPendingPlans(pendingPlans) {
    const pendingPlansTableBody = $('#pendingPlansTableBody');
    pendingPlansTableBody.empty();

    if (pendingPlans.length === 0) {
        pendingPlansTableBody.html('<tr><td colspan="5" class="no-plan-message">No pending plans found.</td></tr>');
        return;
    }

    pendingPlans.forEach(plan => {
        const startDate = new Date(plan.startDate);
        pendingPlansTableBody.append(`
            <tr>
                <td data-label="Plan Name">${plan.name || 'Unknown Plan'}</td>
                <td data-label="Price">₹${plan.price?.toLocaleString() || '0'}</td>
                <td data-label="Start Date">${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td data-label="Status" class="status-${plan.status?.toLowerCase() || 'pending'}">${plan.status || 'Pending'}</td>
                <td data-label="Action">
                    <button class="table-button view-details" data-plan-id="${plan.id}" data-plan-type="pending">View</button>
                    <button class="table-button">Recharge</button>
                </td>
            </tr>
        `);
    });
}

// Render expired plans
function renderExpiredPlans(expiredPlans) {
    const expiredPlansTableBody = $('#expiredPlansTableBody');
    expiredPlansTableBody.empty();

    if (expiredPlans.length === 0) {
        expiredPlansTableBody.html('<tr><td colspan="5" class="no-plan-message">No expired plans found.</td></tr>');
        return;
    }

    expiredPlans.forEach(plan => {
        const endDate = new Date(plan.endDate);
        expiredPlansTableBody.append(`
            <tr>
                <td data-label="Plan Name">${plan.name || 'Unknown Plan'}</td>
                <td data-label="Price">₹${plan.price?.toLocaleString() || '0'}</td>
                <td data-label="End Date">${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td data-label="Status" class="status-${plan.status?.toLowerCase() || 'expired'}">${plan.status || 'Expired'}</td>
                <td data-label="Action">
                    <button class="table-button view-details" data-plan-id="${plan.id}" data-plan-type="expired">View</button>
                    <button class="table-button">Recharge</button>
                </td>
            </tr>
        `);
    });
}

// Logout function
function logout() {
    showLoadingOverlay();
    localStorage.clear();
    sessionStorage.clear();
    isLoggedIn = false;
    currentPage = 'home';
    generateNavigation();

    Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been logged out successfully.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0a21c0',
        timer: 1500,
        timerProgressBar: true,
        willClose: () => {
            hideLoadingOverlay();
            window.location.href = '../index.html';
        }
    });
}

// Toggle mobile menu
function toggleMenu() {
    document.getElementById("nav-links").classList.toggle("active");
}

// Show loading overlay
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// Hide loading overlay
function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Initialize page
$(document).ready(function() {
    generateNavigation();
    fetchUserPlans();

    const modal = $('#rechargeModal');
    const modalBody = $('#modalBody');
    const modalClose = $('#modalClose');
    const modalCancel = $('#modalCancel');
    const pendingPlanSearch = $('#pendingPlanSearch');
    const pendingCategoryFilter = $('#pendingCategoryFilter');
    const expiredPlanSearch = $('#expiredPlanSearch');
    const expiredCategoryFilter = $('#expiredCategoryFilter');
    const pendingPlansTableBody = $('#pendingPlansTableBody');
    const expiredPlansTableBody = $('#expiredPlansTableBody');

    $(document).on('click', '.view-details', function() {
        showLoadingOverlay();
        const planId = $(this).data('plan-id');
        const planType = $(this).data('plan-type');
        let plan;

        if (planType === 'active') {
            plan = plansData.activePlans.find(p => p.id === planId);
        } else if (planType === 'pending') {
            plan = plansData.pendingPlans.find(p => p.id === planId);
        } else if (planType === 'expired') {
            plan = plansData.expiredPlans.find(p => p.id === planId);
        }

        if (plan) {
            modalBody.html(`
                <div class="detail-row"><span class="detail-label">Plan Name:</span><span>${plan.name || 'Unknown'}</span></div>
                <div class="detail-row"><span class="detail-label">Category:</span><span>${plan.category || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Price:</span><span>₹${plan.price?.toLocaleString() || '0'}</span></div>
                <div class="detail-row"><span class="detail-label">Start Date:</span><span>${new Date(plan.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                <div class="detail-row"><span class="detail-label">End Date:</span><span>${new Date(plan.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                <div class="detail-row"><span class="detail-label">SMS:</span><span>${plan.sms || 'Unlimited'}</span></div>
                <div class="detail-row"><span class="detail-label">Calls:</span><span>${plan.calls || 'Unlimited'}</span></div>
                <div class="detail-row"><span class="detail-label">Data:</span><span>${plan.data || 'Unlimited'}</span></div>
                <div class="detail-row"><span class="detail-label">Benefits:</span><span>${plan.benefits?.join(', ') || 'None'}</span></div>
                <div class="detail-row"><span class="detail-label">Status:</span><span>${plan.status || 'N/A'}</span></div>
            `);
            setTimeout(() => {
                hideLoadingOverlay();
                modal.css('display', 'flex');
            }, 1000);
        }
    });

    modalClose.on('click', function() {
        modal.css('display', 'none');
    });

    modalCancel.on('click', function() {
        modal.css('display', 'none');
    });

    $(window).on('click', function(event) {
        if (event.target === modal[0]) {
            modal.css('display', 'none');
        }
    });

    function filterPlans(tableBody, plans, searchInput, categoryFilter) {
        const searchText = searchInput.val().toLowerCase();
        const selectedCategory = categoryFilter.val().toLowerCase();

        tableBody.find('tr').each(function() {
            const row = $(this);
            const planName = row.find('td:first-child').text().toLowerCase();
            const plan = plans.find(p => p.name?.toLowerCase() === planName);
            if (!plan) return;

            const matchesSearch = planName.includes(searchText);
            const matchesCategory = !selectedCategory || plan.category?.toLowerCase().includes(selectedCategory);

            if (matchesSearch && matchesCategory) {
                row.show();
            } else {
                row.hide();
            }
        });
    }

    pendingPlanSearch.on('input', function() {
        filterPlans(pendingPlansTableBody, plansData.pendingPlans, pendingPlanSearch, pendingCategoryFilter);
    });
    pendingCategoryFilter.on('change', function() {
        filterPlans(pendingPlansTableBody, plansData.pendingPlans, pendingPlanSearch, pendingCategoryFilter);
    });

    expiredPlanSearch.on('input', function() {
        filterPlans(expiredPlansTableBody, plansData.expiredPlans, expiredPlanSearch, expiredCategoryFilter);
    });
    expiredCategoryFilter.on('change', function() {
        filterPlans(expiredPlansTableBody, plansData.expiredPlans, expiredPlanSearch, expiredCategoryFilter);
    });
});