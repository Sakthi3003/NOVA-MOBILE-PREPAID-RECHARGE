
        // Pages configuration for guests only
        const guestPages = [
            { id: "home", label: "Home", url: "index.html" },
            { id: "plans", label: "Plans", url: "./SUBSCRIBER/plans.html" },
            { id: "support", label: "Support", url: "./SUBSCRIBER/supportg.html" },
            { id: "about", label: "About us", url: "./SUBSCRIBER/about.html" }
        ];

        let currentPage = "home";
        let users = [];

        // Fetch user.json
        $.getJSON('./SUBSCRIBER/user.json')
            .done(function(data) {
                users = data.users;
            })
            .fail(function() {
                console.error('Failed to load user.json');
                alert('Error loading user data. Please try again.');
            });

        // Generate static guest navigation
        function generateNavigation() {
            const navLinks = document.getElementById("nav-links");
            navLinks.innerHTML = "";

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
            loginBtn.href = "./SUBSCRIBER/login.html";
            loginBtn.className = "btn login-btn";
            loginBtn.textContent = "Login";
            navLinks.appendChild(loginBtn);
        }

        // Set current page and navigate
        function setCurrentPage(pageId) {
            currentPage = pageId;
            const page = guestPages.find(p => p.id === pageId);
            if (page) {
                window.location.href = page.url;
            }
            generateNavigation();
        }

        // Toggle mobile menu
        function toggleMenu() {
            const navLinks = document.getElementById("nav-links");
            navLinks.classList.toggle("active");
        }

        $(document).ready(function() {
            // Initialize static guest navigation
            generateNavigation();

            // Get the loading overlay element
            const loadingOverlay = $('#loadingOverlay');

            // Phone number validation methods
            $.validator.addMethod('validPhone', function(value) {
                return /^\d{10}$/.test(value);
            }, 'Please enter a valid 10-digit phone number');

            $.validator.addMethod('phoneExists', function(value) {
                const fullNumber = '+91 ' + value;
                return users.some(user => user.number === fullNumber);
            }, 'This phone number is not registered');

            $.validator.addMethod('noLowStart', function(value) {
                return !/^[0-5]/.test(value);
            }, 'Number cannot start with 0, 1, 2, 3, 4, or 5');

            // Phone form validation
            $('#phoneForm').validate({
                rules: {
                    phoneNumber: {
                        required: true,
                        validPhone: true,
                        phoneExists: true,
                        noLowStart: true,
                        maxlength: 10
                    }
                },
                messages: {
                    phoneNumber: {
                        required: 'Phone number is required',
                        validPhone: 'Enter a valid 10-digit number',
                        phoneExists: 'This number is not registered',
                        noLowStart: 'Number cannot start with 0-5',
                        maxlength: 'Must be exactly 10 digits'
                    }
                },
                errorPlacement: function(error, element) {
                    $('#phoneError').text(error.text()).show();
                },
                success: function(label, element) {
                    $('#phoneError').hide();
                }
            });

            // Dynamic phone number validation on input and auto-navigation with loading
            $('#phoneNumber').on('input', function() {
                const value = this.value.replace(/[^0-9]/g, '');
                this.value = value.slice(0, 10);

                if (value.length > 0) {
                    if (/^[0-5]/.test(value)) {
                        $('#phoneError').text('Number cannot start with 0, 1, 2, 3, 4, or 5').show();
                    } else if (value.length < 10) {
                        $('#phoneError').text('Please enter a 10-digit number').show();
                    } else if (!/^\d{10}$/.test(value)) {
                        $('#phoneError').text('Enter a valid 10-digit number').show();
                    } else {
                        const fullNumber = '+91 ' + value;
                        if (!users.some(user => user.number === fullNumber)) {
                            $('#phoneError').text('This number is not registered').show();
                        } else {
                            $('#phoneError').hide();
                            loadingOverlay.css('display', 'flex');
                            const phone = $('#phoneNumber').val().trim();
                            sessionStorage.setItem('phoneNumber', phone);
                            sessionStorage.setItem('fromQuickRecharge', 'true');
                            setTimeout(() => {
                                setCurrentPage('plans');
                            }, 1000);
                        }
                    }
                } else {
                    $('#phoneError').hide();
                }
            });

            // Handle Buy SIM and Track Order buttons
            $('.btn-primary, .btn-track').on('click', function(e) {
                e.preventDefault();
                loadingOverlay.css('display', 'flex');
                const url = $(this).attr('href');
                setTimeout(() => {
                    window.location.href = url;
                }, 1000);
            });

            // About Us Counters
            const customers = [
                { name: "Alice", recharges: 5, rating: 4.5 },
                { name: "Bob", recharges: 10, rating: 5.0 },
                { name: "Charlie", recharges: 7, rating: 4.8 },
                { name: "David", recharges: 15, rating: 4.9 },
                { name: "Emma", recharges: 8, rating: 4.2 }
            ];

            const totalCustomers = customers.length;
            document.getElementById("totalCustomers").setAttribute("data-target", totalCustomers);

            const totalRecharges = customers.reduce((sum, customer) => sum + customer.recharges, 0);
            document.getElementById("totalRecharges").setAttribute("data-target", totalRecharges);

            const avgRating = (customers.reduce((sum, customer) => sum + customer.rating, 0) / customers.length).toFixed(1);
            document.getElementById("avgRating").innerText = avgRating + "/5";

            const ratingStarsContainer = document.getElementById("ratingStars");
            ratingStarsContainer.innerHTML = "";
            const fullStars = Math.floor(avgRating);
            const halfStar = avgRating % 1 !== 0 ? 1 : 0;
            for (let i = 0; i < fullStars; i++) {
                ratingStarsContainer.innerHTML += '<i class="bi bi-star-fill"></i>';
            }
            if (halfStar) {
                ratingStarsContainer.innerHTML += '<i class="bi bi-star-half"></i>';
            }

            const counters = document.querySelectorAll(".counter");
            counters.forEach(counter => {
                counter.innerText = "0";
                const updateCounter = () => {
                    const target = +counter.getAttribute("data-target");
                    const count = +counter.innerText;
                    const increment = target / 100;
                    if (count < target) {
                        counter.innerText = Math.ceil(count + increment);
                        setTimeout(updateCounter, 20);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCounter();
            });
        });
    