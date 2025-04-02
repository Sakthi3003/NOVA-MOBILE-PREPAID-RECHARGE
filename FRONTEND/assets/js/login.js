document.addEventListener('DOMContentLoaded', function() {
    const phoneStep = document.getElementById('phoneStep');
    const otpStep = document.getElementById('otpStep');
    const phoneNumber = document.getElementById('phoneNumber');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const phoneError = document.getElementById('phoneError');
    const displayPhoneNumber = document.getElementById('displayPhoneNumber');
    const otpInputs = document.querySelectorAll('.otp-input');
    const otpError = document.getElementById('otpError');
    const timerDisplay = document.getElementById('timer');
    const resendBtn = document.getElementById('resendBtn');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const backToPhoneBtn = document.getElementById('backToPhoneBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    let timerInterval, countdown = 60;
    let attemptCount = parseInt(sessionStorage.getItem('otpAttempts')) || 0;
    let lockoutTime = sessionStorage.getItem('lockoutTime');
    const apiBaseUrl = 'http://localhost:8080/api';

    // Check for lockout
    if (lockoutTime) {
        const now = Date.now();
        const timeLeft = (parseInt(lockoutTime) + 15 * 60 * 1000) - now;
        if (timeLeft > 0) {
            showLoadingAndRedirect();
            return;
        } else {
            resetLockout();
        }
    }

    // Utility Functions
    function showLoadingAndRedirect(redirectUrl = '../index.html') {
        loadingOverlay.style.display = 'flex';
        setTimeout(() => window.location.href = redirectUrl, 1500); // Match index.html timing
    }

    function resetLockout() {
        sessionStorage.removeItem('lockoutTime');
        sessionStorage.removeItem('otpAttempts');
        attemptCount = 0;
    }

    function nextStep(current, next) {
        document.getElementById(current).classList.remove('active');
        document.getElementById(next).classList.add('active');
    }

    function goToHome() {
        sessionStorage.removeItem('otpStep');
        sessionStorage.removeItem('otpAttempts');
        showLoadingAndRedirect('../index.html');
    }

    function clearOtpInputs() {
        otpInputs.forEach(input => input.value = '');
        otpError.style.display = 'none';
    }

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    function hideError(element) {
        element.style.display = 'none';
    }

    function resetLoginState() {
        sessionStorage.removeItem('otpStep');
        sessionStorage.removeItem('otpAttempts');
        nextStep('otpStep', 'phoneStep');
        clearOtpInputs();
        phoneNumber.value = '';
        hideError(phoneError);
        sendOtpBtn.disabled = true;
        clearInterval(timerInterval);
    }

    // Phone Number Validation
    phoneNumber.addEventListener('input', function() {
        const value = this.value.replace(/[^0-9]/g, '');
        this.value = value.slice(0, 10);
        sendOtpBtn.disabled = true;

        if (!value) {
            showError(phoneError, 'Please enter a 10-digit number');
        } else if (/^[0-5]/.test(value)) {
            showError(phoneError, 'Number cannot start with 0-5');
        } else if (value.length < 10) {
            showError(phoneError, 'Please enter a 10-digit number');
        } else if (!/^\d{10}$/.test(value)) {
            showError(phoneError, 'Enter a valid 10-digit number');
        } else {
            hideError(phoneError);
            sendOtpBtn.disabled = false;
        }
    });

    // Send OTP Request
    document.getElementById('phoneForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const value = phoneNumber.value.trim();
        if (!value || phoneError.style.display === 'block') return;

        loadingOverlay.style.display = 'flex';
        try {
            const response = await fetch(`${apiBaseUrl}/auth/otp/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: value })
            });
            const data = await response.json();

            loadingOverlay.style.display = 'none';
            if (response.ok && data.status === 'Success') {
                sessionStorage.setItem('session_otpStep', 'true');
                sessionStorage.setItem('session_phoneNumber', value);
                displayPhoneNumber.textContent = '+91 ' + value;
                nextStep('phoneStep', 'otpStep');
                otpInputs[0].focus();
                startTimer();
            } else {
                throw new Error(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            loadingOverlay.style.display = 'none';
            let errorMessage = 'Failed to send OTP. Please try again.';
            if (error.message.toLowerCase().includes('not registered')) {
                errorMessage = 'Phone number not registered.';
            } else if (error.message.toLowerCase().includes('invalid')) {
                errorMessage = 'Invalid phone number format.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            showError(phoneError, errorMessage);
        }
    });

    // OTP Input Handling
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Verify OTP
    document.getElementById('otpForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        let otpValue = Array.from(otpInputs).map(input => input.value).join('');
        if (otpValue.length !== 6) {
            showError(otpError, 'Enter a valid 6-digit OTP');
            return;
        }

        loadingOverlay.style.display = 'flex';
        try {
            const response = await fetch(`${apiBaseUrl}/auth/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phoneNumber.value, otp: otpValue })
            });
            const data = await response.json();

            if (response.ok && data.status === 'Success') {
                // Clear temporary login state
                sessionStorage.removeItem('session_otpStep');
                sessionStorage.removeItem('otpAttempts');

                // Store minimal persistent data in localStorage
                const userPersistentData = {
                    userId: data.user_id,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    phoneNumber: phoneNumber.value
                };
                localStorage.setItem('loggedInUser', JSON.stringify(userPersistentData));

                // Store detailed user data in sessionStorage with consistent naming
                const userDetails = {
                    ...data.userDetails,
                    firstName: data.userDetails.first_name || 'User',
                    lastName: data.userDetails.last_name || '',
                    email: data.userDetails.email || '',
                    phoneNumber: phoneNumber.value
                };
                sessionStorage.setItem('session_loggedInUserDetails', JSON.stringify(userDetails));

                // Handle redirect based on quick recharge context
                const fromQuickRecharge = sessionStorage.getItem('session_fromQuickRecharge') === 'true';
                const redirectUrl = fromQuickRecharge ? './plans.html' : '../index.html';

                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    window.location.href = redirectUrl;
                }, 1500);
            } else {
                throw new Error(data.message || 'Invalid OTP');
            }
        } catch (error) {
            loadingOverlay.style.display = 'none';
            let errorMessage = 'Failed to verify OTP. Please try again.';
            if (error.message.toLowerCase().includes('invalid')) {
                errorMessage = 'Invalid OTP. Please try again.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            showError(otpError, errorMessage);
        }
    });

    // Timer and Resend Logic
    function startTimer() {
        countdown = 60;
        timerDisplay.textContent = countdown;
        resendBtn.disabled = true;
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            countdown--;
            timerDisplay.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(timerInterval);
                resendBtn.disabled = attemptCount >= 3;
                if (attemptCount >= 3) {
                    showError(otpError, 'Max attempts reached. Try again in 15 minutes.');
                    resendBtn.style.display = 'none';
                }
            }
        }, 1000);
    }

    resendBtn.addEventListener('click', async function() {
        if (attemptCount >= 3) return;

        attemptCount++;
        sessionStorage.setItem('otpAttempts', attemptCount);
        loadingOverlay.style.display = 'flex';
        try {
            const response = await fetch(`${apiBaseUrl}/auth/otp/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phoneNumber.value })
            });
            const data = await response.json();

            loadingOverlay.style.display = 'none';
            if (response.ok && data.status === 'Success') {
                startTimer();
                hideError(otpError);
            } else {
                throw new Error(data.message || 'Failed to resend OTP');
            }
        } catch (error) {
            loadingOverlay.style.display = 'none';
            let errorMessage = 'Failed to resend OTP. Please try again.';
            if (error.message.toLowerCase().includes('not registered')) {
                errorMessage = 'Phone number not registered.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            showError(otpError, errorMessage);
        }

        if (attemptCount >= 3) {
            sessionStorage.setItem('lockoutTime', Date.now());
            showLoadingAndRedirect();
        }
    });

    // Navigation Handlers
    backToHomeBtn.addEventListener('click', goToHome);
    backToPhoneBtn.addEventListener('click', () => {
        resetLoginState();
    });

    // Initialize the page state
    if (sessionStorage.getItem('session_otpStep') === 'true' && sessionStorage.getItem('session_phoneNumber')) {
        const storedPhoneNumber = sessionStorage.getItem('session_phoneNumber');
        phoneNumber.value = storedPhoneNumber;
        displayPhoneNumber.textContent = '+91 ' + storedPhoneNumber;
        nextStep('phoneStep', 'otpStep');
        startTimer();
    } else {
        resetLoginState();
    }
});