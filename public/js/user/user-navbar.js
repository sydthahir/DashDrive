
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

        if (navbarToggler && navbarCollapse) {
            // Remove Bootstrap attributes to prevent conflict
            navbarToggler.removeAttribute('data-toggle');
            navbarToggler.removeAttribute('data-target');
            navbarToggler.removeAttribute('data-bs-toggle');
            navbarToggler.removeAttribute('data-bs-target');

            navbarToggler.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

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
        if (navbarCollapse) {
            const links = navbarCollapse.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', function () {
                    if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
                        navbarCollapse.classList.remove('show');
                        if (navbarToggler) {
                            navbarToggler.setAttribute('aria-expanded', 'false');
                            navbarToggler.classList.add('collapsed');
                        }
                    }
                });
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', function (event) {
            if (navbar && !navbar.contains(event.target) && navbarCollapse && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
                if (navbarToggler) {
                    navbarToggler.setAttribute('aria-expanded', 'false');
                    navbarToggler.classList.add('collapsed');
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', function () {
            if (window.innerWidth >= 992 && navbarCollapse && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
                if (navbarToggler) {
                    navbarToggler.setAttribute('aria-expanded', 'false');
                    navbarToggler.classList.add('collapsed');
                }
            }
        });

        // Navbar scroll effect 
        window.addEventListener('scroll', () => {
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
        });
    }
})();
