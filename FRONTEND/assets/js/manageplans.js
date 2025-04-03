let token = sessionStorage.getItem('accessToken');
let refreshToken = sessionStorage.getItem('refreshToken');
let categories = [];
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let searchQuery = '';
let statusFilter = '';
let sort = 'id,asc';

const loginModal = document.getElementById('loginModal');
const planModal = document.getElementById('planModal');
const categoryModal = document.getElementById('categoryModal');

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = 'login.html';
    } else {
        loadPlans();
        loadCategories();
    }
    setupEventListeners();
});

function setupEventListeners() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const toggleBtn = document.getElementById('toggleSidebar');
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const userProfile = document.getElementById('userProfile');
    const userDropdown = document.getElementById('userDropdown');

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

    notificationBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationDropdown.classList.toggle('show');
        userDropdown.classList.remove('show');
    });

    userProfile.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
        notificationDropdown.classList.remove('show');
    });

    document.addEventListener('click', function(e) {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.remove('show');
        }
        if (!userProfile.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('show');
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

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            if (isMobile() && sidebar.classList.contains('expanded')) {
                sidebar.classList.remove('expanded');
            }
        });
    });

    document.querySelector('.mark-all').addEventListener('click', function() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
        });
        document.querySelector('.notification-badge').style.display = 'none';
    });

    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains('unread')) {
                this.classList.remove('unread');
                const badge = document.querySelector('.notification-badge');
                const currentCount = parseInt(badge.textContent);
                badge.textContent = currentCount - 1;
                if (currentCount - 1 <= 0) {
                    badge.style.display = 'none';
                }
            }
        });
    });

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.querySelectorAll('#logout-btn').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
    
    document.getElementById('add-plan-btn').addEventListener('click', () => {
        resetPlanForm();
        document.getElementById('planModalLabel').textContent = 'Add New Plan';
        document.getElementById('status-row').style.display = 'none';
        planModal.classList.add('show');
    });
    document.getElementById('add-category-btn').addEventListener('click', () => {
        resetCategoryForm();
        document.getElementById('categoryModalLabel').textContent = 'Add New Category';
        categoryModal.classList.add('show');
    });
    
    document.getElementById('save-plan-btn').addEventListener('click', savePlan);
    document.getElementById('save-category-btn').addEventListener('click', saveCategory);

    document.getElementById('plan-search').addEventListener('input', debounce(() => {
        searchQuery = document.getElementById('plan-search').value;
        currentPage = 0;
        loadPlans();
    }, 500));
    document.getElementById('plan-status-filter').addEventListener('change', () => {
        statusFilter = document.getElementById('plan-status-filter').value;
        currentPage = 0;
        loadPlans();
    });
    document.getElementById('plan-sort').addEventListener('change', () => {
        sort = document.getElementById('plan-sort').value;
        currentPage = 0;
        loadPlans();
    });
    document.getElementById('page-size').addEventListener('change', () => {
        pageSize = parseInt(document.getElementById('page-size').value);
        currentPage = 0;
        loadPlans();
    });
    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('plan-search').value = '';
        document.getElementById('plan-status-filter').value = '';
        searchQuery = '';
        statusFilter = '';
        currentPage = 0;
        loadPlans();
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        const data = await response.json();
        token = data.accessToken;
        refreshToken = data.refreshToken;
        
        sessionStorage.setItem('accessToken', token);
        sessionStorage.setItem('refreshToken', refreshToken);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('username', data.username || username);
        
        document.querySelector('.user-name').textContent = data.username || username;
        document.querySelector('.user-role').textContent = data.role || 'Admin';
        document.querySelector('.avatar').textContent = (data.username || username).charAt(0).toUpperCase();
        
        loginModal.classList.remove('show');
        loadPlans();
        loadCategories();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

function handleLogout() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('username');
    sessionStorage.clear();
    token = null;
    refreshToken = null;
    window.location.href = 'login.html';
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
            alert('You do not have permission to access this resource.');
            handleLogout();
            return null;
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

