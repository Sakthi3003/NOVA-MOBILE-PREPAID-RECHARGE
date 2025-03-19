 // Toggle FAQ answers
 document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', function() {
        const answer = this.querySelector('.faq-answer');
        const icon = this.querySelector('.fa-chevron-down');
        
        if (answer.style.display === 'block') {
            answer.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        } else {
            answer.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        }
    });
});

// Filter FAQs by category
document.querySelectorAll('.faq-category').forEach(category => {
    category.addEventListener('click', function() {
        document.querySelectorAll('.faq-category').forEach(cat => {
            cat.classList.remove('active');
        });
        
        this.classList.add('active');
        
        const selectedCategory = this.getAttribute('data-category');
        
        document.querySelectorAll('.faq-item').forEach(item => {
            if (selectedCategory === 'all' || item.getAttribute('data-category') === selectedCategory) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Search FAQs
document.getElementById('faqSearch').addEventListener('keyup', function() {
    const searchTerm = this.value.toLowerCase();
    
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question span').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});

// Validate individual input dynamically
function validateInput(input) {
    const errorElement = document.getElementById(`${input.id}-error`);
    let isValid = true;

    if (input.id === 'name') {
        const value = input.value.trim();
        if (!value || value.length < 2) {
            input.classList.add('is-invalid');
            errorElement.style.display = 'block';
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            errorElement.style.display = 'none';
        }
    } else if (input.id === 'email') {
        const value = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
            input.classList.add('is-invalid');
            errorElement.style.display = 'block';
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            errorElement.style.display = 'none';
        }
    } else if (input.id === 'subject') {
        const value = input.value;
        if (!value) {
            input.classList.add('is-invalid');
            errorElement.style.display = 'block';
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            errorElement.style.display = 'none';
        }
    } else if (input.id === 'message') {
        const value = input.value.trim();
        if (!value || value.length < 10) {
            input.classList.add('is-invalid');
            errorElement.style.display = 'block';
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            errorElement.style.display = 'none';
        }
    }

    return isValid;
}

// Add event listeners for dynamic validation
const inputs = document.querySelectorAll('#supportForm input, #supportForm select, #supportForm textarea');
inputs.forEach(input => {
    input.addEventListener('input', () => validateInput(input));
    input.addEventListener('change', () => validateInput(input));
});

// Handle form submission with SweetAlert
function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = document.getElementById('supportForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');

    // Validate all inputs
    const isNameValid = validateInput(nameInput);
    const isEmailValid = validateInput(emailInput);
    const isSubjectValid = validateInput(subjectInput);
    const isMessageValid = validateInput(messageInput);

    const hasErrors = !(isNameValid && isEmailValid && isSubjectValid && isMessageValid);

    if (!hasErrors) {
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Thank you! Our support team will contact you soon.',
            confirmButtonColor: '#0a21c0',
            confirmButtonText: 'OK'
        }).then(() => {
            form.reset();
            inputs.forEach(input => {
                input.classList.remove('is-invalid');
                const errorElement = document.getElementById(`${input.id}-error`);
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            });
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please fill out all fields correctly before submitting.',
            confirmButtonColor: '#0a21c0'
        });
    }
}

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('active');
}