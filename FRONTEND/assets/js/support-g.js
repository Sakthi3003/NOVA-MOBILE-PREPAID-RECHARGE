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

let currentPage = "support";
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

// Debounce function for real-time validation
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validation Functions
function validateName(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('name-error');

    if (!value || value.length < 2 || !/^[a-zA-Z\s]+$/.test(value)) {
        input.classList.add('error');
        errorElement.style.display = 'block';
        input.setAttribute('aria-invalid', 'true');
        return false;
    } else {
        input.classList.remove('error');
        errorElement.style.display = 'none';
        input.setAttribute('aria-invalid', 'false');
        return true;
    }
}

function validateEmail(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('email-error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value || !emailRegex.test(value)) {
        input.classList.add('error');
        errorElement.style.display = 'block';
        input.setAttribute('aria-invalid', 'true');
        return false;
    } else {
        input.classList.remove('error');
        errorElement.style.display = 'none';
        input.setAttribute('aria-invalid', 'false');
        return true;
    }
}

function validateSubject(input) {
    const value = input.value;
    const errorElement = document.getElementById('subject-error');

    if (!value) {
        input.classList.add('error');
        errorElement.style.display = 'block';
        input.setAttribute('aria-invalid', 'true');
        return false;
    } else {
        input.classList.remove('error');
        errorElement.style.display = 'none';
        input.setAttribute('aria-invalid', 'false');
        return true;
    }
}

function validateMessage(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('message-error');

    if (!value || value.length < 10) {
        input.classList.add('error');
        errorElement.style.display = 'block';
        input.setAttribute('aria-invalid', 'true');
        return false;
    } else {
        input.classList.remove('error');
        errorElement.style.display = 'none';
        input.setAttribute('aria-invalid', 'false');
        return true;
    }
}

// Real-time Validation with Debounce
const inputs = document.querySelectorAll('#supportForm input, #supportForm select, #supportForm textarea');
inputs.forEach(input => {
    const debouncedValidation = debounce(() => {
        if (input.id === 'name') validateName(input);
        else if (input.id === 'email') validateEmail(input);
        else if (input.id === 'subject') validateSubject(input);
        else if (input.id === 'message') validateMessage(input);
    }, 300);

    input.addEventListener('input', debouncedValidation);
    input.addEventListener('change', () => {
        if (input.id === 'name') validateName(input);
        else if (input.id === 'email') validateEmail(input);
        else if (input.id === 'subject') validateSubject(input);
        else if (input.id === 'message') validateMessage(input);
    });
});

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');

    const isNameValid = validateName(nameInput);
    const isEmailValid = validateEmail(emailInput);
    const isSubjectValid = validateSubject(subjectInput);
    const isMessageValid = validateMessage(messageInput);

    if (isNameValid && isEmailValid && isSubjectValid && isMessageValid) {
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Thank you! Our support team will contact you soon.',
                confirmButtonColor: '#0a21c0'
            }).then(() => {
                document.getElementById('supportForm').reset();
                inputs.forEach(input => {
                    input.classList.remove('error');
                    const errorElement = document.getElementById(`${input.id}-error`);
                    errorElement.style.display = 'none';
                    input.setAttribute('aria-invalid', 'false');
                });
                submitBtn.disabled = false;
            });
        }, 1000);
    } else {
        loadingOverlay.style.display = 'none';
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please fill out all fields correctly before submitting.',
            confirmButtonColor: '#0a21c0'
        });
        submitBtn.disabled = false;
    }
}

// Initialize page
$(document).ready(function() {
    generateNavigation();

    // FAQ Toggle Functionality
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', function() {
            const answer = this.querySelector('.faq-answer');
            const icon = this.querySelector('.fa-chevron-down');
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
            icon.style.transform = answer.style.display === 'block' ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });

    // FAQ Category Filtering
    document.querySelectorAll('.faq-category').forEach(category => {
        category.addEventListener('click', function() {
            document.querySelectorAll('.faq-category').forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            const selectedCategory = this.getAttribute('data-category');
            document.querySelectorAll('.faq-item').forEach(item => {
                item.style.display = (selectedCategory === 'all' || item.getAttribute('data-category') === selectedCategory) ? 'block' : 'none';
            });
        });
    });

    // FAQ Search Functionality
    document.getElementById('faqSearch').addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase();
        document.querySelectorAll('.faq-item').forEach(item => {
            const question = item.querySelector('.faq-question span').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
            item.style.display = (question.includes(searchTerm) || answer.includes(searchTerm)) ? 'block' : 'none';
        });
    });
});