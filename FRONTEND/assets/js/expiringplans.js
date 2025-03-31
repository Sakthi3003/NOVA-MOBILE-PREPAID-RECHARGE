let token = sessionStorage.getItem('accessToken');
let currentPage = 0;
const itemsPerPage = 5;
let totalPages = 0;
let expiringPlans = [];

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

    // Setup other event listeners
    setupEventListeners();
    fetchExpiringPlans();

    // Prevent back button access
    window.addEventListener('popstate', () => {
        checkAuth();
    });

    // Push initial state to history
    history.pushState(null, null, window.location.href);
});

function setupEventListeners() {
    const sidebar = document.getElementById('sidebar');
    const userProfile = document.getElementById('userProfile');
    const userDetailsModal = document.getElementById('userDetailsModal');
    const expiringPlansSearchInput = document.getElementById('expiringPlansSearchInput');

    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        // Add admin profile details here if needed
    });

    document.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target) && !userDetailsModal.contains(e.target)) {
            userDetailsModal.classList.remove('show');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.classList.contains('logout-btn')) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
            if (isMobile() && sidebar.classList.contains('expanded')) {
                sidebar.classList.remove('expanded');
            }
        });
    });

    // Search Functionality
    expiringPlansSearchInput.addEventListener('keyup', applyExpiringPlansFilters);

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
        applyExpiringPlansFilters();
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
                window.location.href = './login.html'; // Adjust path as per your structure
            }, 1500);
        })
        .catch(error => {
            console.error('Logout Error:', error);
            sessionStorage.clear();
            setTimeout(() => {
                window.location.href = './login.html'; // Adjust path as per your structure
            }, 1500);
        });
    });
}

async function fetchExpiringPlans() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const response = await fetch('http://localhost:8080/api/admin/expiring-plans', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch expiring plans');
        }

        const result = await response.json();
        if (result.status !== 'SUCCESS') {
            throw new Error(result.message || 'Failed to fetch expiring plans');
        }

        expiringPlans = result.data;
        populateExpiringPlansTable();
    } catch (error) {
        console.error('Error fetching expiring plans:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to fetch expiring plans. Please try again.',
            confirmButtonColor: '#0a21c0'
        });
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function populateExpiringPlansTable() {
    const tbody = document.getElementById('expiring-plans-body');
    tbody.innerHTML = '';

    expiringPlans.forEach(plan => {
        const daysToExpire = plan.daysToExpire;
        const daysClass = daysToExpire <= 1 ? 'danger' : daysToExpire <= 2 ? 'warning' : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${plan.user.firstName} ${plan.user.lastName}</td>
            <td>${plan.phoneNumber}</td>
            <td>${plan.plan.name}</td>
            <td>${plan.startDate}</td>
            <td>${plan.endDate}</td>
            <td><span class="days-to-expire ${daysClass}">${daysToExpire} day${daysToExpire !== 1 ? 's' : ''}</span></td>
            <td><span class="status-badge status-${plan.status.toLowerCase()}">${plan.status}</span></td>
            <td>
                <button class="action-btn btn-primary view-btn" data-user-id="${plan.user.userId}">View</button>
                <button class="action-btn btn-success notify-btn" data-phone-number="${plan.phoneNumber}" data-plan-name="${plan.plan.name}" data-end-date="${plan.endDate}">Notify</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', handleViewUserDetails);
    });

    document.querySelectorAll('.notify-btn').forEach(button => {
        button.addEventListener('click', handleNotifyUser);
    });

    applyExpiringPlansFilters();
}

