// Subscriber Management Data and Functions
let subscriberCurrentFilter = 'all';

$(document).ready(function() {
  // Main Menu Toggle
  const mainMenuToggle = document.getElementById('mainMenuToggle');
  const navMenu = document.getElementById('navMenu');
  mainMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  $('.logout-btn').on('click', function(e) {
    e.preventDefault();
    $('body').fadeOut(500, function() {
      window.location.href = '#';
    });
  });

  // Search Functionality
  const subscriberSearchInput = document.getElementById('subscriberSearchInput');
  const subscriberTable = document.getElementById('subscribers-table');
  const subscriberRows = subscriberTable.querySelectorAll('tbody tr');

  subscriberSearchInput.addEventListener('keyup', function() {
    applySubscriberFilters();
  });

  // Setup Action Buttons for Subscribers
  setupSubscriberActionButtons();

  // Filter Buttons
  const subscriberFilterButtons = document.querySelectorAll('.subscriber-filter-btn');
  subscriberFilterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      document.querySelectorAll('.subscriber-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
      });
      subscriberCurrentFilter = filter;
      applySubscriberFilters();
      showToast('Showing ' + filter.charAt(0).toUpperCase() + filter.slice(1) + ' Subscribers');
    });
  });

  // Pagination
  const subscriberPrevPageBtn = document.getElementById('subscriberPrevPage');
  const subscriberNextPageBtn = document.getElementById('subscriberNextPage');
  const subscriberPaginationBtns = document.querySelectorAll('.subscriber-pagination button:not(#subscriberPrevPage):not(#subscriberNextPage)');

  subscriberPaginationBtns.forEach(button => {
    button.addEventListener('click', function() {
      subscriberPaginationBtns.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      showToast('Loading page ' + this.textContent);
    });
  });

  subscriberPrevPageBtn.addEventListener('click', function() {
    const activeBtn = document.querySelector('.subscriber-pagination button.active');
    const prevBtn = activeBtn.previousElementSibling;
    if (prevBtn && prevBtn !== subscriberPrevPageBtn) {
      activeBtn.classList.remove('active');
      prevBtn.classList.add('active');
      showToast('Loading previous page');
    }
  });

  subscriberNextPageBtn.addEventListener('click', function() {
    const activeBtn = document.querySelector('.subscriber-pagination button.active');
    const nextBtn = activeBtn.nextElementSibling;
    if (nextBtn && nextBtn !== subscriberNextPageBtn) {
      activeBtn.classList.remove('active');
      nextBtn.classList.add('active');
      showToast('Loading next page');
    }
  });
});

function setupSubscriberActionButtons() {
  document.querySelectorAll('.subscriber-activate-btn').forEach(button => {
    button.addEventListener('click', function() {
      const row = this.closest('tr');
      const statusCell = row.querySelector('td:nth-child(7) .subscriber-status');
      statusCell.className = 'subscriber-status subscriber-active';
      statusCell.textContent = 'Active';
      row.setAttribute('data-status', 'active');
      this.className = 'subscriber-action-btn subscriber-deactivate-btn';
      this.textContent = 'Deactivate';
      this.removeEventListener('click', arguments.callee);
      this.addEventListener('click', handleSubscriberDeactivate);
      showToast('User activated successfully');
    });
  });

  document.querySelectorAll('.subscriber-deactivate-btn').forEach(button => {
    button.addEventListener('click', handleSubscriberDeactivate);
  });
}

function handleSubscriberDeactivate() {
  const row = this.closest('tr');
  const statusCell = row.querySelector('td:nth-child(7) .subscriber-status');
  statusCell.className = 'subscriber-status subscriber-inactive';
  statusCell.textContent = 'Inactive';
  row.setAttribute('data-status', 'inactive');
  this.className = 'subscriber-action-btn subscriber-activate-btn';
  this.textContent = 'Activate';
  this.removeEventListener('click', handleSubscriberDeactivate);
  this.addEventListener('click', function() {
    const row = this.closest('tr');
    const statusCell = row.querySelector('td:nth-child(7) .subscriber-status');
    statusCell.className = 'subscriber-status subscriber-active';
    statusCell.textContent = 'Active';
    row.setAttribute('data-status', 'active');
    this.className = 'subscriber-action-btn subscriber-deactivate-btn';
    this.textContent = 'Deactivate';
    this.removeEventListener('click', arguments.callee);
    this.addEventListener('click', handleSubscriberDeactivate);
    showToast('User activated successfully');
  });
  showToast('User deactivated successfully', 'danger'); // Red toast for deactivation
}

function applySubscriberFilters() {
  const searchTerm = document.getElementById('subscriberSearchInput').value.toLowerCase();
  const subscriberRows = document.getElementById('subscribers-table').querySelectorAll('tbody tr');
  subscriberRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const status = row.getAttribute('data-status');
    const porting = row.getAttribute('data-porting');
    let showRow = true;

    if (searchTerm && !text.includes(searchTerm)) {
      showRow = false;
    }

    if (subscriberCurrentFilter !== 'all') {
      if (subscriberCurrentFilter === 'active' && status !== 'active') {
        showRow = false;
      } else if (subscriberCurrentFilter === 'inactive' && status !== 'inactive') {
        showRow = false;
      } else if (subscriberCurrentFilter === 'ported' && porting !== 'ported') {
        showRow = false;
      }
    }

    row.style.display = showRow ? '' : 'none';
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  toastMessage.textContent = message;
  toast.classList.remove('bg-success', 'bg-danger', 'bg-warning');
  if (type === 'success') {
    toast.classList.add('bg-success');
  } else if (type === 'danger') {
    toast.classList.add('bg-danger');
  } else if (type === 'warning') {
    toast.classList.add('bg-warning', 'text-dark');
  }
  const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
  bsToast.show();
}