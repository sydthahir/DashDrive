document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.querySelector(".toggle-sidebar");
    const sidebar = document.querySelector(".sidebar");

    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("show");
        document.body.classList.toggle("sidebar-open");
    });

    document.addEventListener("click", (e) => {
        if (
            document.body.classList.contains("sidebar-open") &&
            !sidebar.contains(e.target) &&
            !toggleBtn.contains(e.target)
        ) {
            sidebar.classList.remove("show");
            document.body.classList.remove("sidebar-open");
        }
    });
});
