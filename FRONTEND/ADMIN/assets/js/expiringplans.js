document.addEventListener('DOMContentLoaded', () => {
    // Navbar Toggler Functionality (Matching Screenshot and Admin Dashboard)
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Sample customer data
    const customers = [
        { id: "john", name: "John Smith", email: "john.smith@example.com", phone: "9876543210", plan: "Validity", expiry: "2025-03-04", amount: "₹299", transactions: [
            { date: "2025-02-01", plan: "Validity", amount: "₹299", status: "Completed" },
            { date: "2025-01-01", plan: "Entertainment", amount: "₹299", status: "Completed" }
        ]},
        { id: "jane", name: "Jane Doe", email: "jane.doe@example.com", phone: "8124477033", plan: "Validity", expiry: "2025-03-04", amount: "₹499", transactions: [
            { date: "2025-02-28", plan: "Validity", amount: "₹499", status: "Completed" }
        ]},
        { id: "robert", name: "Robert Johnson", email: "robert.j@example.com", phone: "9876576543", plan: "Entertainment", expiry: "2025-03-04", amount: "₹99", transactions: [
            { date: "2025-02-01", plan: "Entertainment", amount: "₹99", status: "Completed" }
        ]},
        { id: "emily", name: "Emily Wilson", email: "emily.w@example.com", phone: "9876556789", plan: "OTT", expiry: "2025-03-04", amount: "₹999", transactions: [
            { date: "2025-02-27", plan: "OTT", amount: "₹999", status: "Completed" }
        ]},
        { id: "michael", name: "Michael Brown", email: "michael.b@example.com", phone: "9876789876", plan: "5G", expiry: "2025-03-04", amount: "₹499", transactions: [
            { date: "2025-02-01", plan: "5G", amount: "₹499", status: "Completed" }
        ]}
    ];

    const expiringList = document.getElementById('expiringList');
    const searchInput = document.getElementById('searchInput');
    const pagination = document.getElementById('pagination');
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    const custName = document.getElementById('custName');
    const custEmail = document.getElementById('custEmail');
    const custPhone = document.getElementById('custPhone');
    const custPlan = document.getElementById('custPlan');
    const custExpiry = document.getElementById('custExpiry');
    const custAmount = document.getElementById('custAmount');
    const transactionBody = document.getElementById('transactionBody');
    const bulkNotifyBtn = document.getElementById('bulkNotifyBtn');
    const automateCallsBtn = document.getElementById('automateCallsBtn');
    const itemsPerPage = 3; // Adjust as needed
    let currentPage = 1;

    // Filter, paginate, and update data
    function updateTable(data, page) {
        const filteredData = data.filter(customer => 
            customer.name.toLowerCase().includes(searchInput.value.toLowerCase()) ||
            customer.expiry.includes(searchInput.value)
        );

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = filteredData.slice(start, end);

        expiringList.innerHTML = '';
        paginatedData.forEach(customer => {
            expiringList.innerHTML += `
                <tr>
                    <td class="fw-medium">${customer.name}</td>
                    <td>${customer.expiry}</td>
                    <td>
                        <button class="btn btn-primary btn-sm view-btn" data-customer="${customer.id}">
                            <i class="fas fa-eye me-1"></i>View
                        </button>
                    </td>
                </tr>
            `;
        });

        // Update pagination
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        pagination.innerHTML = `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" aria-label="Previous" data-page="${currentPage - 1}">
                    <span aria-hidden="true">«</span>
                </a>
            </li>
        `;
        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        pagination.innerHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" aria-label="Next" data-page="${currentPage + 1}">
                    <span aria-hidden="true">»</span>
                </a>
            </li>
        `;

        // View button click event
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const customerId = btn.dataset.customer;
                const customer = customers.find(c => c.id === customerId);
                custName.textContent = customer.name;
                custEmail.textContent = customer.email;
                custPhone.textContent = customer.phone;
                custPlan.textContent = customer.plan;
                custExpiry.textContent = customer.expiry;
                custAmount.textContent = customer.amount;
                transactionBody.innerHTML = '';
                customer.transactions.forEach(tx => {
                    transactionBody.innerHTML += `
                        <tr>
                            <td>${tx.date}</td>
                            <td>${tx.plan}</td>
                            <td>${tx.amount}</td>
                            <td>${tx.status}</td>
                        </tr>
                    `;
                });
                profileModal.show();
            });
        });

        // Pagination click event
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
                if (page && page > 0 && page <= totalPages) {
                    currentPage = page;
                    updateTable(filteredData, currentPage);
                }
            });
        });
    }

    // Initial table load
    updateTable(customers, currentPage);

    // Search functionality
    searchInput.addEventListener('input', () => {
        currentPage = 1; // Reset to first page on search
        updateTable(customers, currentPage);
    });

    // Bulk Notify Button (Toast Notification)
    bulkNotifyBtn.addEventListener('click', () => {
        showSuccessToast('Bulk notifications sent to all expiring customers!');
    });

    // Automate Calls Button (Toast Notification)
    automateCallsBtn.addEventListener('click', () => {
        showSuccessToast('Automated calls scheduled for all expiring customers!');
    });

    // Function to show success toast
    function showSuccessToast(message) {
        const toast = new bootstrap.Toast(document.createElement('div'));
        const toastEl = document.createElement('div');
        toastEl.className = 'toast';
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'polite');
        toastEl.setAttribute('aria-atomic', 'true');
        toastEl.innerHTML = `
            <div class="toast-header">
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        document.querySelector('.toast-container').appendChild(toastEl);
        toast.show();
        setTimeout(() => toast.hide(), 3000); // Auto-dismiss after 3 seconds
    }

    // Logout button with Loading Effect
    const logoutBtn = document.querySelector('.logout-btn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadingOverlay.style.display = 'flex';
        setTimeout(() => {
            window.location.href = logoutBtn.href;
        }, 1500); // 1.5 seconds loading delay, matching Admin Dashboard
    });
});