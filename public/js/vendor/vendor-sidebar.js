/**
 * Vendor Sidebar Toggle Functionality
 * Handles sidebar toggle on all screen sizes
 */
document.addEventListener("DOMContentLoaded", function () {
    // Get all sidebar toggle buttons (there may be multiple)
    const toggleButtons = document.querySelectorAll(".toggle-sidebar");
    const sidebar = document.querySelector(".sidebar");
    const sidebarOverlay = document.querySelector(".sidebar-overlay");
    const navLinks = document.querySelectorAll(".nav-link");

    if (!sidebar) return;

    // Function to toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle("show");
        sidebar.classList.toggle("active"); // Support both class names

        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle("show");
        }

        document.body.classList.toggle("sidebar-open");

        // Update icon on toggle buttons
        toggleButtons.forEach(btn => {
            const icon = btn.querySelector("i");
            // Optional: You can keep the icon change if you want, but Standard admin behavior often keeps the hamburger.
            // Admin example didn't change icon, so let's keep it simple or check admin behavior.
            // Admin JS didn't have icon toggle logic in the snippet I saw.
            // But let's leave it as is if it looks good, or remove if it causes confusion.
            // If the sidebar slides under the navbar, the hamburger is still visible.
            // changing it to X is fine.
            if (icon) {
                if (sidebar.classList.contains("show") || sidebar.classList.contains("active")) {
                    icon.classList.remove("fa-bars");
                    icon.classList.add("fa-times");
                } else {
                    icon.classList.remove("fa-times");
                    icon.classList.add("fa-bars");
                }
            }
        });
    }

    // Function to close sidebar
    function closeSidebar() {
        sidebar.classList.remove("show");
        sidebar.classList.remove("active");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("show");
        }

        document.body.classList.remove("sidebar-open");

        // Update icon on toggle buttons
        toggleButtons.forEach(btn => {
            const icon = btn.querySelector("i");
            if (icon) {
                icon.classList.remove("fa-times");
                icon.classList.add("fa-bars");
            }
        });
    }

    // Add click event to all toggle buttons
    toggleButtons.forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            toggleSidebar();
        });
    });

    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", function () {
            closeSidebar();
        });
    }

    // Close sidebar when clicking outside (on mobile)
    document.addEventListener("click", function (event) {
        if (window.innerWidth <= 992) {
            const isClickInsideSidebar = sidebar && sidebar.contains(event.target);
            const isClickOnToggle = Array.from(toggleButtons).some(btn => btn.contains(event.target));

            if (!isClickInsideSidebar && !isClickOnToggle) {
                closeSidebar();
            }
        }
    });

    // Close sidebar when clicking nav links (on mobile)
    navLinks.forEach(link => {
        link.addEventListener("click", function () {
            if (window.innerWidth <= 992) {
                closeSidebar();
            }
        });
    });

    // Close sidebar when clicking logout button (on mobile)
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (window.innerWidth <= 992) {
                closeSidebar();
            }
        });
    }

    // Close sidebar on window resize if going to desktop size
    window.addEventListener("resize", function () {
        if (window.innerWidth > 992) {
            closeSidebar();
        }
    });
});
