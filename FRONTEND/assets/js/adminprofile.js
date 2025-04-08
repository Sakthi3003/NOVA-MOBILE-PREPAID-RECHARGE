let token = sessionStorage.getItem('accessToken');

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
    loadProfileFromSession();

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
    const userDropdown = document.getElementById('userDropdown');

    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('show');
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

    // Logout Functionality (for both sidebar and top bar)
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnTop = document.getElementById('logoutBtnTop');
    const loadingOverlay = document.getElementById('loadingOverlay');

    [logoutBtn, logoutBtnTop].forEach(btn => {
        btn.addEventListener('click', (e) => {
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
    });
}

function loadProfileFromSession() {
    const userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
    const role = sessionStorage.getItem('role');

    if (!userDetails || !role) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Profile data is missing. Please log in again.',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = '../index.html'; // Adjust path as per your structure
        });
        return;
    }

    document.getElementById('name-value').textContent = `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() || 'N/A';
    document.getElementById('email-value').textContent = userDetails.email || 'N/A';
    document.getElementById('phoneNumber-value').textContent = userDetails.phone_number || 'N/A';
    document.getElementById('username-value').textContent = userDetails.username || 'N/A';
    document.getElementById('address-value').textContent = userDetails.address || 'Not provided';
    document.getElementById('email-input').value = userDetails.email || '';
}

function toggleEdit(field) {
    const display = document.getElementById(`${field}-display`);
    const edit = document.getElementById(`${field}-edit`);
    const form = document.getElementById('account-form');

    display.style.display = 'none';
    edit.style.display = 'block';
    form.classList.remove('hidden');

    const userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
    if (field === 'email') {
        document.getElementById('email-input').value = userDetails.email || '';
    }
}

async function saveAccountChanges(event) {
    event.preventDefault();

    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value.trim();
    const updatedProfile = {};
    const userDetails = JSON.parse(sessionStorage.getItem('userDetails')) || {};

    // Compare with existing values from sessionStorage
    if (email && document.getElementById('email-edit').style.display !== 'none') {
        if (!/\S+@\S+\.\S+/.test(email)) {
            document.getElementById('email-error').textContent = 'Invalid email format';
            return;
        }
        // Only include email if it’s different from the current value
        if (email !== userDetails.email) {
            updatedProfile.email = email;
        }
    }

    if (password && document.getElementById('password-edit').style.display !== 'none') {
        if (password.length < 8) {
            document.getElementById('password-error').textContent = 'Password must be at least 8 characters';
            return;
        }
        // Only include password if it’s non-empty (assuming no current password is shown)
        updatedProfile.password = password; // No direct comparison since password isn’t stored in sessionStorage
    }

    // Check if there are any actual changes
    if (Object.keys(updatedProfile).length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'No Changes',
            text: 'No changes were made to save.',
            timer: 1500,
            showConfirmButton: false
        });
        // Reset UI to display mode
        document.getElementById('email-display').style.display = 'flex';
        document.getElementById('email-edit').style.display = 'none';
        document.getElementById('password-display').style.display = 'flex';
        document.getElementById('password-edit').style.display = 'none';
        document.getElementById('account-form').classList.add('hidden');
        document.getElementById('email-error').textContent = '';
        document.getElementById('password-error').textContent = '';
        document.getElementById('password-input').value = '';
        return;
    }

    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const response = await fetch('http://localhost:8080/api/admin/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedProfile)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile');
        }

        const updatedData = await response.json();

        sessionStorage.setItem('userDetails', JSON.stringify(updatedData.userDetails));
        sessionStorage.setItem('accessToken', updatedData.accessToken);
        sessionStorage.setItem('refreshToken', updatedData.refreshToken);
        sessionStorage.setItem('role', updatedData.role);
        token = updatedData.accessToken;

        document.getElementById('email-value').textContent = updatedData.userDetails.email;
        document.getElementById('password-value').textContent = '********';

        document.getElementById('email-display').style.display = 'flex';
        document.getElementById('email-edit').style.display = 'none';
        document.getElementById('password-display').style.display = 'flex';
        document.getElementById('password-edit').style.display = 'none';
        document.getElementById('account-form').classList.add('hidden');
        document.getElementById('email-error').textContent = '';
        document.getElementById('password-error').textContent = '';
        document.getElementById('password-input').value = '';

        // Update top bar username and role
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        const avatarElement = document.getElementById('avatar');
        userNameElement.textContent = updatedData.userDetails.username || 'Admin';
        userRoleElement.textContent = updatedData.role || '';
        avatarElement.textContent = (updatedData.userDetails.username || 'A').charAt(0).toUpperCase();

        Swal.fire({
            icon: 'success',
            title: 'Profile Updated',
            text: 'Your profile has been updated successfully!',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Error saving profile:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to update profile. Please try again.'
        });
    } finally {
        loadingOverlay.style.display = 'none';
    }
}