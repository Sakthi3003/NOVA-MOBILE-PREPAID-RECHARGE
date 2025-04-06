let token = sessionStorage.getItem('accessToken');
let refreshToken = sessionStorage.getItem('refreshToken');
let subscriberCurrentFilter = 'all';
let currentPage = 0;
let pageSize = 5;
let totalPages = 0;
let totalEntries = 0;
let searchQuery = '';
let sort = 'userId,asc';

const profileModal = document.getElementById('profileModal');
const errorMessage = document.getElementById('errorMessage');

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // Authentication Check
    function checkAuth() {
        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
            window.location.href = '../index.html';
        }
    }

    // Run auth check on load
    checkAuth();

    // Display Username and Role from sessionStorage
    const userDetails = JSON.parse(sessionStorage.getItem('userDetails')) || {};
    const username = userDetails.username || 'Admin';
    const role = sessionStorage.getItem('role') || '';
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const avatarElement = document.getElementById('avatar');

    userNameElement.textContent = username;
    userRoleElement.textContent = role;
    avatarElement.textContent = username.charAt(0).toUpperCase();

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

    // Setup other event listeners
    setupEventListeners();
    fetchSubscribers();
    checkRechargeStatus();

    // Prevent back button access
    window.addEventListener('popstate', () => {
        checkAuth();
    });

    // Push initial state to history
    history.pushState(null, null, window.location.href);
});

function setupEventListeners() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const userProfile = document.getElementById('userProfile');
    const subscriberSearchInput = document.getElementById('subscriberSearchInput');

    // Set active class based on current page
    const currentPagePath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const page = link.getAttribute('data-page');
        if (page && currentPagePath.includes(page)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target) && !profileModal.contains(e.target)) {
            profileModal.classList.remove('show');
        }
    });

    // Navigation click handler
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.classList.contains('logout-btn')) {
                return;
            }
            
            e.preventDefault();
            const href = this.getAttribute('href');
            
            if (href && href !== '#' && !this.classList.contains('active')) {
                if (isMobile() && sidebar.classList.contains('expanded')) {
                    sidebar.classList.remove('expanded');
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                } else {
                    window.location.href = href;
                }
            }
        });
    });

    // Search Functionality
    subscriberSearchInput.addEventListener('input', debounce(() => {
        searchQuery = subscriberSearchInput.value.trim();
        currentPage = 0;
        fetchSubscribers();
    }, 500));

    // Filter Buttons
    const subscriberFilterButtons = document.querySelectorAll('.subscriber-filter-btn');
    subscriberFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            document.querySelectorAll('.subscriber-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
            });
            subscriberCurrentFilter = filter;
            currentPage = 0;
            fetchSubscribers();
            showToast('Showing ' + filter.charAt(0).toUpperCase() + filter.slice(1) + ' Subscribers');
        });
    });

    // Sorting
    document.getElementById('subscriber-sort').addEventListener('change', () => {
        sort = document.getElementById('subscriber-sort').value;
        currentPage = 0;
        fetchSubscribers();
    });

    // Page Size
    document.getElementById('page-size').addEventListener('change', () => {
        pageSize = parseInt(document.getElementById('page-size').value);
        currentPage = 0;
        fetchSubscribers();
    });

    // Pagination
    document.getElementById('pagination').addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.closest('.page-link');
        if (!target) return;
        const page = target.dataset.page;
        if (page === 'prev' && currentPage > 0) {
            currentPage--;
        } else if (page === 'next' && currentPage < totalPages - 1) {
            currentPage++;
        } else if (!isNaN(page)) {
            currentPage = parseInt(page);
        }
        fetchSubscribers();
        showToast('Loading page ' + (currentPage + 1));
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
                window.location.href = '../index.html';
            }, 1500);
        })
        .catch(error => {
            console.error('Logout Error:', error);
            sessionStorage.clear();
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        });
    });
}

async function refreshAccessToken() {
    try {
        const response = await fetch('http://localhost:8080/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        token = data.accessToken;
        refreshToken = data.refreshToken;

        sessionStorage.setItem('accessToken', token);
        sessionStorage.setItem('refreshToken', refreshToken);

        return token;
    } catch (error) {
        handleLogout();
        return null;
    }
}

async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                return fetch(url, {
                    ...options,
                    headers
                });
            }
            return null;
        } else if (response.status === 403) {
            showErrorMessage('Permission Denied. You do not have permission to access this resource. Redirecting to login...');
            setTimeout(() => {
                handleLogout();
            }, 2000);
            return null;
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

function handleLogout() {
    sessionStorage.clear();
    token = null;
    refreshToken = null;
    window.location.href = '../index.html';
}

function showToast(message, type = 'success') {
    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    document.querySelector('.toast-container').appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 3000 });
    toast.show();
}

