 // Pages configuration (matching index.html and plans.html)
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

let currentPage = "plans"; // Default to plans since this is payment page
let isLoggedIn = false;
let userInitials = "S"; // Default initial

// Utility function for fetching with timeout
async function fetchWithTimeout(url, options, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your internet connection.');
        }
        throw error;
    }
}

// Check login status based on session data
function checkLoginStatus() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    isLoggedIn = !!loggedInUser;
    if (isLoggedIn) {
        const userDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails')) || {};
        userInitials = userDetails.firstName?.charAt(0)?.toUpperCase() || 'S';
    }
}

// Generate navigation (aligned with index.html)
function generateNavigation() {
    const navLinks = document.getElementById("nav-links");
    navLinks.innerHTML = "";

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

// Set current page and navigate
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
        timerProgressBar: true
    }).then(() => {
        loadingOverlay.style.display = 'none';
        window.location.href = '../index.html';
    });
}

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.getElementById("nav-links");
    navLinks.classList.toggle("active");
}

// Display user and plan details based on session data
function displayUserDetails() {
    // Log all sessionStorage for debugging
    console.log('sessionStorage contents:', Object.fromEntries(Object.entries(sessionStorage)));

    const quickRechargeData = JSON.parse(sessionStorage.getItem('session_quickRechargeData'));
    const loggedInUserDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails'));
    const quickRechargeUserDetails = JSON.parse(sessionStorage.getItem('quickRechargeUserDetails'));
    const selectedPlan = JSON.parse(sessionStorage.getItem('selectedPlan'));
    const phoneNumber = sessionStorage.getItem('phoneNumber') || sessionStorage.getItem('session_phoneNumber');
    const fromQuickRecharge = sessionStorage.getItem('session_fromQuickRecharge') === 'true';

    console.log('quickRechargeData:', quickRechargeData);
    console.log('loggedInUserDetails:', loggedInUserDetails);
    console.log('quickRechargeUserDetails:', quickRechargeUserDetails);
    console.log('selectedPlan:', selectedPlan);
    console.log('phoneNumber:', phoneNumber);
    console.log('fromQuickRecharge:', fromQuickRecharge);

    // Determine user details: prioritize quick recharge data, then logged-in data
    let userDetails = null;
    if (fromQuickRecharge && quickRechargeData && quickRechargeData.userDetails) {
        userDetails = quickRechargeData.userDetails;
    } else if (quickRechargeUserDetails) {
        userDetails = quickRechargeUserDetails;
    } else if (loggedInUserDetails) {
        userDetails = loggedInUserDetails;
    }

    if (!phoneNumber || !selectedPlan || !userDetails) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Required data missing. Please select a plan again.',
            confirmButtonColor: '#0a21c0'
        }).then(() => {
            window.location.href = './plans.html';
        });
        return;
    }

    // Display user details
    const fullName = `${userDetails.firstName || 'User'} ${userDetails.lastName || ''}`.trim();
    $('#customerName').text(fullName);
    $('#customerNumber').text(`+91 ${phoneNumber}`);
    const initials = fullName.split(' ').map(word => word[0]).join('').toUpperCase();
    $('#customerAvatar').text(initials);

    // Display plan details
    $('#planName').text(selectedPlan.name || 'Unknown Plan');
    $('#planData').text(selectedPlan.data || 'N/A');
    $('#planValidity').text(selectedPlan.validity || 'N/A');
    $('#planCalls').text(selectedPlan.calls || 'N/A');
    $('#planSMS').text(selectedPlan.sms || 'N/A');

    // Calculate GST and total
    const planPrice = parseFloat(selectedPlan.price) || 0;
    const gstRate = 0.18;
    const gstAmount = planPrice * gstRate;
    const totalAmount = planPrice + gstAmount;

    $('#planPrice').text(`₹${planPrice.toFixed(2)}`);
    $('#gstAmount').text(`₹${gstAmount.toFixed(2)}`);
    $('#totalAmount').text(`₹${totalAmount.toFixed(2)}`);
    $('#payRazorpayAmount').text(`₹${totalAmount.toFixed(2)}`);
}

// Generate reference number
function generateRefNo() {
    return `REF${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${Math.floor(100000 + Math.random() * 900000)}`;
}

