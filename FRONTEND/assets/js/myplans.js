const loggedInDropdownPages = [
    { id: "myplans", label: "My Plans", url: "myplans.html" },
    { id: "transactions", label: "Transactions", url: "transaction.html" },
    { id: "profile", label: "Profile", url: "profilef.html" },
];

const mainPages = [
    { id: "home", label: "Home", url: "./indexu.html" },
    { id: "plans", label: "Plans", url: "plansu.html" },
    { id: "support", label: "Support", url: "support.html" },
    { id: "about", label: "About Us", url: "about.html" }
];

let currentPage = "myplans";

function generateNavigation() {
    const navLinks = document.getElementById("nav-links");
    const homeLink = document.getElementById("home-link");
    const plansLink = document.getElementById("plans-link");
    const supportLink = document.getElementById("support-link");
    const aboutLink = document.getElementById("about-link");

    homeLink.className = `nav-link ${currentPage === 'home' ? 'active' : ''}`;
    plansLink.className = `nav-link ${currentPage === 'plans' ? 'active' : ''}`;
    supportLink.className = `nav-link ${currentPage === 'support' ? 'active' : ''}`;
    aboutLink.className = `nav-link ${currentPage === 'about' ? 'active' : ''}`;

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
        avatar.textContent = loggedInUser.simHolderName ? loggedInUser.simHolderName.charAt(0).toUpperCase() : 'U';
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
        window.location.href = '../index.html';
    }
}

function setCurrentPage(pageId) {
    currentPage = pageId;
    const page = [...mainPages, ...loggedInDropdownPages].find(p => p.id === pageId);
    if (page) {
        $('#loadingOverlay').css('display', 'flex'); // Show overlay
        setTimeout(() => {
            window.location.href = page.url;
        }, 1000); // Match 1-second delay from indexu.html
    }
    generateNavigation();
}

function logout() {
    $('#loadingOverlay').css('display', 'flex'); // Show overlay
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('profileSetup');
    sessionStorage.removeItem('phoneNumber');
    
    setTimeout(() => {
        $('#loadingOverlay').css('display', 'none'); // Hide overlay
        window.location.href = '../index.html';
    }, 1000); // Match 1-second delay from indexu.html
}

function toggleMenu() {
    const navLinks = document.getElementById("nav-links");
    navLinks.classList.toggle("active");
}

$(document).ready(function() {
    generateNavigation();

    const modal = $('#rechargeModal');
    const modalBody = $('#modalBody');
    const modalClose = $('#modalClose');
    const modalCancel = $('#modalCancel');
    const planSearch = $('#planSearch');
    const categoryFilter = $('#categoryFilter');
    const plansTableBody = $('#plansTableBody');

    const plansData = [
        {
            id: "1",
            name: "Premium Monthly",
            category: ["data", "5g"],
            price: "₹1,999",
            startDate: "Jan 28, 2025",
            endDate: "Feb 28, 2025",
            sms: "100/day",
            calls: "Unlimited",
            benefits: ["Prime Video", "Weekend Data Rollover"],
            status: "Active"
        },
        {
            id: "2",
            name: "Premium Quarterly",
            category: ["entertainment", "5g", "data"],
            price: "₹5,499",
            startDate: "Nov 10, 2024",
            endDate: "Feb 10, 2025",
            sms: "100/day",
            calls: "Unlimited",
            benefits: ["Netflix Basic", "Prime Video", "Disney+ Hotstar"],
            status: "Expired"
        },
        {
            id: "3",
            name: "Premium Monthly",
            category: ["data", "5g"],
            price: "₹1,999",
            startDate: "Dec 28, 2024",
            endDate: "Jan 28, 2025",
            sms: "100/day",
            calls: "Unlimited",
            benefits: ["Prime Video", "Weekend Data Rollover"],
            status: "Expired"
        },
        {
            id: "4",
            name: "Data Booster",
            category: ["data", "5g"],
            price: "₹299",
            startDate: "Jan 15, 2025",
            endDate: "Feb 15, 2025",
            sms: "-",
            calls: "-",
            benefits: ["20GB Data Only Pack", "Valid with any active plan"],
            status: "Expired"
        }
    ];

    $('.view-details').on('click', function() {
        $('#loadingOverlay').css('display', 'flex'); // Show overlay
        const planId = $(this).data('plan-id');
        const plan = plansData.find(p => p.id === String(planId));

        if (plan) {
            modalBody.html(`
                <div class="detail-row"><span class="detail-label">Plan Name:</span><span>${plan.name}</span></div>
                <div class="detail-row"><span class="detail-label">Category:</span><span>${plan.category.join(', ')}</span></div>
                <div class="detail-row"><span class="detail-label">Price:</span><span>${plan.price}</span></div>
                <div class="detail-row"><span class="detail-label">Start Date:</span><span>${plan.startDate}</span></div>
                <div class="detail-row"><span class="detail-label">End Date:</span><span>${plan.endDate}</span></div>
                <div class="detail-row"><span class="detail-label">SMS:</span><span>${plan.sms}</span></div>
                <div class="detail-row"><span class="detail-label">Calls:</span><span>${plan.calls}</span></div>
                <div class="detail-row"><span class="detail-label">Benefits:</span><span>${plan.benefits.join(', ')}</span></div>
                <div class="detail-row"><span class="detail-label">Status:</span><span>${plan.status}</span></div>
            `);
            setTimeout(() => {
                $('#loadingOverlay').css('display', 'none'); // Hide overlay
                modal.css('display', 'flex');
            }, 1000); // Match 1-second delay from indexu.html
        }
    });

    modalClose.on('click', function() {
        modal.css('display', 'none');
    });

    modalCancel.on('click', function() {
        modal.css('display', 'none');
    });

    $(window).on('click', function(event) {
        if (event.target === modal[0]) {
            modal.css('display', 'none');
        }
    });

    function filterPlans() {
        const searchText = planSearch.val().toLowerCase();
        const selectedCategory = categoryFilter.val().toLowerCase();

        plansTableBody.find('tr').each(function() {
            const row = $(this);
            const planName = row.find('td:first-child').text().toLowerCase();
            const categories = plansData.find(p => p.name === row.find('td:first-child').text()).category;

            const matchesSearch = planName.includes(searchText);
            const matchesCategory = !selectedCategory || categories.includes(selectedCategory);

            if (matchesSearch && matchesCategory) {
                row.show();
            } else {
                row.hide();
            }
        });
    }

    planSearch.on('input', filterPlans);
    categoryFilter.on('change', filterPlans);
});