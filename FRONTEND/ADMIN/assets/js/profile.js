// Navbar Toggler Functionality (Matching Manage Users, dashboard.html, and expiring-plans.html)
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Logout functionality with Loading (Matching Manage Users and other dashboards)
document.querySelector('.logout-btn').addEventListener('click', function(e) {
    console.log('Logout button clicked');
    e.preventDefault(); // Prevent default action
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        setTimeout(() => {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = 'Logged out successfully.';
            document.body.appendChild(toast);
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                window.location.href = 'login.html'; // Redirect to login page
            }, 3000); // Show toast for 3 seconds before redirecting
        }, 1500); // Show loading for 1.5 seconds first
    } else {
        console.error('Loading overlay not found');
    }
});

function toggleEdit(field) {
    console.log(`Toggling edit for field: ${field}`);
    const display = document.getElementById(`${field}-display`);
    const edit = document.getElementById(`${field}-edit`);
    const form = document.getElementById('account-form');
    
    if (display && edit && form) {
        display.classList.add('hidden');
        edit.style.display = 'block';
        form.classList.remove('hidden');
        
        const input = document.getElementById(`${field}-input`);
        if (input) {
            const currentValue = document.getElementById(`${field}-value`).textContent;
            input.value = currentValue;
            input.focus();
        }
    } else {
        console.error(`Error toggling edit for ${field}: display, edit, or form element not found`);
    }
}

function saveAccountChanges(event) {
    event.preventDefault();
    console.log('Saving account changes');

    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');

    // Reset error messages
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });

    let hasErrors = false;
    let changesMade = false;

    // Email validation
    if (emailInput && document.getElementById('email-edit').style.display !== 'none') {
        const email = emailInput.value.trim();
        console.log(`Validating email: "${email}"`);
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('email-error', 'Please enter a valid email address');
                hasErrors = true;
            } else {
                changesMade = true;
                document.getElementById('email-value').textContent = email;
            }
        }
    }

    // Password validation (Change Password)
    if (passwordInput && document.getElementById('password-edit').style.display !== 'none') {
        const password = passwordInput.value.trim();
        console.log(`Validating password: "${password}"`);
        if (password) {
            if (password.length < 6) {
                showError('password-error', 'Password must be at least 6 characters');
                hasErrors = true;
            } else {
                changesMade = true;
                document.getElementById('password-value').textContent = '********'; // Mask password
            }
        }
    }

    if (!hasErrors && changesMade) {
        console.log('Form validated successfully, saving changes');
        resetForm();
        showToastMessage('Details Saved');
    } else {
        console.log('Form validation failed or no changes made');
    }
}

function showError(elementId, message) {
    console.log(`Showing error for ${elementId}: ${message}`);
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function showToastMessage(message) {
    console.log(`Showing toast message: ${message}`);
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

function resetForm() {
    console.log('Resetting form');
    const displayElements = ['email-display', 'password-display'];
    const editElements = ['email-edit', 'password-edit'];

    displayElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.remove('hidden');
    });

    editElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });

    const form = document.getElementById('account-form');
    if (form) form.classList.add('hidden');

    const inputs = document.querySelectorAll('#account-form input, #account-form textarea, #account-form select');
    inputs.forEach(input => input.value = '');
}