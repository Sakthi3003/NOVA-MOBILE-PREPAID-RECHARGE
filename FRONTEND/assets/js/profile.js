 // Pages configuration
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

let currentPage = "profile";
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
        avatar.setAttribute('aria-expanded', 'false');
        avatar.textContent = userInitials; // Display initial (e.g., "T")
        dropdownDiv.appendChild(avatar);

        const dropdownMenu = document.createElement('ul'); // Use <ul> for Bootstrap dropdown
        dropdownMenu.className = 'dropdown-menu dropdown-menu-end';

        loggedInDropdownPages.forEach(page => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = page.url;
            link.className = `dropdown-item ${currentPage === page.id ? 'active' : ''}`;
            link.textContent = page.label;
            link.onclick = (e) => {
                e.preventDefault();
                setCurrentPage(page.id);
            };
            listItem.appendChild(link);
            dropdownMenu.appendChild(listItem);
        });

        const logoutItem = document.createElement('li');
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = 'dropdown-item';
        logoutLink.textContent = 'Logout';
        logoutLink.onclick = (e) => {
            e.preventDefault();
            logout();
        };
        logoutItem.appendChild(logoutLink);
        dropdownMenu.appendChild(logoutItem);

        dropdownDiv.appendChild(dropdownMenu);
        navLinks.appendChild(dropdownDiv);

        // Reinitialize Bootstrap dropdowns for dynamically added elements
        const dropdownElement = new bootstrap.Dropdown(document.getElementById('profileDropdown'));
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
        loginBtn.href = "./login.html";
        loginBtn.className = "btn login-btn";
        loginBtn.textContent = "Login";
        navLinks.appendChild(loginBtn);

        showSessionMessage('Please log in to view your profile.');
        setTimeout(() => logout(), 2000);
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

// Fetch user profile data from API with accessToken
async function fetchUserProfile() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const accessToken = loggedInUser?.accessToken;
    let userData = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails')) || {};

    if (!accessToken) {
        showSessionMessage('Session expired. Redirecting to login...');
        setTimeout(() => logout(), 2000);
        return;
    }

    // Use cached data immediately if available
    if (Object.keys(userData).length > 0) {
        populateProfile(userData);
    }

    showLoadingOverlay();
    try {
        const response = await fetch('http://localhost:8080/api/user/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        userData = await response.json();
        sessionStorage.setItem('session_loggedInUserDetails', JSON.stringify(userData));
        populateProfile(userData);
    } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            showSessionMessage('Session expired or unauthorized. Redirecting to login...');
            setTimeout(() => logout(), 2000);
        } else if (!Object.keys(userData).length) {
            showSessionMessage('Failed to load profile. Please try again later.');
        }
    } finally {
        hideLoadingOverlay();
    }
}

// Populate profile fields with data
function populateProfile(userData) {
    const fullName = userData.firstName +" "+userData.lastName || 'Not set'; // Use aName directly as per your storage

    document.getElementById('name').textContent = fullName; 
    document.getElementById('number').textContent = userData.phoneNumber || 'Not set';
    document.getElementById('username').textContent = userData.username || 'Not set';
    document.getElementById('activation').textContent = formatDate(userData.activation_date) || 'Not set';
    document.getElementById('status').textContent = userData.status || 'Not set';
    document.getElementById('address').textContent = userData.address || 'Not set';
    const emailValue = document.getElementById('email-value');
    emailValue.textContent = userData.email || 'Not set';
    if (userData.email) {
        emailValue.style.color = 'var(--text-color)';
        emailValue.style.fontStyle = 'normal';
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

// Toggle edit mode for email
function toggleEdit(field) {
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
            input.value = currentValue === 'Not set' ? '' : currentValue;
            input.focus();
        }
    }
}

