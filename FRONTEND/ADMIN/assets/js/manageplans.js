// Sample Data
let categories = [
    { id: 1, name: 'Entertainment' },
    { id: 2, name: 'Unlimited' },
    { id: 3, name: '5G' }
  ];

  let plans = [
    { id: 1, name: 'Entertainment', categoryId: 1, price: '99', validity: 30, calls: 100, sms: 200, status: 'active', features: ['HD Streaming', '1 Device', 'No downloads'] },
    { id: 2, name: 'Unlimited', categoryId: 1, price: '149', validity: 30, calls: 300, sms: 500, status: 'active', features: ['4K Streaming', '4 Devices', 'Unlimited downloads'] },
    { id: 3, name: 'Entertainment', categoryId: 2, price: '299', validity: 30, calls: 1000, sms: 2000, status: 'expiring', features: ['5 Users', '100GB Storage', 'Basic support'] },
    { id: 4, name: 'Unlimited', categoryId: 3, price: '499', validity: 90, calls: 'Unlimited', sms: 'Unlimited', status: 'inactive', features: ['All Features', 'Priority Support', 'Cloud Storage'] },
    { id: 5, name: 'Entertainment', categoryId: 1, price: '599', validity: 30, calls: 50, sms: 100, status: 'active', features: ['SD Streaming', '1 Device', 'No downloads'] },
    { id: 6, name: 'Unlimited', categoryId: 2, price: '39', validity: 30, calls: 2000, sms: 3000, status: 'active', features: ['10 Users', '200GB Storage', 'Priority support'] },
    { id: 7, name: 'Entertainment', categoryId: 1, price: '199', validity: 30, calls: 500, sms: 1000, status: 'active', features: ['HD Streaming', '6 Devices', 'Parental Controls'] },
    { id: 8, name: '5G', categoryId: 2, price: '99', validity: 90, calls: 'Unlimited', sms: 'Unlimited', status: 'active', features: ['Unlimited Users', '1TB Storage', '24/7 Support'] }
  ];

  // DOM Variables
  const planModal = new bootstrap.Modal(document.getElementById('planModal'));
  const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
  const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
  let dataTable;
  let planToDelete = null;

  $(document).ready(function() {
    loadCategories();
    initializeDataTable();
    setupEventListeners();

    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    $('.logout-btn').on('click', function(e) {
      e.preventDefault();
      $('body').fadeOut(500, function() {
        window.location.href = '#';
      });
    });

    $('#tableSearch').on('input', function() {
      dataTable.search(this.value).draw();
    });

    $('#clearSearchBtn').on('click', function() {
      $('#tableSearch').val('');
      dataTable.search('').draw();
    });
  });

  function loadCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const planCategory = document.getElementById('planCategory');
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    planCategory.innerHTML = '<option value="">Select a category</option>';
    categories.forEach(category => {
      const filterOption = document.createElement('option');
      filterOption.value = category.id;
      filterOption.textContent = category.name;
      categoryFilter.appendChild(filterOption);
      const planOption = filterOption.cloneNode(true);
      planCategory.appendChild(planOption);
    });
  }

  function initializeDataTable() {
    dataTable = $('#plansTable').DataTable({
      data: getTableData(),
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'category' },
        { data: 'price' },
        { data: 'validity' },
        { data: 'calls' },
        { data: 'sms' },
        { data: 'status' },
        { data: 'actions', orderable: false, searchable: false }
      ],
      order: [[0, 'asc']],
      responsive: true,
      lengthMenu: [5, 10, 20, 50],
      pageLength: 10,
      language: {
        search: '',
        searchPlaceholder: 'Search plans...',
        lengthMenu: 'Show _MENU_ entries',
        info: 'Showing _START_ to _END_ of _TOTAL_ entries',
        infoEmpty: 'No entries available',
        infoFiltered: '(filtered from _MAX_ total entries)',
        zeroRecords: 'No matching entries found'
      },
      dom: "<'row mb-3'<'col-md-6 dataTables_length'l>>rt<'row mt-3'<'col-md-6'i><'col-md-6'p>>",
      drawCallback: function() {
        $('.edit-plan').on('click', function() {
          const planId = $(this).data('id');
          editPlan(planId);
        });
        $('.delete-plan').on('click', function() {
          const planId = $(this).data('id');
          const plan = plans.find(p => p.id == planId);
          if (plan) {
            $('#deletePlanName').text(plan.name);
            planToDelete = planId;
            deleteConfirmModal.show();
          }
        });
      }
    });
  }

  function getTableData() {
    return plans.map(plan => {
      const category = categories.find(c => c.id == plan.categoryId);
      let statusBadgeClass = '';
      switch(plan.status) {
        case 'active': statusBadgeClass = 'bg-success'; break;
        case 'inactive': statusBadgeClass = 'bg-secondary'; break;
        case 'expiring': statusBadgeClass = 'bg-warning'; break;
        default: statusBadgeClass = 'bg-primary';
      }
      return {
        id: plan.id,
        name: `<div class="fw-medium">${plan.name}</div><small class="text-muted">${plan.features.length} features</small>`,
        category: category ? category.name : 'Unknown',
        price: `₹${plan.price}`,
        validity: `${plan.validity} days`,
        calls: plan.calls,
        sms: plan.sms,
        status: `<span class="badge ${statusBadgeClass}">${plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}</span>`,
        actions: `<div class="text-end">
                  <button class="btn btn-sm btn-outline-primary edit-plan me-1" data-id="${plan.id}"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger delete-plan" data-id="${plan.id}"><i class="bi bi-trash"></i></button>
                </div>`
      };
    });
  }

  function setupEventListeners() {
    $('#categoryFilter, #statusFilter').on('change', applyFilters);
    $('#resetFiltersBtn').on('click', resetFilters);
    $('#addPlanBtn').on('click', function() {
      resetPlanForm();
      $('#planModalTitle').text('Add New Plan');
      planModal.show();
    });
    $('#addCategoryBtn').on('click', function() {
      $('#categoryName').val('');
      categoryModal.show();
    });
    $('#savePlanBtn').on('click', savePlan);
    $('#saveCategoryBtn').on('click', saveCategory);
    $('#confirmDeleteBtn').on('click', confirmDelete);
    $('#addFeatureBtn').on('click', addFeature);
    $('#newFeature').on('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addFeature();
      }
    });
  }

  function applyFilters() {
    const categoryFilter = $('#categoryFilter').val();
    const statusFilter = $('#statusFilter').val();
    dataTable.search('').columns().search('').draw();
    if (categoryFilter) {
      const category = categories.find(c => c.id == categoryFilter);
      if (category) dataTable.columns(2).search(category.name).draw();
    }
    if (statusFilter) {
      const statusText = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      dataTable.columns(7).search(statusText).draw();
    }
  }

  function resetFilters() {
    $('#categoryFilter').val('');
    $('#statusFilter').val('');
    $('#tableSearch').val('');
    dataTable.search('').columns().search('').draw();
  }

  function addFeature() {
    const newFeatureInput = document.getElementById('newFeature');
    const featureText = newFeatureInput.value.trim();
    if (featureText) {
      const featuresContainer = document.getElementById('featuresContainer');
      const featureDiv = document.createElement('div');
      featureDiv.className = 'feature-item d-flex justify-content-between align-items-center';
      featureDiv.innerHTML = `
        <span>${featureText}</span>
        <button type="button" class="btn btn-sm btn-outline-danger remove-feature"><i class="bi bi-x"></i></button>
      `;
      featuresContainer.appendChild(featureDiv);
      featureDiv.querySelector('.remove-feature').addEventListener('click', function() {
        featuresContainer.removeChild(featureDiv);
      });
      newFeatureInput.value = '';
    }
    newFeatureInput.focus();
  }

  function editPlan(planId) {
    const plan = plans.find(p => p.id == planId);
    if (!plan) return;
    $('#planId').val(plan.id);
    $('#planIdDisplay').val(plan.id);
    $('#planName').val(plan.name);
    $('#planCategory').val(plan.categoryId);
    $('#planPrice').val(plan.price);
    $('#planValidity').val(plan.validity);
    $('#planCalls').val(plan.calls);
    $('#planSMS').val(plan.sms);
    $('#planStatus').val(plan.status);
    const featuresContainer = document.getElementById('featuresContainer');
    featuresContainer.innerHTML = '';
    plan.features.forEach(feature => {
      const featureDiv = document.createElement('div');
      featureDiv.className = 'feature-item d-flex justify-content-between align-items-center';
      featureDiv.innerHTML = `
        <span>${feature}</span>
        <button type="button" class="btn btn-sm btn-outline-danger remove-feature"><i class="bi bi-x"></i></button>
      `;
      featuresContainer.appendChild(featureDiv);
      featureDiv.querySelector('.remove-feature').addEventListener('click', function() {
        featuresContainer.removeChild(featureDiv);
      });
    });
    $('#planModalTitle').text('Edit Plan');
    planModal.show();
  }

  function resetPlanForm() {
    $('#planId').val('');
    $('#planIdDisplay').val('New');
    $('#planForm')[0].reset();
    $('#featuresContainer').empty();
    clearErrors('planForm');
  }

  function savePlan() {
    clearErrors('planForm');
    let isValid = true;
    const planName = $('#planName').val().trim();
    const categoryId = $('#planCategory').val();
    const price = $('#planPrice').val().trim();
    const validity = $('#planValidity').val().trim();
    const calls = $('#planCalls').val().trim();
    const sms = $('#planSMS').val().trim();
    const status = $('#planStatus').val();
    const featureElements = document.querySelectorAll('#featuresContainer .feature-item span');
    const features = Array.from(featureElements).map(el => el.textContent);

    if (!planName) { showError('planName', 'Plan name is required.'); isValid = false; }
    else if (plans.some(p => p.name.toLowerCase() === planName.toLowerCase() && p.id != $('#planId').val())) {
      showError('planName', 'Plan name already exists.'); isValid = false;
    }
    if (!categoryId) { showError('planCategory', 'Category is required.'); isValid = false; }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) { showError('planPrice', 'Price must be a positive number.'); isValid = false; }
    if (!validity || isNaN(parseInt(validity)) || parseInt(validity) <= 0) { showError('planValidity', 'Validity must be a positive integer.'); isValid = false; }
    if (!calls || (calls !== 'Unlimited' && (isNaN(parseInt(calls)) || parseInt(calls) < 0))) { showError('planCalls', 'Call minutes must be a positive number or "Unlimited".'); isValid = false; }
    if (!sms || (sms !== 'Unlimited' && (isNaN(parseInt(sms)) || parseInt(sms) < 0))) { showError('planSMS', 'SMS count must be a positive number or "Unlimited".'); isValid = false; }
    if (!status) { showError('planStatus', 'Status is required.'); isValid = false; }
    if (features.length === 0) { showError('features', 'At least one feature is required.'); isValid = false; }

    if (!isValid) return;

    const planId = $('#planId').val();
    const planData = {
      name: planName,
      categoryId: parseInt(categoryId),
      price: price,
      validity: parseInt(validity),
      calls: calls,
      sms: sms,
      status: status,
      features: features
    };
    let isNewPlan = false;
    if (planId) {
      const index = plans.findIndex(p => p.id == planId);
      if (index !== -1) {
        planData.id = parseInt(planId);
        plans[index] = planData;
      }
    } else {
      isNewPlan = true;
      planData.id = Math.max(...plans.map(p => p.id), 0) + 1;
      plans.push(planData);
    }
    dataTable.clear().rows.add(getTableData()).draw();
    planModal.hide();
    showToast('success', `Plan ${isNewPlan ? 'added' : 'updated'} successfully!`);
  }

  function saveCategory() {
    clearErrors('categoryModal');
    let isValid = true;
    const categoryName = $('#categoryName').val().trim();
    if (!categoryName) { showError('categoryName', 'Category name is required.'); isValid = false; }
    else if (categories.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
      showError('categoryName', 'Category already exists.'); isValid = false;
    }
    if (!isValid) return;
    const newCategory = { id: Math.max(...categories.map(c => c.id), 0) + 1, name: categoryName };
    categories.push(newCategory);
    loadCategories();
    categoryModal.hide();
    showToast('success', 'Category added successfully!');
  }

  function confirmDelete() {
    if (planToDelete) {
      const index = plans.findIndex(p => p.id == planToDelete);
      if (index !== -1) plans.splice(index, 1);
      dataTable.clear().rows.add(getTableData()).draw();
      deleteConfirmModal.hide();
      showToast('success', 'Plan deleted successfully!');
      planToDelete = null;
    }
  }

  function showToast(type, message) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    if (type === 'success') {
      toast.classList.remove('bg-danger', 'bg-warning');
      toast.classList.add('bg-success');
    } else if (type === 'error') {
      toast.classList.remove('bg-success', 'bg-warning');
      toast.classList.add('bg-danger');
    } else if (type === 'warning') {
      toast.classList.remove('bg-success', 'bg-danger');
      toast.classList.add('bg-warning', 'text-dark');
    }
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();
  }

  function showError(fieldId, message) {
    const field = $('#' + fieldId);
    field.addClass('error');
    const errorElement = $('#' + fieldId + 'Error');
    errorElement.text(message).show();
  }

  function clearErrors(modalId) {
    $(`#${modalId} .form-control`).removeClass('error');
    $(`#${modalId} .error-message`).hide();
  }