// Pages configuration (consistent with index.html)
const guestPages = [
    { id: "home", label: "Home", url: "../index.html" },
    { id: "plans", label: "Plans", url: "./plans.html" },
    { id: "support", label: "Support", url: "./support.html" },
    { id: "about", label: "About Us", url: "./about.html" }
];

const loggedInDropdownPages = [
    { id: "myplans", label: "My Plans", url: "./myplans.html" },
    { id: "transactions", label: "Transactions", url: "./transaction.html" },
    { id: "profile", label: "Profile", url: "./profilef.html" },
];

let currentPage = "plans";
let selectedPlan = null;
let isLoggedIn = false;
let userInitials = "S";

// Debounce function
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Fetch categories from the backend API
async function fetchCategories() {
    try {
        const response = await fetch('http://localhost:8080/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories from API');
        const categoriesData = await response.json();
        if (!Array.isArray(categoriesData)) {
            throw new Error('Invalid categories API response structure');
        }
        return categoriesData;
    } catch (error) {
        console.error('Error fetching categories from API:', error);
        return [];
    }
}

// Fetch plans from the backend API (with optional search term)
async function fetchPlans(searchTerm = '') {
    try {
        const url = `http://localhost:8080/api/plans?page=0&size=50${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}&status=active`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch plans from API');
        const data = await response.json();
        if (!data.content || !Array.isArray(data.content)) {
            throw new Error('Invalid API response structure');
        }
        return data.content;
    } catch (error) {
        console.error('Error fetching plans from API:', error);
        return [];
    }
}

// Search plans from backend
async function searchPlansFromBackend(searchTerm) {
    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';

        const apiPlans = await fetchPlans(searchTerm);
        const mappedPlans = mapApiPlansToFrontend(apiPlans);
        const categories = await fetchCategories();

        renderTabs(categories, mappedPlans);
        renderPlans(mappedPlans, categories);

        const activeTab = document.querySelector('.tab.active') || document.querySelector('.tab');
        if (activeTab) {
            activeTab.classList.add('active');
            const category = activeTab.dataset.category;
            document.querySelectorAll('.category-section').forEach(section => {
                section.style.display = section.dataset.category === category ? 'block' : 'none';
            });
        }

        loadingOverlay.style.display = 'none';
    } catch (error) {
        console.error('Error searching plans from API:', error);
        Swal.fire({
            icon: 'error',
            title: 'Search Error',
            text: 'Unable to fetch plans. Please try again later.',
            confirmButtonColor: '#0a21c0'
        });
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Map API response to the frontend expected structure
function mapApiPlansToFrontend(apiPlans) {
    return apiPlans
        .filter(plan => plan.status === "active")
        .map(plan => ({
            id: plan.id,
            category: plan.category.name.toLowerCase().replace(/\s+/g, '-'),
            name: plan.name,
            price: plan.price,
            validity: plan.validity,
            data: plan.data,
            sms: plan.sms,
            calls: plan.calls,
            benefits: [plan.benefit1, plan.benefit2].filter(b => b),
            badge: plan.name === "Unlimited Plan" ? "Best Seller" : "",
            icon: getIconForCategory(plan.category.name)
        }));
}

// Assign icons based on category
function getIconForCategory(categoryName) {
    const iconMap = {
        "popular": "fas fa-infinity",
        "data-top-up": "fas fa-wifi",
        "5g plans": "fas fa-signal",
        "entertainment": "fas fa-tv",
        "ott": "fas fa-video",
        "validity": "fas fa-calendar-alt",
        "family": "fas fa-users",
        "voice": "fas fa-phone"
    };
    return iconMap[categoryName.toLowerCase()] || "fas fa-star";
}

// Render tabs dynamically
function renderTabs(categories, plans) {
    const tabsContainer = document.getElementById("tabs");
    tabsContainer.innerHTML = "";

    categories.forEach((category, index) => {
        if (category.name && category.name.trim() !== "") {
            const normalizedCategory = category.name.toLowerCase().replace(/\s+/g, '-');
            const categoryPlans = plans.filter(plan => plan.category === normalizedCategory);
            if (categoryPlans.length > 0) {
                const tab = document.createElement("div");
                tab.className = `tab ${index === 0 ? 'active' : ''}`;
                tab.dataset.category = normalizedCategory;
                tab.textContent = category.name;
                tabsContainer.appendChild(tab);
            }
        }
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.dataset.category;
            document.querySelectorAll('.category-section').forEach(section => {
                section.style.display = section.dataset.category === category ? 'block' : 'none';
            });
        });
    });
}

