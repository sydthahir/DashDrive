
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Mobile menu toggle functionality 
        (function () {
        
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initMobileMenu);
            } else {
                initMobileMenu();
            }

            function initMobileMenu() {
                const navbarToggler = document.querySelector('.navbar-toggler');
                const navbarCollapse = document.querySelector('.navbar-collapse');
                const navLinks = document.querySelectorAll('.nav-link');
                const navbar = document.querySelector('.navbar');

                console.log('Mobile menu initialized', { navbarToggler, navbarCollapse }); // Debug log

            
                if (navbarToggler) {
                    
                    navbarToggler.removeAttribute('data-toggle');
                    navbarToggler.removeAttribute('data-target');

                    navbarToggler.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        console.log('Toggler clicked'); 

                        const isCurrentlyShown = navbarCollapse.classList.contains('show');

                        if (isCurrentlyShown) {
                            navbarCollapse.classList.remove('show');
                            navbarToggler.setAttribute('aria-expanded', 'false');
                            navbarToggler.classList.add('collapsed');
                        } else {
                            navbarCollapse.classList.add('show');
                            navbarToggler.setAttribute('aria-expanded', 'true');
                            navbarToggler.classList.remove('collapsed');
                        }
                    });
                }

                // Close menu 
                navLinks.forEach(link => {
                    link.addEventListener('click', function () {
                        if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
                            navbarCollapse.classList.remove('show');
                            navbarToggler.setAttribute('aria-expanded', 'false');
                            navbarToggler.classList.add('collapsed');
                        }
                    });
                });

                // Close menu when clicking outside
                document.addEventListener('click', function (event) {
                    if (!navbar.contains(event.target) && navbarCollapse.classList.contains('show')) {
                        navbarCollapse.classList.remove('show');
                        navbarToggler.setAttribute('aria-expanded', 'false');
                        navbarToggler.classList.add('collapsed');
                    }
                });

                // Handle window resize
                window.addEventListener('resize', function () {
                    if (window.innerWidth >= 992 && navbarCollapse.classList.contains('show')) {
                        navbarCollapse.classList.remove('show');
                        navbarToggler.setAttribute('aria-expanded', 'false');
                        navbarToggler.classList.add('collapsed');
                    }
                });
            }
        })();

        // smooth scroll behavior
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && href !== '#') {
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
  