async function handleViewUserDetails(e) {
    const userId = e.target.dataset.userId;
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const response = await fetch(`http://localhost:8080/api/admin/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user details');
        }

        const result = await response.json();
        if (result.status !== 'SUCCESS') {
            throw new Error(result.message || 'Failed to fetch user details');
        }

        const data = result.data;
        const user = data.user;
        const currentRecharge = data.currentRecharge;
        const transactions = data.transactions;

        document.getElementById('userName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('userEmail').textContent = user.email || 'N/A';
        document.getElementById('userPhone').textContent = user.phoneNumber;
        document.getElementById('userAddress').textContent = user.address || 'N/A';
        document.getElementById('userActivationDate').textContent = user.activationDate;
        document.getElementById('userPlan').textContent = currentRecharge ? currentRecharge.plan.name : 'N/A';
        document.getElementById('userPlanPrice').textContent = currentRecharge ? `₹${currentRecharge.plan.price.toFixed(2)}` : 'N/A';
        document.getElementById('userPlanValidity').textContent = currentRecharge ? currentRecharge.plan.validity : 'N/A';
        document.getElementById('userPlanData').textContent = currentRecharge ? currentRecharge.plan.data : 'N/A';
        document.getElementById('userPlanCalls').textContent = currentRecharge ? currentRecharge.plan.calls : 'N/A';
        document.getElementById('userPlanSms').textContent = currentRecharge ? currentRecharge.plan.sms : 'N/A';
        document.getElementById('userStartDate').textContent = currentRecharge ? currentRecharge.startDate : 'N/A';
        document.getElementById('userEndDate').textContent = currentRecharge ? currentRecharge.endDate : 'N/A';

        const transactionBody = document.getElementById('transactionHistoryBody');
        transactionBody.innerHTML = '';
        transactions.forEach(tx => {
            transactionBody.innerHTML += `
                <tr>
                    <td>${tx.transactionDate}</td>
                    <td>₹${tx.amount.toFixed(2)}</td>
                    <td>${tx.paymentMode}</td>
                    <td>${tx.status}</td>
                </tr>
            `;
        });

        document.getElementById('userDetailsModal').classList.add('show');
    } catch (error) {
        console.error('Error fetching user details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to fetch user details. Please try again.',
            confirmButtonColor: '#0a21c0'
        });
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

async function handleNotifyUser(e) {
    const phoneNumber = e.target.dataset.phoneNumber;
    const planName = e.target.dataset.planName;
    const endDate = e.target.dataset.endDate;
    const message = `Reminder: Your ${planName} plan is expiring on ${endDate}. Please recharge to continue enjoying our services. - Nova`;

    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const response = await fetch('http://localhost:8080/api/admin/notify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                message: message
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send notification');
        }

        const result = await response.json();
        if (result.status !== 'SUCCESS') {
            throw new Error(result.message || 'Failed to send notification');
        }

        showToast('Notification sent successfully', 'success');
    } catch (error) {
        console.error('Error sending notification:', error);
        let errorMessage = error.message || 'Failed to send notification';
        if (errorMessage.includes('Twilio')) {
            errorMessage = 'Failed to send SMS: SMS service is not properly configured. Please contact support.';
        } else if (errorMessage.includes('phone number')) {
            errorMessage = 'Invalid phone number. Please check the number and try again.';
        }
        showToast(errorMessage, 'danger');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function applyExpiringPlansFilters() {
    const searchTerm = document.getElementById('expiringPlansSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#expiring-plans-table tbody tr');
    let filteredRows = [];

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const showRow = searchTerm ? text.includes(searchTerm) : true;
        row.style.display = showRow ? '' : 'none';
        if (showRow) filteredRows.push(row);
    });

    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    filteredRows.forEach((row, index) => {
        row.style.display = (index >= start && index < end) ? '' : 'none';
    });

    updatePagination(filteredRows, currentPage);
}

function updatePagination(filteredRows, page) {
    totalPages = Math.ceil(filteredRows.length / itemsPerPage);
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

    const start = currentPage * itemsPerPage + 1;
    const end = Math.min((currentPage + 1) * itemsPerPage, filteredRows.length);
    document.getElementById('pagination-info').textContent = `Showing ${start} to ${end} of ${filteredRows.length} entries`;
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