// Render plans dynamically
function renderPlans(plans, categories) {
    const plansList = document.getElementById("plansList");
    plansList.innerHTML = "";

    categories.forEach((category, index) => {
        if (category.name && category.name.trim() !== "") {
            const normalizedCategory = category.name.toLowerCase().replace(/\s+/g, '-');
            const categoryPlans = plans.filter(plan => plan.category === normalizedCategory);

            if (categoryPlans.length > 0) {
                const categorySection = document.createElement("div");
                categorySection.className = "category-section";
                categorySection.dataset.category = normalizedCategory;
                categorySection.style.display = index === 0 ? "block" : "none";

                const plansGrid = document.createElement("div");
                plansGrid.className = "plans-grid";

                categoryPlans.forEach(plan => {
                    const planCard = document.createElement("div");
                    planCard.className = "plan-card";

                    if (plan.badge) {
                        const badge = document.createElement("span");
                        badge.className = `badge ${plan.badge.toLowerCase() === "best seller" ? "" : "green"}`;
                        badge.textContent = plan.badge;
                        planCard.appendChild(badge);
                    }

                    planCard.innerHTML += `
                        <h3>${plan.name} <i class="${plan.icon}"></i></h3>
                        <div class="plan-price">₹${plan.price}</div>
                        <div class="plan-details">
                            <div class="plan-detail"><i class="fas fa-calendar-alt"></i> Validity: ${plan.validity}</div>
                            <div class="plan-detail"><i class="fas fa-mobile-alt"></i> Data: ${plan.data}</div>
                            <div class="plan-detail"><i class="fas fa-sms"></i> SMS: ${plan.sms}</div>
                            <div class="plan-detail"><i class="fas fa-phone"></i> Calls: ${plan.calls}</div>
                        </div>
                        <div class="plan-benefits">
                            <ul>
                                ${plan.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                            </ul>
                        </div>
                        <button class="buy-now-btn" 
                            data-plan-id="${plan.id}" 
                            data-plan-name="${plan.name}" 
                            data-plan-price="${plan.price}" 
                            data-plan-validity="${plan.validity}" 
                            data-plan-data="${plan.data}" 
                            data-plan-sms="${plan.sms}" 
                            data-plan-calls="${plan.calls}" 
                            data-plan-benefits="${encodeURIComponent(JSON.stringify(plan.benefits))}">
                            Recharge Now
                        </button>
                    `;

                    plansGrid.appendChild(planCard);
                });

                categorySection.appendChild(plansGrid);
                plansList.appendChild(categorySection);
            }
        }
    });
}

// Generate navigation
function generateNavigation() {
    const navLinks = document.getElementById("nav-links");
    navLinks.innerHTML = "";

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
        loginBtn.href = "./login.html";
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
    const navLinks = document.getElementById("nav-links");
    navLinks.classList.toggle("active");
}

// Show change number modal
function showChangeNumberModal(isChangeNumber = false, plan = null) {
    const modal = document.getElementById("numberModal");
    const modalTitle = document.getElementById("modalTitle");
    modal.classList.add('show');

    const quickRechargeData = JSON.parse(sessionStorage.getItem('session_quickRechargeData'));
    const loggedInUserDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails'));
    const phoneNumber = quickRechargeData?.phoneNumber || loggedInUserDetails?.phoneNumber || sessionStorage.getItem('phoneNumber') || '';

    document.getElementById("modalNumberInput").value = phoneNumber;
    document.getElementById("modalErrorMessage").style.display = "none";
    modal.dataset.isChangeNumber = isChangeNumber ? "true" : "false";

    if (plan) {
        selectedPlan = plan;
        modalTitle.textContent = `Recharge ${plan.name}`;
    } else {
        modalTitle.textContent = "Enter Your Mobile Number";
    }
}

// Show confirmation modal
function showConfirmModal(plan) {
    const modal = document.getElementById("confirmModal");
    if (!modal) return;
    const modalTitle = modal.querySelector('h3');
    if (!modalTitle) return;
    modalTitle.textContent = `Do you want to recharge with the ${plan.name} plan?`;
    selectedPlan = plan;
    modal.classList.add('show');
}

// Handle Yes button in confirmation modal
function confirmYes() {
    const modal = document.getElementById("confirmModal");
    modal.classList.remove('show');
    const phoneNumber = sessionStorage.getItem('phoneNumber');
    
    if (phoneNumber && selectedPlan) {
        proceedToPayment(selectedPlan);
    } else if (selectedPlan) {
        showChangeNumberModal(false, selectedPlan);
    }
}

// Handle No button in confirmation modal
function confirmNo() {
    const modal = document.getElementById("confirmModal");
    modal.classList.remove('show');
    selectedPlan = null;
}

// Submit number modal
function submitNumberModal() {
    validateModalNumber();
}

