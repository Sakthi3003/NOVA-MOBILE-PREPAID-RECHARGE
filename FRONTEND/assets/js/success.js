$(document).ready(function() {
    // Pages configuration (matching previous pages)
    const guestPages = [
        { id: "home", label: "Home", url: "../index.html" },
        { id: "plans", label: "Plans", url: "./plans.html" },
        { id: "support", label: "Support", url: "./support.html" },
        { id: "about", label: "About Us", url: "./about.html" }
    ];

    let isLoggedIn = false;

    // Check login status
    function checkLoginStatus() {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        isLoggedIn = !!loggedInUser;
    }

    // Fetch with timeout utility
    async function fetchWithTimeout(url, options, timeout = 30000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection.');
            }
            throw error;
        }
    }

    // Load transaction details
    function loadTransactionDetails() {
        const transactionDetails = JSON.parse(sessionStorage.getItem('session_transactionDetails'));
        const quickRechargeData = JSON.parse(sessionStorage.getItem('session_quickRechargeData'));
        const loggedInUserDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails'));
        const quickRechargeUserDetails = JSON.parse(sessionStorage.getItem('quickRechargeUserDetails'));
        const selectedPlan = JSON.parse(sessionStorage.getItem('selectedPlan'));
        const phoneNumber = sessionStorage.getItem('phoneNumber') || sessionStorage.getItem('session_phoneNumber');
        const fromQuickRecharge = sessionStorage.getItem('session_fromQuickRecharge') === 'true';

        // Log for debugging
        console.log('session_transactionDetails:', transactionDetails);
        console.log('quickRechargeData:', quickRechargeData);
        console.log('loggedInUserDetails:', loggedInUserDetails);
        console.log('quickRechargeUserDetails:', quickRechargeUserDetails);
        console.log('selectedPlan:', selectedPlan);
        console.log('phoneNumber:', phoneNumber);
        console.log('fromQuickRecharge:', fromQuickRecharge);

        if (!transactionDetails) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Transaction details not found. Please try again.',
                confirmButtonColor: '#0a21c0'
            }).then(() => {
                window.location.href = './plans.html';
            });
            return false;
        }

        // Populate the UI with transaction details
        $('#customerName').text(transactionDetails.customerName || 'Unknown');
        $('#mobileNumber').text(transactionDetails.mobileNumber || 'N/A');
        $('#amount').text(transactionDetails.amount || '₹0.00');
        $('#refNo').text(transactionDetails.refNo || 'N/A');
        $('#date').text(transactionDetails.date || 'N/A');
        $('#time').text(transactionDetails.time || 'N/A');
        $('#paymentMethod').text(transactionDetails.paymentMode || 'Unknown');

        return true;
    }

    // Fetch recharge details
    async function fetchRechargeDetails() {
        const transactionDetails = JSON.parse(sessionStorage.getItem('session_transactionDetails'));
        if (!transactionDetails || !transactionDetails.refNo) return;

        try {
            const response = await fetchWithTimeout(`http://localhost:8080/api/recharge/recharge-by-transaction/${transactionDetails.refNo}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(isLoggedIn && { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('loggedInUser')).accessToken}` })
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recharge details');
            }

            const recharge = await response.json();
            sessionStorage.setItem('session_rechargeDetails', JSON.stringify({
                rechargeStatus: recharge.status,
                startDate: recharge.startDate,
                endDate: recharge.endDate
            }));
        } catch (error) {
            console.error('Error fetching recharge details:', error);
        }
    }

    // Update breadcrumb
    function updateBreadcrumb() {
        const breadcrumbList = $('.breadcrumb');
        breadcrumbList.empty();
        breadcrumbList.append('<li class="breadcrumb-item"><a href="./plans.html">Plans</a></li>');
        breadcrumbList.append('<li class="breadcrumb-item"><a href="./payment.html">Payment</a></li>');
        breadcrumbList.append('<li class="breadcrumb-item active" aria-current="page">Success</li>');
    }

    // Handle go to home
    $('#goToHomeBtn').on('click', function() {
        const loadingOverlay = $('<div class="loading-overlay"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>').appendTo('body');
        loadingOverlay.css({
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            'justify-content': 'center',
            'align-items': 'center',
            'z-index': 2000
        });

        sessionStorage.removeItem('selectedPlan');
        sessionStorage.removeItem('session_transactionDetails');
        sessionStorage.removeItem('session_rechargeDetails');
        if (!isLoggedIn) {
            sessionStorage.removeItem('session_fromQuickRecharge');
            sessionStorage.removeItem('session_quickRechargeData');
            sessionStorage.removeItem('phoneNumber');
            sessionStorage.removeItem('quickRechargeUserDetails');
        }

        setTimeout(() => {
            loadingOverlay.remove();
            window.location.href = '../index.html';
        }, 1500);
    });

    // Handle share via email
    $('#shareEmailBtn').on('click', async function() {
        const $btn = $(this);
        $btn.addClass('btn-loading').prop('disabled', true).html('<i class="fas fa-envelope"></i> Sending...');

        const transactionDetails = JSON.parse(sessionStorage.getItem('session_transactionDetails'));
        const quickRechargeData = JSON.parse(sessionStorage.getItem('session_quickRechargeData'));
        const loggedInUserDetails = JSON.parse(sessionStorage.getItem('session_loggedInUserDetails'));
        const quickRechargeUserDetails = JSON.parse(sessionStorage.getItem('quickRechargeUserDetails'));
        const selectedPlan = JSON.parse(sessionStorage.getItem('selectedPlan'));
        const fromQuickRecharge = sessionStorage.getItem('session_fromQuickRecharge') === 'true';
        const userDetails = fromQuickRecharge && quickRechargeData ? quickRechargeData.userDetails : (quickRechargeUserDetails || loggedInUserDetails);

        if (!transactionDetails || !selectedPlan || !userDetails) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Missing transaction or plan details.',
                confirmButtonColor: '#0a21c0'
            }).then(() => {
                $btn.removeClass('btn-loading').prop('disabled', false).html('<i class="fas fa-envelope"></i> Share via Email');
            });
            return;
        }

        const invoiceData = {
            email: userDetails.email || prompt('Please enter your email address:') || '',
            customerName: transactionDetails.customerName,
            mobileNumber: transactionDetails.mobileNumber,
            amount: transactionDetails.amount,
            refNo: transactionDetails.refNo,
            date: transactionDetails.date,
            time: transactionDetails.time,
            paymentMode: transactionDetails.paymentMode,
            planName: selectedPlan.name,
            data: selectedPlan.data,
            validity: selectedPlan.validity,
            calls: selectedPlan.calls,
            sms: selectedPlan.sms,
            baseAmount: parseFloat(selectedPlan.price || 0).toFixed(2),
            gst: (parseFloat(selectedPlan.price || 0) * 0.18).toFixed(2),
            totalAmount: (parseFloat(selectedPlan.price || 0) * 1.18).toFixed(2)
        };

        if (!invoiceData.email) {
            Swal.fire({
                icon: 'warning',
                title: 'Email Required',
                text: 'Please provide an email address.',
                confirmButtonColor: '#0a21c0'
            }).then(() => {
                $btn.removeClass('btn-loading').prop('disabled', false).html('<i class="fas fa-envelope"></i> Share via Email');
            });
            return;
        }

        const maxRetries = 3;
        let attempt = 0;

        async function trySendInvoice() {
            try {
                const response = await fetchWithTimeout('http://localhost:8080/api/recharge/invoice/email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(isLoggedIn && { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('loggedInUser')).accessToken}` })
                    },
                    body: JSON.stringify(invoiceData)
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to send invoice');
                }

                if (result.status === 'SUCCESS') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Invoice Sent',
                        text: `The invoice has been sent to ${invoiceData.email}.`,
                        confirmButtonColor: '#0a21c0'
                    });
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
            } catch (error) {
                attempt++;
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    return trySendInvoice();
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to send invoice. Please try again.',
                    confirmButtonColor: '#0a21c0'
                });
            } finally {
                $btn.removeClass('btn-loading').prop('disabled', false).html('<i class="fas fa-envelope"></i> Share via Email');
            }
        }

        await trySendInvoice();
    });

    // Initialize page
    checkLoginStatus();
    if (loadTransactionDetails()) {
        updateBreadcrumb();
        fetchRechargeDetails();
        setInterval(fetchRechargeDetails, 300000); // Refresh every 5 minutes
    }
});