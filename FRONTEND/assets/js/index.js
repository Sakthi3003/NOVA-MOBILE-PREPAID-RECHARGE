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
let userInitials = "U";

// Generate navigation
function generateNavigation() {
    const navLinks = document.getElementById("nav-links");
    navLinks.innerHTML = "";

    // Check localStorage for logged-in state
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userDetailsString = sessionStorage.getItem('userDetails');
    let userDetails = null;

    if (userDetailsString) {
        try {
            userDetails = JSON.parse(userDetailsString);
            console.log('Parsed userDetails:', userDetails); // Debugging
        } catch (error) {
            console.error('Error parsing userDetails:', error);
            sessionStorage.removeItem('userDetails');
        }
    } else {
        console.log('userDetails not found in sessionStorage'); // Debugging
    }

    // User is considered logged in if loggedInUser exists in localStorage
    isLoggedIn = !!loggedInUser;
    console.log('isLoggedIn:', isLoggedIn, 'loggedInUser:', loggedInUser); // Debugging

    if (isLoggedIn) {
        // Use first_name for initials (matches backend response)
        userInitials = userDetails?.first_name?.charAt(0)?.toUpperCase() || 'U';
        console.log('userInitials:', userInitials); // Debugging

        // Add guest pages (Home, Plans, Support, About Us)
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

        // Add dropdown for logged-in user
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
        // Guest view: Home, Plans, Support, About Us, Login
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
        loginBtn.href = "../subscriber/login.html"; 
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

// Logout function with loading overlay
function logout() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Show the loading overlay
    loadingOverlay.style.display = 'flex';

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    isLoggedIn = false;
    currentPage = 'home';

    // Update navigation immediately
    generateNavigation();

    // Show success message without SweetAlert2
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

// Fetch user details from backend API
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
        sessionStorage.setItem('userDetails', JSON.stringify(userData));
        sessionStorage.setItem('phoneNumber', phoneNumber);
        sessionStorage.setItem('fromQuickRecharge', 'true');
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

    // Update "Get Started" button immediately after generating navigation
    if (isLoggedIn) {
        const getStartedButton = document.querySelector('.features-section .btn-primary');
        if (getStartedButton) {
            getStartedButton.href = './subscriber/profilef.html';
            getStartedButton.textContent = 'Go to Profile';
        }
    }

    // Dynamic phone number input validation
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

    // Handle Buy SIM and Port Now buttons
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
});