// Dynamic validation for phone number input
async function validateNumberDynamic(mobileNumber) {
    const errorMessage = document.getElementById("modalErrorMessage");
    const mobileNumberPattern = /^[6789]\d{9}$/;

    if (!mobileNumber) {
        errorMessage.textContent = 'Phone number is required';
        errorMessage.style.display = "block";
        return false;
    }
    if (!mobileNumberPattern.test(mobileNumber)) {
        errorMessage.textContent = 'Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9.';
        errorMessage.style.display = "block";
        return false;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/user/check-number?number=${mobileNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            errorMessage.style.display = "none";
            return true;
        } else {
            const errorData = await response.json();
            errorMessage.textContent = errorData.message || 'This doesn’t seem to be a NOVA number. Please check and try again.';
            errorMessage.style.display = "block";
            return false;
        }
    } catch (error) {
        console.error('Error validating phone number dynamically:', error);
        errorMessage.textContent = 'Phone number not registered';
        errorMessage.style.display = "block";
        return false;
    }
}

// Validate modal number input on submit
async function validateModalNumber() {
    const mobileNumber = document.getElementById("modalNumberInput").value.trim();
    const errorMessage = document.getElementById("modalErrorMessage");
    const modal = document.getElementById("numberModal");
    const isChangeNumber = modal.dataset.isChangeNumber === "true";

    const isValid = await validateNumberDynamic(mobileNumber);
    if (!isValid) return;

    try {
        const response = await fetch(`http://localhost:8080/api/user/check-number?number=${mobileNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            sessionStorage.setItem('phoneNumber', mobileNumber);
            sessionStorage.setItem('quickRechargeUserDetails', JSON.stringify(user));

            document.getElementById("selectedNumber").textContent = mobileNumber;
            document.getElementById("numberModal").classList.remove('show');
            document.getElementById("numberDisplay").style.display = "flex";

            if (!isChangeNumber && selectedPlan) {
                proceedToPayment(selectedPlan);
            }
        }
    } catch (error) {
        console.error('Error in validateModalNumber:', error);
        errorMessage.textContent = 'Phone number not registered';
        errorMessage.style.display = "block";
    }
}

// Proceed to payment page
function proceedToPayment(plan) {
    sessionStorage.setItem('selectedPlan', JSON.stringify({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        validity: plan.validity,
        data: plan.data,
        sms: plan.sms,
        calls: plan.calls,
        benefits: plan.benefits
    }));
    sessionStorage.removeItem('session_fromQuickRecharge');
    window.location.href = 'payment.html';
}

// Initialize and set up event listeners
document.addEventListener('DOMContentLoaded', async () => {
    const apiPlans = await fetchPlans();
    const mappedPlans = mapApiPlansToFrontend(apiPlans);
    const categories = await fetchCategories();

    renderTabs(categories, mappedPlans);
    renderPlans(mappedPlans, categories);

    generateNavigation();

    // Check for existing phone number
    const quickRechargeData = JSON.parse(sessionStorage.getItem('session_quickRechargeData'));
    const loggedInUserDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails'));
    let phoneNumber = sessionStorage.getItem('phoneNumber') || 
                     quickRechargeData?.phoneNumber || 
                     loggedInUserDetails?.phoneNumber;

    if (quickRechargeData && quickRechargeData.isQuickRecharge) {
        phoneNumber = quickRechargeData.phoneNumber;
        sessionStorage.setItem('phoneNumber', phoneNumber);
        sessionStorage.setItem('quickRechargeUserDetails', JSON.stringify(quickRechargeData.userDetails));
    }

    if (phoneNumber) {
        document.getElementById("selectedNumber").textContent = phoneNumber;
        document.getElementById("numberDisplay").style.display = "flex";
    } else {
        document.getElementById("numberDisplay").style.display = "none";
    }

    // Debounced search function
    const debouncedSearch = debounce(async (searchTerm) => {
        await searchPlansFromBackend(searchTerm);
    }, 300); // 300ms delay

    // Search input event listener with debouncing
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        debouncedSearch(searchTerm);
    });

    // Buy now buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('buy-now-btn')) {
            const plan = {
                id: e.target.dataset.planId,
                name: e.target.dataset.planName,
                price: e.target.dataset.planPrice,
                validity: e.target.dataset.planValidity,
                data: e.target.dataset.planData,
                sms: e.target.dataset.planSms,
                calls: e.target.dataset.planCalls,
                benefits: JSON.parse(decodeURIComponent(e.target.dataset.planBenefits))
            };
            showConfirmModal(plan);
        }
    });

    // Close modals on outside click or Esc key
    ['numberModal', 'confirmModal'].forEach(id => {
        document.getElementById(id).addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.classList.remove('show');
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById("numberModal").classList.remove('show');
            document.getElementById("confirmModal").classList.remove('show');
        }
    });

    // Dynamic phone number input validation
    const modalNumberInput = document.getElementById('modalNumberInput');
    modalNumberInput.addEventListener('input', async (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = value.slice(0, 10);

        const errorMessage = document.getElementById('modalErrorMessage');
        if (value.length === 0) {
            errorMessage.textContent = 'Phone number is required';
            errorMessage.style.display = 'block';
        } else if (value.length === 10) {
            await validateNumberDynamic(value);
        } else {
            errorMessage.textContent = 'Please enter a 10-digit phone number.';
            errorMessage.style.display = 'block';
        }
    });
});