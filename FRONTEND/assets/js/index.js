const guestPages = [
    { id: "home", label: "Home", url: "index.html" },
    { id: "plans", label: "Plans", url: "./subscriber/plans.html" },
    { id: "support", label: "Support", url: "./subscriber/support.html" },
    { id: "About", label: "About Us", url: "./subscriber/about.html" }
];

const loggedInDropdownPages = [
    { id: "myplans", label: "My Plans", url: "./subscriber/myplans.html" },
    { id: "transactions", label: "Transactions", url: "./subscriber/transaction.html" },
    { id: "profile", label: "Profile", url: "./subscriber/profilef.html" },
];

let currentPage = "home";
let isLoggedIn = false;
let userInitials = "S";

// Generate navigation
function generateNavigation() {
    const navLinks = document.getElementById("nav-links");
    navLinks.innerHTML = "";

    // Check storage for user data
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const loggedInUserDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails')) || null;

    isLoggedIn = !!loggedInUser;
    console.log('isLoggedIn:', isLoggedIn, 'loggedInUser:', loggedInUser);

    if (isLoggedIn) {
        userInitials = loggedInUserDetails?.firstName?.charAt(0)?.toUpperCase() || 'S';
        console.log('userInitials:', userInitials);

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
        avatar.textContent = userInitials;
        dropdownDiv.appendChild(avatar);

        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu dropdown-menu-end';

        loggedInDropdownPages.forEach(page => {
            const link = document.createElement('a');
            link.href = page.url;
            link.className = 'dropdown-item';
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
        loginBtn.href = "./SUBSCRIBER/login.html";
        loginBtn.className = "btn login-btn";
        loginBtn.textContent = "Login";
        navLinks.appendChild(loginBtn);
    }
}

// Set current page and navigate
function setCurrentPage(pageId) {
    currentPage = pageId;
    const guestPage = guestPages.find(p => p.id === pageId);
    const loggedInPage = loggedInDropdownPages.find(p => p.id === pageId);
    if (guestPage) {
        window.location.href = guestPage.url;
    } else if (loggedInPage) {
        window.location.href = loggedInPage.url;
    }
    generateNavigation();
}

// Logout function
function logout() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    localStorage.clear();
    sessionStorage.clear();
    isLoggedIn = false;
    currentPage = 'home';

    generateNavigation();

    setTimeout(() => {
        loadingOverlay.style.display = 'none';
        window.location.href = 'index.html';
    }, 1500);
}

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.getElementById("nav-links");
    navLinks.classList.toggle("active");
}

// Utility function to show error messages
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

// Utility function to hide error messages
function hideError(element) {
    element.style.display = 'none';
}

// Phone number validation
function validatePhoneNumber(value) {
    const phoneError = document.getElementById('phoneError');

    if (!value) {
        showError(phoneError, 'Please enter a 10-digit number');
        return false;
    }

    if (/^[0-5]/.test(value)) {
        showError(phoneError, 'Number cannot start with 0-5');
        return false;
    }

    if (value.length < 10) {
        showError(phoneError, 'Please enter a 10-digit number');
        return false;
    }

    if (!/^\d{10}$/.test(value)) {
        showError(phoneError, 'Enter a valid 10-digit number');
        return false;
    }

    hideError(phoneError);
    return true;
}

// Fetch user details from backend API for quick recharge
async function fetchUserDetails(phoneNumber) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const phoneError = document.getElementById('phoneError');

    try {
        loadingOverlay.style.display = 'flex';
        const response = await fetch(`http://localhost:8080/api/user/check-number?number=${phoneNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user details');
        }

        const userData = await response.json();

        // Store quick recharge data with specific prefix
        sessionStorage.setItem('session_quickRechargeData', JSON.stringify({
            phoneNumber: phoneNumber,
            userDetails: userData,
            timestamp: new Date().toISOString(),
            isQuickRecharge: true
        }));

        // Store phone number separately
        sessionStorage.setItem('session_phoneNumber', phoneNumber);
        sessionStorage.setItem('session_fromQuickRecharge', 'true');

        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            setCurrentPage('plans');
        }, 500);
    } catch (error) {
        console.error('Error fetching user details:', error);
        let errorMessage = 'Phone number not registered.';
        if (error.message.toLowerCase().includes('not found')) {
            errorMessage = 'Phone number not registered. Please sign up.';
        } else if (error.message.toLowerCase().includes('invalid')) {
            errorMessage = 'Invalid phone number format.';
        } else if (error.message.includes('Network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.toLowerCase().includes('failed to fetch user details')) {
            errorMessage = 'Unable to verify the phone number. Please try again later.';
        }
        showError(phoneError, errorMessage);
        loadingOverlay.style.display = 'none';
    }
}

// Initialize and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    generateNavigation();

    const loadingOverlay = document.getElementById('loadingOverlay');
    const phoneInput = document.getElementById('phoneNumber');

    if (isLoggedIn) {
        const getStartedButton = document.querySelector('.features-section .btn-primary');
        if (getStartedButton) {
            getStartedButton.href = './subscriber/profilef.html';
            getStartedButton.textContent = 'Go to Profile';
        }
    }

    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = value.slice(0, 10);

        if (value.length > 0) {
            if (validatePhoneNumber(value) && value.length === 10) {
                fetchUserDetails(value);
            }
        } else {
            showError(document.getElementById('phoneError'), 'Please enter a 10-digit number');
        }
    });

    document.querySelectorAll('.btn-primary, .btn-track').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            loadingOverlay.style.display = 'flex';
            const url = button.getAttribute('href');
            setTimeout(() => {
                window.location.href = url;
            }, 1000);
        });
    });

    // Store logged-in user data if available (typically set during login)
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser && !sessionStorage.getItem('session_loggedInUserDetails')) {
        sessionStorage.setItem('session_loggedInUserDetails', JSON.stringify(loggedInUser));
    }
});