async function loadPlans() {
    try {
        document.getElementById('loading-spinner').style.display = 'block';
        const [sortBy, sortDir] = sort.split(',');
        let url = `http://localhost:8080/api/plans?page=${currentPage}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        if (statusFilter) {
            url += `&status=${statusFilter}`;
        }

        const response = await apiRequest(url);
        
        if (!response || !response.ok) {
            throw new Error('Failed to load plans');
        }
        
        const pageData = await response.json();
        renderPlansTable(pageData.content);
        updatePagination(pageData);
    } catch (error) {
        console.error('Error loading plans:', error);
        alert('Failed to load plans: ' + error.message);
    } finally {
        document.getElementById('loading-spinner').style.display = 'none';
    }
}

async function loadCategories() {
    try {
        const response = await apiRequest('http://localhost:8080/api/categories');
        
        if (!response || !response.ok) {
            throw new Error('Failed to load categories');
        }
        
        categories = await response.json();
        renderCategoriesTable(categories);
        populateCategoryDropdown();
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('Failed to load categories: ' + error.message);
    }
}

function renderPlansTable(plans) {
    const tableBody = document.getElementById('plans-table-body');
    tableBody.innerHTML = '';
    
    plans.forEach(plan => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${plan.id}</td>
            <td>${plan.name}</td>
            <td>${plan.category ? plan.category.name : 'N/A'}</td>
            <td>₹${plan.price}</td>
            <td>${plan.validity}</td>
            <td>${plan.data || 'N/A'}</td>
            <td>${plan.sms || 'N/A'}</td>
            <td>${plan.calls || 'N/A'}</td>
            <td>${plan.benefit1 || 'N/A'}</td>
            <td>${plan.benefit2 || 'N/A'}</td>
            <td><span class="status-badge ${plan.status === 'active' ? 'status-active' : 'status-inactive'}">${plan.status}</span></td>
            <td>
                <button class="action-btn btn-primary edit-plan" data-id="${plan.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${plan.status === 'active' ? 'btn-warning' : 'btn-success'} toggle-status" data-id="${plan.id}" title="${plan.status === 'active' ? 'Deactivate' : 'Activate'}">
                    <i class="fas ${plan.status === 'active' ? 'fa-toggle-off' : 'fa-toggle-on'}"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    document.querySelectorAll('.edit-plan').forEach(btn => {
        btn.addEventListener('click', () => editPlan(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.toggle-status').forEach(btn => {
        btn.addEventListener('click', () => togglePlanStatus(btn.getAttribute('data-id')));
    });
}

function renderCategoriesTable(categories) {
    const tableBody = document.getElementById('categories-table-body');
    tableBody.innerHTML = '';
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td>
                <button class="action-btn btn-primary edit-category" data-id="${category.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    document.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', () => editCategory(btn.getAttribute('data-id')));
    });
}

function populateCategoryDropdown() {
    const categorySelect = document.getElementById('plan-category');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

function updatePagination(pageData) {
    totalPages = pageData.totalPages;
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 0 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 0) {
            currentPage--;
            loadPlans();
        }
    });
    pagination.appendChild(prevLi);
    
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    
    if (startPage > 0) {
        const firstPage = document.createElement('li');
        firstPage.className = 'page-item';
        firstPage.innerHTML = `<a class="page-link" href="#">1</a>`;
        firstPage.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = 0;
            loadPlans();
        });
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
        pageLi.innerHTML = `<a class="page-link" href="#">${i + 1}</a>`;
        pageLi.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            loadPlans();
        });
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
        lastPage.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
        lastPage.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = totalPages - 1;
            loadPlans();
        });
        pagination.appendChild(lastPage);
    }
    
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages - 1) {
            currentPage++;
            loadPlans();
        }
    });
    pagination.appendChild(nextLi);
    
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, pageData.totalElements);
    document.getElementById('pagination-info').textContent = `Showing ${start} to ${end} of ${pageData.totalElements} entries`;
}

async function editPlan(id) {
    try {
        const response = await apiRequest(`http://localhost:8080/api/plans/${id}`);
        
        if (!response || !response.ok) {
            throw new Error('Failed to fetch plan details');
        }
        
        const plan = await response.json();
        
        document.getElementById('plan-id').value = plan.id;
        document.getElementById('plan-name').value = plan.name;
        document.getElementById('plan-category').value = plan.category ? plan.category.id : '';
        document.getElementById('plan-price').value = plan.price;
        document.getElementById('plan-validity').value = plan.validity;
        document.getElementById('plan-data').value = plan.data || '';
        document.getElementById('plan-sms').value = plan.sms || '';
        document.getElementById('plan-calls').value = plan.calls || '';
        document.getElementById('plan-benefit1').value = plan.benefit1 || '';
        document.getElementById('plan-benefit2').value = plan.benefit2 || '';
        document.getElementById('plan-status').value = plan.status;
        
        document.getElementById('planModalLabel').textContent = 'Edit Plan';
        document.getElementById('status-row').style.display = 'block';
        planModal.classList.add('show');
    } catch (error) {
        console.error('Error editing plan:', error);
        alert('Failed to edit plan: ' + error.message);
    }
}

