// Navigation Logic (from My Plans page)
const loggedInDropdownPages = [
    { id: "myplans", label: "My Plans", url: "myplans.html" },
    { id: "transactions", label: "Transactions", url: "transaction.html" },
    { id: "profile", label: "Profile", url: "profilef.html" },
];

let currentPage = "profile"; // Set to "profile" for this page

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function generateNavigation() {
    const navLinks = document.getElementById("nav-links");
    const homeLink = document.getElementById("home-link");
    const plansLink = document.getElementById("plans-link");
    const supportLink = document.getElementById("support-link");
    const aboutLink = document.getElementById("about-link");

    if (homeLink) homeLink.className = `nav-link ${currentPage === 'home' ? 'active' : ''}`;
    if (plansLink) plansLink.className = `nav-link ${currentPage === 'plans' ? 'active' : ''}`;
    if (supportLink) supportLink.className = `nav-link ${currentPage === 'support' ? 'active' : ''}`;
    if (aboutLink) aboutLink.className = `nav-link ${currentPage === 'about' ? 'active' : ''}`;

    const existingDropdown = navLinks.querySelector('.dropdown');
    if (existingDropdown) existingDropdown.remove();

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser) {
        const dropdownDiv = document.createElement('div');
        dropdownDiv.className = 'dropdown';

        const avatar = document.createElement('div');
        avatar.className = 'user-avatar dropdown-toggle';
        avatar.id = 'profileDropdown';
        avatar.setAttribute('data-bs-toggle', 'dropdown');
        avatar.textContent = loggedInUser.simHolderName ? loggedInUser.simHolderName.charAt(0).toUpperCase() : 'S';
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
        showToastMessage('Please log in to view your profile.');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
}

function setCurrentPage(pageId) {
    currentPage = pageId;
    const page = loggedInDropdownPages.find(p => p.id === pageId) || 
                { id: "home", url: "./indexu.html" } || 
                { id: "plans", url: "./plansu.html" };
    if (page) {
        window.location.href = page.url;
    }
    generateNavigation();
}

function logout() {
    console.log('Logout initiated');
    showLoadingOverlay(); // Show overlay during logout
    localStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('phoneNumber');
    setTimeout(() => {
        hideLoadingOverlay(); // Hide overlay after delay
        showToastMessage('Logged out successfully.');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000); // Delay redirect to show toast
    }, 1000); // 1-second delay to simulate processing
}

function toggleMenu() {
    const navLinks = document.getElementById("nav-links");
    if (navLinks) {
        navLinks.classList.toggle("active");
    }
}

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user) {
        console.log('User data found in localStorage:', user);

        // Update Personal Information
        const nameElement = document.getElementById('name');
        const numberElement = document.getElementById('number');
        const dobElement = document.getElementById('dob');
        const activationElement = document.getElementById('activation');
        const addressElement = document.getElementById('address');
        const stateElement = document.getElementById('state');
        const usernameElement = document.getElementById('username-value');
        const emailElement = document.getElementById('email-value');

        if (nameElement) nameElement.textContent = user.simHolderName || 'Not set';
        if (numberElement) numberElement.textContent = user.number || 'Not set';
        if (dobElement) dobElement.textContent = user.dateOfBirth || 'Not set';
        if (activationElement) activationElement.textContent = user.dateOfActivation || 'Not set';
        if (addressElement) addressElement.textContent = user.address || 'Not set';
        if (stateElement) stateElement.textContent = (user.placeOfSupply === "TamilNadu" ? "Tamil Nadu" : user.placeOfSupply) || 'Not set';
        if (usernameElement) {
            usernameElement.textContent = user.username || 'Not set';
            if (user.username) {
                usernameElement.style.color = 'var(--text-color)';
                usernameElement.style.fontStyle = 'normal';
            }
        }
        if (emailElement) {
            emailElement.textContent = user.email || 'Not set';
            if (user.email) {
                emailElement.style.color = 'var(--text-color)';
                emailElement.style.fontStyle = 'normal';
            }
        }

        // Ensure .info-grid uses grid layout
        const infoGrids = document.querySelectorAll('.info-grid');
        infoGrids.forEach(grid => {
            grid.style.display = 'grid';
        });
    } else {
        console.error('No user data found in localStorage');
        showToastMessage('Please log in to view your profile.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

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
            input.value = currentValue === 'Not set' ? '' : currentValue;
            input.focus();
        }
    } else {
        console.error(`Error toggling edit for ${field}: display, edit, or form element not found`);
    }
}

function saveAccountChanges(event) {
    event.preventDefault();
    console.log('Saving account changes');
    showLoadingOverlay(); // Show overlay during save

    const usernameInput = document.getElementById('username-input');
    const emailInput = document.getElementById('email-input');

    // Reset error messages
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });

    let hasErrors = false;
    let changesMade = false;

    const user = JSON.parse(localStorage.getItem('loggedInUser')) || {};

    // Username validation
    if (usernameInput && document.getElementById('username-edit').style.display !== 'none') {
        const username = usernameInput.value.trim();
        console.log(`Validating username: "${username}"`);
        if (username) {
            if (username.length < 3) {
                showError('username-error', 'Username must be at least 3 characters');
                hasErrors = true;
            } else {
                changesMade = true;
                user.username = username;
                const usernameValue = document.getElementById('username-value');
                if (usernameValue) {
                    usernameValue.textContent = username;
                    usernameValue.style.color = 'var(--text-color)';
                    usernameValue.style.fontStyle = 'normal';
                }
            }
        }
    }

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
                user.email = email;
                const emailValue = document.getElementById('email-value');
                if (emailValue) {
                    emailValue.textContent = email;
                    emailValue.style.color = 'var(--text-color)';
                    emailValue.style.fontStyle = 'normal';
                }
            }
        }
    }

    setTimeout(() => { // Simulate async save operation
        if (!hasErrors && changesMade) {
            console.log('Form validated successfully, saving changes');
            localStorage.setItem('loggedInUser', JSON.stringify(user));
            resetForm();
            hideLoadingOverlay();
            showToastMessage('Details Updated');
        } else {
            console.log('Form validation failed or no changes made');
            hideLoadingOverlay();
            if (hasErrors) {
                showToastMessage('Please fix the errors and try again.');
            }
        }
    }, 1000); // 1-second delay to simulate processing
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
    const displayElements = ['username-display', 'email-display'];
    const editElements = ['username-edit', 'email-edit'];

    displayElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.remove('hidden');
    });

    editElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });

    const form = document.getElementById('account-form');
    if (form) form.classList.add('hidden');

    const inputs = document.querySelectorAll('#account-form input');
    inputs.forEach(input => input.value = '');
}

// Initialize navigation and load user data
$(document).ready(function() {
    console.log('DOM ready, loading user data and navigation');
    loadUserData();
    generateNavigation();
});