function showErrorMessage(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

async function checkRechargeStatus() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const response = await apiRequest('http://localhost:8080/api/admin/check-recharge-status', {
            method: 'POST',
            body: JSON.stringify({})
        });

        if (!response || !response.ok) {
            const errorData = await response?.json();
            throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'SUCCESS') {
            if (result.data && result.data.updated) {
                showToast('User statuses updated based on recharge activity', 'success');
                fetchSubscribers();
            }
        } else {
            throw new Error(result.message || 'Failed to check recharge status');
        }
    } catch (error) {
        console.error('Error checking recharge status:', error);
        let errorMsg = 'Failed to check recharge status. Please try again.';
        if (error.message.includes('401')) {
            showErrorMessage('Session expired. Redirecting to login...');
            setTimeout(() => {
                handleLogout();
            }, 2000);
        } else if (error.message.includes('403')) {
            showErrorMessage('Permission denied. Redirecting to login...');
            setTimeout(() => {
                handleLogout();
            }, 2000);
        } else {
            showErrorMessage(errorMsg);
        }
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

async function fetchSubscribers() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        let url = `http://localhost:8080/api/admin/subscribers?page=${currentPage}&size=${pageSize}&sort=${sort}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        if (subscriberCurrentFilter !== 'all') {
            url += `&status=${subscriberCurrentFilter}`;
        }

        const response = await apiRequest(url, {
            method: 'GET'
        });

        if (!response || !response.ok) {
            const errorData = await response?.json();
            throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
        }

        const apiResponse = await response.json();
        const pageData = apiResponse.data || apiResponse;
        const subscribers = pageData.content || [];

        renderSubscribersTable(subscribers);
        updatePagination(pageData);
    } catch (error) {
        console.error('Error loading subscribers:', error);
        let errorMsg = 'Failed to load subscribers. Please try again.';
        if (error.message.includes('401')) {
            showErrorMessage('Session expired. Redirecting to login...');
            setTimeout(() => {
                handleLogout();
            }, 2000);
        } else if (error.message.includes('403')) {
            showErrorMessage('Permission denied. Redirecting to login...');
            setTimeout(() => {
                handleLogout();
            }, 2000);
        } else {
            showErrorMessage(errorMsg);
        }
        renderSubscribersTable([]);
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function renderSubscribersTable(subscribers) {
    const tbody = document.querySelector('#subscribers-table tbody');
    tbody.innerHTML = '';

    subscribers.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-status', user.status.toLowerCase());
        row.setAttribute('data-user-id', user.userId);
        const lastRecharge = user.lastRechargeDate ? user.lastRechargeDate : 'N/A';
        row.innerHTML = `
            <td>${user.userId}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.phoneNumber || 'N/A'}</td>
            <td>${user.activationDate}</td>
            <td>${user.username}</td>
            <td><a href="mailto:${user.email}">${user.email}</a></td>
            <td>${user.address || 'N/A'}</td>
            <td>${lastRecharge}</td>
            <td><span class="status-badge status-${user.status.toLowerCase()}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
            <td>
                ${user.status === 'active' ? `
                    <button class="action-btn btn-danger subscriber-deactivate-btn" title="Deactivate"><i class="fas fa-power-off"></i></button>
                    <button class="action-btn btn-warning subscriber-suspend-btn" title="Suspend"><i class="fas fa-pause"></i></button>
                ` : (user.status === 'inactive' || user.status === 'suspended') ? `
                    <button class="action-btn btn-success subscriber-activate-btn" title="Activate"><i class="fas fa-play"></i></button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });

    setupSubscriberActionButtons();
}

function setupSubscriberActionButtons() {
    document.querySelectorAll('.subscriber-activate-btn').forEach(button => {
        button.addEventListener('click', handleSubscriberActivate);
    });

    document.querySelectorAll('.subscriber-deactivate-btn').forEach(button => {
        button.addEventListener('click', handleSubscriberDeactivate);
    });

    document.querySelectorAll('.subscriber-suspend-btn').forEach(button => {
        button.addEventListener('click', handleSubscriberSuspend);
    });
}

async function handleSubscriberActivate() {
    const row = this.closest('tr');
    const userId = row.getAttribute('data-user-id');
    const statusCell = row.querySelector('td:nth-child(9) .status-badge');
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const response = await apiRequest(`http://localhost:8080/api/admin/user/${userId}/activate`, {
            method: 'POST'
        });

        if (!response || !response.ok) {
            const errorData = await response?.json();
            throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'SUCCESS') {
            statusCell.className = 'status-badge status-active';
            statusCell.textContent = 'Active';
            row.setAttribute('data-status', 'active');
            this.className = 'action-btn btn-danger subscriber-deactivate-btn';
            this.innerHTML = '<i class="fas fa-power-off"></i>';
            this.title = 'Deactivate';
            this.removeEventListener('click', handleSubscriberActivate);
            this.addEventListener('click', handleSubscriberDeactivate);
            const suspendBtn = document.createElement('button');
            suspendBtn.className = 'action-btn btn-warning subscriber-suspend-btn';
            suspendBtn.innerHTML = '<i class="fas fa-pause"></i>';
            suspendBtn.title = 'Suspend';
            row.querySelector('td:last-child').appendChild(suspendBtn);
            suspendBtn.addEventListener('click', handleSubscriberSuspend);
            fetchSubscribers();
            showToast('User activated successfully', 'success');
        } else {
            throw new Error(result.message || 'Failed to activate user');
        }
    } catch (error) {
        console.error('Error activating user:', error);
        showErrorMessage(error.message || 'Failed to activate user');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

async function handleSubscriberDeactivate() {
    const row = this.closest('tr');
    const userId = row.getAttribute('data-user-id');
    const statusCell = row.querySelector('td:nth-child(9) .status-badge');
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const response = await apiRequest(`http://localhost:8080/api/admin/user/${userId}/deactivate`, {
            method: 'POST'
        });

        if (!response || !response.ok) {
            const errorData = await response?.json();
            throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'SUCCESS') {
            statusCell.className = 'status-badge status-inactive';
            statusCell.textContent = 'Inactive';
            row.setAttribute('data-status', 'inactive');
            this.className = 'action-btn btn-success subscriber-activate-btn';
            this.innerHTML = '<i class="fas fa-play"></i>';
            this.title = 'Activate';
            this.removeEventListener('click', handleSubscriberDeactivate);
            this.addEventListener('click', handleSubscriberActivate);
            const suspendBtn = row.querySelector('.subscriber-suspend-btn');
            if (suspendBtn) suspendBtn.remove();
            fetchSubscribers();
            showToast('User deactivated successfully', 'danger');
        } else {
            throw new Error(result.message || 'Failed to deactivate user');
        }
    } catch (error) {
        console.error('Error deactivating user:', error);
        showErrorMessage(error.message || 'Failed to deactivate user');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

async function handleSubscriberSuspend() {
    const row = this.closest('tr');
    const userId = row.getAttribute('data-user-id');
    const statusCell = row.querySelector('td:nth-child(9) .status-badge');
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const response = await apiRequest(`http://localhost:8080/api/admin/user/${userId}/suspend`, {
            method: 'POST'
        });

        if (!response || !response.ok) {
            const errorData = await response?.json();
            throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'SUCCESS') {
            statusCell.className = 'status-badge status-suspended';
            statusCell.textContent = 'Suspended';
            row.setAttribute('data-status', 'suspended');
            this.remove();
            const deactivateBtn = row.querySelector('.subscriber-deactivate-btn');
            if (deactivateBtn) {
                deactivateBtn.className = 'action-btn btn-success subscriber-activate-btn';
                deactivateBtn.innerHTML = '<i class="fas fa-play"></i>';
                deactivateBtn.title = 'Activate';
                deactivateBtn.removeEventListener('click', handleSubscriberDeactivate);
                deactivateBtn.addEventListener('click', handleSubscriberActivate);
            }
            fetchSubscribers();
            showToast('User suspended successfully', 'warning');
        } else {
            throw new Error(result.message || 'Failed to suspend user');
        }
    } catch (error) {
        console.error('Error suspending user:', error);
        showErrorMessage(error.message || 'Failed to suspend user');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function updatePagination(pageData) {
    totalPages = pageData.totalPages || 0;
    totalEntries = pageData.totalElements || 0;
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 0 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="prev">Previous</a>`;
    pagination.appendChild(prevLi);

    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    if (startPage > 0) {
        const firstPage = document.createElement('li');
        firstPage.className = 'page-item';
        firstPage.innerHTML = `<a class="page-link" href="#" data-page="0">1</a>`;
        pagination.appendChild(firstPage);

        if (startPage > 1) {
            const dots = document.createElement('li');
            dots.className = 'page-item disabled';
            dots.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i + 1}</a>`;
        pagination.appendChild(pageLi);
    }

    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            const dots = document.createElement('li');
            dots.className = 'page-item disabled';
            dots.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(dots);
        }

        const lastPage = document.createElement('li');
        lastPage.className = 'page-item';
        lastPage.innerHTML = `<a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a>`;
        pagination.appendChild(lastPage);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="next">Next</a>`;
    pagination.appendChild(nextLi);

    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalEntries);
    document.getElementById('pagination-info').textContent = `Showing ${start} to ${end} of ${totalEntries} entries`;
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Checks if the current window is a mobile device or not
 * @return {boolean} True if the window is a mobile device, false otherwise
 */
/*******  ff387eb0-7dba-42b7-8b96-b87641e13146  *******/function isMobile() {
    return window.innerWidth <= 992;
}