// Initialize email validation
function initializeEmailValidation() {
    const emailInput = document.getElementById('email-input');
    const emailError = document.getElementById('email-error');
    const emailValidIndicator = document.querySelector('.input-with-validation .validation-indicator.valid');
    const emailInvalidIndicator = document.querySelector('.input-with-validation .validation-indicator.invalid');
    const emailValidationMsg = document.getElementById('email-validation-message');

    function validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(emailInput.value.trim());

        if (!isValid) {
            emailInput.classList.add('error');
            emailError.textContent = 'Please enter a valid email address (e.g., john@example.com)';
            emailError.style.display = 'block';
            emailValidIndicator.style.display = 'none';
            emailInvalidIndicator.style.display = 'block';
            return false;
        } else {
            emailInput.classList.remove('error');
            emailError.style.display = 'none';
            emailValidIndicator.style.display = 'block';
            emailInvalidIndicator.style.display = 'none';
            return true;
        }
    }

    emailInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value.length > 0) {
            const hasAtSymbol = value.includes('@');
            const hasDomain = value.includes('.');

            if (hasAtSymbol && hasDomain) {
                emailValidationMsg.style.color = '#28a745';
                emailValidationMsg.textContent = 'Valid email format';
            } else if (hasAtSymbol) {
                emailValidationMsg.style.color = '#666';
                emailValidationMsg.textContent = 'Email must include a domain (e.g., example.com)';
            } else {
                emailValidationMsg.style.color = '#666';
                emailValidationMsg.textContent = 'Email must include @ symbol';
            }

            if (value.length > 5) validateEmail();
        } else {
            emailValidIndicator.style.display = 'none';
            emailInvalidIndicator.style.display = 'none';
            emailValidationMsg.style.color = '#666';
            emailValidationMsg.textContent = 'Enter your email address';
            emailError.style.display = 'none';
            emailInput.classList.remove('error');
        }
    });
}

// Save account changes
async function saveAccountChanges(event) {
    event.preventDefault();
    showLoadingOverlay();

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const accessToken = loggedInUser?.accessToken;

    if (!accessToken) {
        hideLoadingOverlay();
        showSessionMessage('Session expired. Redirecting to login...');
        setTimeout(() => logout(), 2000);
        return;
    }

    const emailInput = document.getElementById('email-input');
    const emailValue = emailInput.value.trim();
    const emailError = document.getElementById('email-error');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue || !emailRegex.test(emailValue)) {
        emailInput.classList.add('error');
        emailError.textContent = 'Please enter a valid email address';
        emailError.style.display = 'block';
        hideLoadingOverlay();
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/user/update', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: emailValue })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const updatedUserData = await response.json();
        sessionStorage.setItem('session_loggedInUserDetails', JSON.stringify(updatedUserData));

        document.getElementById('email-value').textContent = emailValue;
        document.getElementById('email-value').style.color = 'var(--text-color)';
        document.getElementById('email-value').style.fontStyle = 'normal';
        document.getElementById('email-display').classList.remove('hidden');
        document.getElementById('email-edit').style.display = 'none';
        document.getElementById('account-form').classList.add('hidden');

        hideLoadingOverlay();
        showSuccessMessage('Email updated successfully!');
    } catch (error) {
        console.error('Error updating email:', error);
        hideLoadingOverlay();
        let errorMessage = 'Failed to update email. Please try again.';
        if (error.message.includes('email already exists')) {
            errorMessage = 'Email already exists.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            showSessionMessage('Session expired. Redirecting to login...');
            setTimeout(() => logout(), 2000);
            return;
        }
        emailInput.classList.add('error');
        emailError.textContent = errorMessage;
        emailError.style.display = 'block';
    }
}

// Utility functions
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => successMessage.style.display = 'none', 3000);
}

function showSessionMessage(message) {
    const sessionMessage = document.getElementById('sessionMessage');
    sessionMessage.textContent = message;
    sessionMessage.style.display = 'block';
}

// Initialize page
$(document).ready(function() {
    generateNavigation();
    fetchUserProfile();
    initializeEmailValidation();
});