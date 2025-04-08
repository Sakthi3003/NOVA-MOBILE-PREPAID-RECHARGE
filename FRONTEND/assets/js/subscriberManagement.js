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
    function checkAuth() {
        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
            window.location.href = '../index.html';
        }
    }

    checkAuth();

    const userDetails = JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    const username = userDetails.username || 'Admin';
    const role = sessionStorage.getItem('role') || '';
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const avatarElement = document.getElementById('avatar');

    userNameElement.textContent = username;
    userRoleElement.textContent = role;
    avatarElement.textContent = username.charAt(0).toUpperCase();

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

    setupEventListeners();
    fetchSubscribers();
    checkRechargeStatus();

    window.addEventListener('popstate', () => {
        checkAuth();
    });

    history.pushState(null, null, window.location.href);
});

function setupEventListeners() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const userProfile = document.getElementById('userProfile');
    const subscriberSearchInput = document.getElementById('subscriberSearchInput');

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

    subscriberSearchInput.addEventListener('input', debounce(() => {
        searchQuery = subscriberSearchInput.value.trim();
        currentPage = 0;
        fetchSubscribers();
    }, 500));

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

    document.getElementById('subscriber-sort').addEventListener('change', () => {
        sort = document.getElementById('subscriber-sort').value;
        currentPage = 0;
        fetchSubscribers();
    });

    document.getElementById('page-size').addEventListener('change', () => {
        pageSize = parseInt(document.getElementById('page-size').value);
        currentPage = 0;
        fetchSubscribers();
    });

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

    const logoutBtn = document.getElementById('logoutBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadingOverlay.style.display = 'flex';
        fetch('http://localhost:8080/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}` }
        })
        .then(response => {
            if (!response.ok) throw new Error('Logout failed');
            return response.text(); // Use text() for non-JSON responses
        })
        .then(() => {
            sessionStorage.clear();
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1500);
        })
        .catch(() => {
            sessionStorage.clear();
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1500);
        })
        .finally(() => {
            loadingOverlay.style.display = 'none';
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
            const errorText = await response.text(); // Get raw response
            throw new Error(errorText || 'Token refresh failed');
        }

        const data = await response.json();
        token = data.accessToken;
        refreshToken = data.refreshToken;

        sessionStorage.setItem('accessToken', token);
        sessionStorage.setItem('refreshToken', refreshToken);

        return token;
    } catch (error) {
        showErrorMessage(error.message || 'Token refresh failed. Please log in again.');
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

        if (!response.ok) {
            const errorText = await response.text(); // Capture raw error response
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
                showErrorMessage('Permission denied. Please contact administrator.');
                setTimeout(() => {
                    handleLogout();
                }, 2000);
                return null;
            } else {
                throw new Error(errorText || 'Request failed with status ' + response.status);
            }
        }

        // Try to parse JSON, fall back to text if parsing fails
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text();
        }
    } catch (error) {
        showErrorMessage(error.message || 'An unexpected error occurred. Please try again later.');
        return null;
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

        if (!response) {
            throw new Error('No response from server');
        }

        let result;
        if (typeof response === 'string') {
            throw new Error(response || 'Failed to check recharge status');
        } else {
            result = response;
        }

        if (result.status === 'SUCCESS') {
            if (result.data && result.data.updated) {
                showToast('User statuses updated based on recharge activity', 'success');
                fetchSubscribers();
            }
        } else {
            throw new Error(result.message || 'Operation failed');
        }
    } catch (error) {
        showErrorMessage(error.message || 'Failed to check recharge status. Please try again later.');
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

        if (!response) {
            throw new Error('No response from server');
        }

        let apiResponse;
        if (typeof response === 'string') {
            throw new Error(response || 'Failed to load subscribers');
        } else {
            apiResponse = response;
        }

        const pageData = apiResponse.data || apiResponse;
        const subscribers = pageData.content || [];

        renderSubscribersTable(subscribers);
        updatePagination(pageData);
    } catch (error) {
        showErrorMessage(error.message || 'Unable to load subscribers. Please try again later.');
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

        if (!response) {
            throw new Error('No response from server');
        }

        let result;
        if (typeof response === 'string') {
            throw new Error(response || 'Failed to activate user');
        } else {
            result = response;
        }

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
            throw new Error(result.message || 'Operation failed');
        }
    } catch (error) {
        showErrorMessage(error.message || 'Unable to activate user. Please try again later.');
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

        if (!response) {
            throw new Error('No response from server');
        }

        let result;
        if (typeof response === 'string') {
            throw new Error(response || 'Failed to deactivate user');
        } else {
            result = response;
        }

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
            throw new Error(result.message || 'Operation failed');
        }
    } catch (error) {
        showErrorMessage(error.message || 'Unable to deactivate user. Please try again later.');
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

        if (!response) {
            throw new Error('No response from server');
        }

        let result;
        if (typeof response === 'string') {
            throw new Error(response || 'Failed to suspend user');
        } else {
            result = response;
        }

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
            throw new Error(result.message || 'Operation failed');
        }
    } catch (error) {
        showErrorMessage(error.message || 'Unable to suspend user. Please try again later.');
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

function isMobile() {
    return window.innerWidth <= 992; 
}