async function editCategory(id) {
    try {
        const response = await apiRequest(`http://localhost:8080/api/categories/${id}`);
        
        if (!response || !response.ok) {
            throw new Error('Failed to fetch category details');
        }
        
        const category = await response.json();
        
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
        
        document.getElementById('categoryModalLabel').textContent = 'Edit Category';
        categoryModal.classList.add('show');
    } catch (error) {
        console.error('Error editing category:', error);
        alert('Failed to edit category: ' + error.message);
    }
}

async function savePlan() {
    const id = document.getElementById('plan-id').value;
    const name = document.getElementById('plan-name').value.trim();
    const categoryId = document.getElementById('plan-category').value;
    const price = document.getElementById('plan-price').value.trim();
    const validity = document.getElementById('plan-validity').value.trim();
    const data = document.getElementById('plan-data').value.trim();
    const sms = document.getElementById('plan-sms').value.trim();
    const calls = document.getElementById('plan-calls').value.trim();
    const benefit1 = document.getElementById('plan-benefit1').value.trim();
    const benefit2 = document.getElementById('plan-benefit2').value.trim();
    const status = document.getElementById('plan-status').value;

    // Client-side validation
    if (!name) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Plan Name cannot be empty!'
        });
        return;
    }
    if (!categoryId) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please select a Category!'
        });
        return;
    }
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Price must be a valid positive number!'
        });
        return;
    }
    if (!validity) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Validity cannot be empty!'
        });
        return;
    }

    const plan = {
        name,
        categoryId: parseInt(categoryId),
        price: parseFloat(price),
        validity,
        data,
        sms,
        calls,
        benefit1,
        benefit2
    };

    if (id) {
        plan.status = status;
    }

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `http://localhost:8080/api/plans/${id}` : 'http://localhost:8080/api/plans/add';
        
        const response = await apiRequest(url, {
            method,
            body: JSON.stringify(plan)
        });
        
        if (!response || !response.ok) {
            throw new Error(id ? 'Failed to update plan' : 'Failed to create plan');
        }
        
        planModal.classList.remove('show');
        loadPlans();
        Swal.fire({
            icon: 'success',
            title: id ? 'Plan Updated' : 'Plan Created',
            text: `The plan has been ${id ? 'updated' : 'created'} successfully!`,
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Error saving plan:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Failed to ${id ? 'update' : 'create'} plan: ${error.message}`
        });
    }
}

async function saveCategory() {
    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();

    // Client-side validation
    if (!name) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Category Name cannot be empty!'
        });
        return;
    }

    const category = { name };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `http://localhost:8080/api/categories/${id}` : 'http://localhost:8080/api/categories';
        
        const response = await apiRequest(url, {
            method,
            body: JSON.stringify(category)
        });
        
        if (!response || !response.ok) {
            throw new Error(id ? 'Failed to update category' : 'Failed to create category');
        }
        
        categoryModal.classList.remove('show');
        loadCategories();
        loadPlans();
        Swal.fire({
            icon: 'success',
            title: id ? 'Category Updated' : 'Category Created',
            text: `The category has been ${id ? 'updated' : 'created'} successfully!`,
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Error saving category:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Failed to ${id ? 'update' : 'create'} category: ${error.message}`
        });
    }
}

async function togglePlanStatus(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to change the status of this plan?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0a21c0',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Yes, change it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await apiRequest(`http://localhost:8080/api/plans/${id}/toggle-status`, {
                    method: 'PATCH'
                });
                
                if (!response || !response.ok) {
                    throw new Error('Failed to change plan status');
                }
                
                loadPlans();
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: 'The plan status has been updated successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error changing plan status:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to change plan status: ' + error.message
                });
            }
        }
    });
}

function resetPlanForm() {
    document.getElementById('plan-form').reset();
    document.getElementById('plan-id').value = '';
    document.getElementById('plan-status').value = 'active';
}

function resetCategoryForm() {
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
}