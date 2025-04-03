$(document).ready(function() {
    window.onload = function() {
        location.reload(true); // true parameter forces reload from server, not cache
    };  

    $("#adminLoginForm").validate({
        rules: {
            username: { required: true, minlength: 3 },
            password: { required: true, minlength: 6 }
        },
        messages: {
            username: {
                required: "Please enter your username",
                minlength: "Username must be at least 3 characters long"
            },
            password: {
                required: "Please enter your password",
                minlength: "Password must be at least 6 characters long"
            }
        },
        errorPlacement: function(error, element) {
            element.closest('.form-group').find('.error-message').html(error).show();
            element.addClass('error');
        },
        success: function(label, element) {
            $(element).removeClass('error');
            $(element).closest('.form-group').find('.error-message').hide();
        }
    });

    $("#requestResetForm").validate({
        rules: { email: { required: true, email: true } },
        messages: {
            email: {
                required: "Please enter your email",
                email: "Please enter a valid email address"
            }
        },
        errorPlacement: function(error, element) {
            element.closest('.form-group').find('.error-message').html(error).show();
            element.addClass('error');
        },
        success: function(label, element) {
            $(element).removeClass('error');
            $(element).closest('.form-group').find('.error-message').hide();
        }
    });

    $("#resetPasswordForm").validate({
        rules: {
            newPassword: {
                required: true,
                minlength: 8,
                pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
            },
            confirmNewPassword: { required: true, equalTo: "#newPassword" }
        },
        messages: {
            newPassword: {
                required: "Please enter a new password",
                minlength: "Password must be at least 8 characters long",
                pattern: "Password must contain uppercase, number, and special character"
            },
            confirmNewPassword: {
                required: "Please confirm your new password",
                equalTo: "Passwords do not match"
            }
        },
        errorPlacement: function(error, element) {
            element.closest('.form-group').find('.error-message').html(error).show();
            element.addClass('error');
        },
        success: function(label, element) {
            $(element).removeClass('error');
            $(element).closest('.form-group').find('.error-message').hide();
        }
    });

    $("#newPassword").on("input", function() {
        const password = $(this).val();
        $("#length").toggleClass("valid", password.length >= 8).toggleClass("invalid", password.length < 8);
        $("#uppercase").toggleClass("valid", /[A-Z]/.test(password)).toggleClass("invalid", !/[A-Z]/.test(password));
        $("#number").toggleClass("valid", /\d/.test(password)).toggleClass("invalid", !/\d/.test(password));
        $("#special").toggleClass("valid", /[!@#$%^&*]/.test(password)).toggleClass("invalid", !/[!@#$%^&*]/.test(password));
    });

    // Password toggle functionality
    $("#togglePassword").click(function() {
        const passwordField = $("#password");
        const type = passwordField.attr("type") === "password" ? "text" : "password";
        passwordField.attr("type", type);
        $(this).toggleClass("fa-eye fa-eye-slash");
    });

    $("#toggleNewPassword").click(function() {
        const newPasswordField = $("#newPassword");
        const type = newPasswordField.attr("type") === "password" ? "text" : "password";
        newPasswordField.attr("type", type);
        $(this).toggleClass("fa-eye fa-eye-slash");
    });

    $("#toggleConfirmPassword").click(function() {
        const confirmPasswordField = $("#confirmNewPassword");
        const type = confirmPasswordField.attr("type") === "password" ? "text" : "password";
        confirmPasswordField.attr("type", type);
        $(this).toggleClass("fa-eye fa-eye-slash");
    });
});

const adminLoginForm = document.getElementById('adminLoginForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLoginLink = document.getElementById('backToLoginLink');
const requestResetForm = document.getElementById('requestResetForm');
const backToLoginFromConfirm = document.getElementById('backToLoginFromConfirm');
const resetPasswordForm = document.getElementById('resetPasswordForm');

adminLoginForm.addEventListener('submit', handleAdminLogin);
forgotPasswordLink.addEventListener('click', showForgotPasswordForm);
backToLoginLink.addEventListener('click', showLoginForm);
requestResetForm.addEventListener('submit', handleRequestReset);
backToLoginFromConfirm.addEventListener('click', showLoginForm);
resetPasswordForm.addEventListener('submit', handleResetPassword);

function logout() {
    fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}` }
    })
    .then(() => {
        sessionStorage.clear();
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.error('Logout Error:', error);
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
}

if (sessionStorage.getItem('accessToken')) {
    window.location.href = 'manageplans.html';
}

function handleAdminLogin(event) {
    event.preventDefault();
    if (!$("#adminLoginForm").valid()) return;

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) throw new Error('Login failed');
        return response.json();
    })
    .then(data => {
        sessionStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('refreshToken', data.refreshToken);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('user_id', data.user_id);
        sessionStorage.setItem('userDetails', JSON.stringify(data.userDetails));

        console.log('Stored in sessionStorage:', {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            role: data.role,
            user_id: data.user_id,
            userDetails: data.userDetails
        });

        window.location.href = 'analytics.html';
    })
    .catch(error => {
        console.error('Login Error:', error);
        // Display error message below the password field
        $('#password-error').text('Invalid username or password').show();
        $('#password').addClass('error');
    });
}

function showForgotPasswordForm(event) {
    event.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
    document.getElementById('resetConfirmation').classList.add('hidden');
    document.getElementById('newPasswordForm').classList.add('hidden');
}

function showLoginForm(event) {
    event.preventDefault();
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    document.getElementById('resetConfirmation').classList.add('hidden');
    document.getElementById('newPasswordForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function handleRequestReset(event) {
    event.preventDefault();
    if (!$("#requestResetForm").valid()) return;

    const email = document.getElementById('email').value;

    fetch('http://localhost:8080/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to send reset link');
        return response.json();
    })
    .then(data => {
        document.getElementById('forgotPasswordForm').classList.add('hidden');
        document.getElementById('resetConfirmation').classList.remove('hidden');
    })
    .catch(error => {
        console.error('Request Reset Error:', error);
        $('#email-error').text('Failed to send reset link').show();
        $('#email').addClass('error');
    });
}

function handleResetPassword(event) {
    event.preventDefault();
    if (!$("#resetPasswordForm").valid()) return;

    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmNewPassword })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to reset password');
        return response.json();
    })
    .then(data => {
        alert('Password reset successfully! Please login with your new password.');
        showLoginForm(event);
    })
    .catch(error => {
        console.error('Reset Password Error:', error);
        $('#newPassword-error').text('Failed to reset password').show();
        $('#newPassword').addClass('error');
    });
}


window.logout = logout;