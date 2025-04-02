 // Pages configuration (consistent with previous pages)
 const guestPages = [
    { id: "home", label: "Home", url: "../index.html" },
    { id: "plans", label: "Plans", url: "./plans.html" },
    { id: "support", label: "Support", url: "./support.html" },
    { id: "about", label: "About Us", url: "./about.html" }
];

const loggedInDropdownPages = [
    { id: "myplans", label: "My Plans", url: "./myplans.html" },
    { id: "transactions", label: "Transactions", url: "./transaction.html" },
    { id: "profile", label: "Profile", url: "./profilef.html" } // Aligned with payment.html
];

let currentPage = "about";
let isLoggedIn = false;
let userInitials = "S";

// Check login status consistently with previous pages
function checkLoginStatus() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    isLoggedIn = !!loggedInUser;
    if (isLoggedIn) {
        const userDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails')) || {};
        userInitials = userDetails.firstName?.charAt(0)?.toUpperCase() || 'S';
    }
}

// Generate navigation (consistent with previous pages)
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
        loginBtn.href = "./login.html";
        loginBtn.className = "btn login-btn";
        loginBtn.textContent = "Login";
        navLinks.appendChild(loginBtn);
    }
}

// Set current page and navigate with loading overlay
function setCurrentPage(pageId) {
    currentPage = pageId;
    const guestPage = guestPages.find(p => p.id === pageId);
    const loggedInPage = loggedInDropdownPages.find(p => p.id === pageId);
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    setTimeout(() => {
        if (guestPage) {
            window.location.href = guestPage.url;
        } else if (loggedInPage) {
            window.location.href = loggedInPage.url;
        }
        loadingOverlay.style.display = 'none';
    }, 1000);
}

// Logout function with SweetAlert2 and loading overlay (consistent with previous pages)
function logout() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

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
            loadingOverlay.style.display = 'none';
            window.location.href = '../index.html';
        }
    });
}

// Toggle mobile menu
function toggleMenu() {
    document.getElementById("nav-links").classList.toggle("active");
}

// Initialize navigation on page load
$(document).ready(function() {
    generateNavigation();
});