// Format date
function formatDate() {
    const date = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Format time
function formatTime() {
    const date = new Date();
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} IST`;
}

// Process payment
async function confirmPayment(razorpayPaymentId) {
    const quickRechargeData = JSON.parse(sessionStorage.getItem('session_quickRechargeData'));
    const loggedInUserDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails'));
    const quickRechargeUserDetails = JSON.parse(sessionStorage.getItem('quickRechargeUserDetails'));
    const selectedPlan = JSON.parse(sessionStorage.getItem('selectedPlan'));
    const phoneNumber = sessionStorage.getItem('phoneNumber') || sessionStorage.getItem('session_phoneNumber');
    const fromQuickRecharge = sessionStorage.getItem('session_fromQuickRecharge') === 'true';
    const userDetails = fromQuickRecharge && quickRechargeData ? quickRechargeData.userDetails : (quickRechargeUserDetails || loggedInUserDetails);
    const loadingOverlay = document.getElementById('loadingOverlay');

    if (!userDetails || !selectedPlan || !phoneNumber) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Missing required data. Please try again.',
            confirmButtonColor: '#0a21c0'
        }).then(() => {
            window.location.href = './plans.html';
        });
        return;
    }

    const rechargeData = {
        userId: userDetails.userId || userDetails.id || null,
        planId: selectedPlan.id || null,
        phoneNumber: phoneNumber,
        paymentMethod: "RAZORPAY"
    };

    if (!rechargeData.userId || !rechargeData.planId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Invalid recharge data. Please try again.',
            confirmButtonColor: '#0a21c0'
        });
        return;
    }

    loadingOverlay.style.display = 'flex';
    try {
        const response = await fetchWithTimeout('http://localhost:8080/api/recharge/recharge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(isLoggedIn && { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('loggedInUser')).accessToken}` })
            },
            body: JSON.stringify(rechargeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        if (result.status !== 'Success') {
            throw new Error(result.message || 'Recharge failed');
        }

        const planPrice = parseFloat(selectedPlan.price);
        const totalAmount = planPrice + (planPrice * 0.18);

        const transactionDetails = {
            mobileNumber: `+91 ${phoneNumber}`,
            customerName: `${userDetails.firstName || 'User'} ${userDetails.lastName || ''}`.trim(),
            amount: `₹${totalAmount.toFixed(2)}`,
            refNo: generateRefNo(),
            txnId: razorpayPaymentId || result.transactionId,
            date: formatDate(),
            time: formatTime(),
            paymentMode: "RAZORPAY",
            planName: selectedPlan.name
        };

        sessionStorage.setItem('session_transactionDetails', JSON.stringify(transactionDetails));
        loadingOverlay.style.display = 'none';
        window.location.href = './success.html';
    } catch (error) {
        loadingOverlay.style.display = 'none';
        Swal.fire({
            icon: 'error',
            title: 'Recharge Failed',
            text: error.message || 'An error occurred. Please try again.',
            confirmButtonColor: '#0a21c0'
        });
    }
}

// Razorpay Payment Integration
async function initiateRazorpayPayment() {
    const quickRechargeData = JSON.parse(sessionStorage.getItem('session_quickRechargeData'));
    const loggedInUserDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails'));
    const quickRechargeUserDetails = JSON.parse(sessionStorage.getItem('quickRechargeUserDetails'));
    const selectedPlan = JSON.parse(sessionStorage.getItem('selectedPlan'));
    const phoneNumber = sessionStorage.getItem('phoneNumber') || sessionStorage.getItem('session_phoneNumber');
    const fromQuickRecharge = sessionStorage.getItem('session_fromQuickRecharge') === 'true';
    const userDetails = fromQuickRecharge && quickRechargeData ? quickRechargeData.userDetails : (quickRechargeUserDetails || loggedInUserDetails);
    const loadingOverlay = document.getElementById('loadingOverlay');

    if (!userDetails || !selectedPlan || !phoneNumber) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Missing required data. Please try again.',
            confirmButtonColor: '#0a21c0'
        }).then(() => {
            window.location.href = './plans.html';
        });
        return;
    }

    const planPrice = parseFloat(selectedPlan.price);
    const totalAmount = (planPrice + planPrice * 0.18) * 100;

    const options = {
        key: "rzp_test_swf3FXzw0ItrnX",
        amount: totalAmount,
        currency: "INR",
        name: "Nova SIM",
        description: `Recharge for ${selectedPlan.name}`,
        image: "../assets/images/logo.webp",
        handler: async function (response) {
            await confirmPayment(response.razorpay_payment_id);
        },
        prefill: {
            name: `${userDetails.firstName || 'User'} ${userDetails.lastName || ''}`.trim(),
            email: userDetails.email || "customer@example.com",
            contact: phoneNumber
        },
        theme: { color: "#0a21c0" },
        modal: {
            ondismiss: function () {
                loadingOverlay.style.display = 'none';
                Swal.fire({
                    icon: 'info',
                    title: 'Payment Cancelled',
                    text: 'You cancelled the payment. Please try again.',
                    confirmButtonColor: '#0a21c0'
                });
            }
        }
    };

    try {
        loadingOverlay.style.display = 'flex';
        const rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        loadingOverlay.style.display = 'none';
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to initialize payment. Please try again.',
            confirmButtonColor: '#0a21c0'
        });
    }
}

// Update breadcrumb
function updateBreadcrumb() {
    const breadcrumbList = $('#breadcrumbList');
    breadcrumbList.empty();
    breadcrumbList.append('<li class="breadcrumb-item"><a href="./plans.html">Plans</a></li>');
    breadcrumbList.append('<li class="breadcrumb-item active" aria-current="page">Payment</li>');
}

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    generateNavigation();
    displayUserDetails();
    updateBreadcrumb();

    const payRazorpayBtn = document.getElementById('payRazorpayBtn');
    payRazorpayBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!isLoggedIn && !sessionStorage.getItem('session_quickRechargeData') && !sessionStorage.getItem('quickRechargeUserDetails')) {
            Swal.fire({
                icon: 'warning',
                title: 'Login Required',
                text: 'Please login or use quick recharge to proceed with payment.',
                confirmButtonColor: '#0a21c0'
            }).then(() => {
                window.location.href = './login.html';
            });
            return;
        }
        await initiateRazorpayPayment();
    });
});