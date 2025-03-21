const guestPages = [
    { id: "admin", label: "Admin", url: "./ADMIN/login.html" },
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

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
    isLoggedIn = !!loggedInUser;

    if (isLoggedIn && userDetails) {
        userInitials = userDetails.username?.charAt(0).toUpperCase() || 'U';

        // Add user initials display
        const initialsDisplay = document.createElement("div");
        initialsDisplay.className = "user-initials-display";
        initialsDisplay.textContent = userInitials;
        navLinks.appendChild(initialsDisplay);

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

// Logout function with loading overlay
function logout() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Show the loading overlay
    loadingOverlay.style.display = 'flex';

    // Clear local and session storage
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('profileSetup');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    sessionStorage.removeItem('phoneNumber');
    sessionStorage.removeItem('userDetails');
    isLoggedIn = false;
    currentPage = 'home';
    generateNavigation();

    // Add a delay to show the loading spinner, then redirect
    setTimeout(() => {
        loadingOverlay.style.display = 'none';
        window.location.href = 'index.html';
    }, 1000); // 1-second delay to show the loading spinner
}

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.getElementById("nav-links");
    navLinks.classList.toggle("active");
}

// Phone number validation (matching login.html)
function validatePhoneNumber(value) {
    const phoneError = document.getElementById('phoneError');

    if (value.length === 0) {
        phoneError.textContent = 'Phone number is required';
        phoneError.style.display = 'block';
        return false;
    }

    if (/^[0-5]/.test(value)) {
        phoneError.textContent = 'Number cannot start with 0, 1, 2, 3, 4, or 5';
        phoneError.style.display = 'block';
        return false;
    }

    if (value.length < 10) {
        phoneError.textContent = 'Please enter a 10-digit number';
        phoneError.style.display = 'block';
        return false;
    }

    if (!/^\d{10}$/.test(value)) {
        phoneError.textContent = 'Enter a valid 10-digit number';
        phoneError.style.display = 'block';
        return false;
    }

    phoneError.style.display = 'none';
    return true;
}

// Fetch user details from backend API
async function fetchUserDetails(phoneNumber) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const phoneError = document.getElementById('phoneError');

    try {
        loadingOverlay.style.display = 'flex';
        const response = await fetch(`http://localhost:8080/api/subscriber/check-number?number=${phoneNumber}`, {
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
        }, 500); // Small delay to show loading spinner
    } catch (error) {
        console.error('Error fetching user details:', error);
        phoneError.textContent = error.message || 'This number is not registered';
        phoneError.style.display = 'block';
        loadingOverlay.style.display = 'none';
    }
}

// Initialize and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    generateNavigation();

    const loadingOverlay = document.getElementById('loadingOverlay');
    const phoneInput = document.getElementById('phoneNumber');

    // Dynamic phone number input validation (matching login.html)
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = value.slice(0, 10);

        if (value.length > 0) {
            validatePhoneNumber(value);
            if (value.length === 10 && validatePhoneNumber(value)) {
                fetchUserDetails(value);
            }
        } else {
            document.getElementById('phoneError').textContent = 'Phone number is required';
            document.getElementById('phoneError').style.display = 'block';
        }
    });

    // Handle Buy SIM and Track Order buttons
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