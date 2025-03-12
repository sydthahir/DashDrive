document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const loginSpinner = document.getElementById('loginSpinner');

    // Handle form submission
    adminLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Show spinner and disable form
        loginSpinner.classList.remove('d-none');
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        // Get form data
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            // Simulate API call with timeout
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For demo purposes, check if email is admin@dashdrive.com and password is admin123
            if (email === 'admin@dashdrive.com' && password === 'admin123') {
                // Store remember me preference
                if (rememberMe) {
                    localStorage.setItem('adminEmail', email);
                } else {
                    localStorage.removeItem('adminEmail');
                }

                // Redirect to admin dashboard
                window.location.href = 'admin-dashboard.html';
            } else {
                alert('Invalid email or password');
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        } finally {
            // Hide spinner and enable form
            loginSpinner.classList.add('d-none');
            submitButton.disabled = false;
        }
    });

    // Check for remembered email
    const rememberedEmail = localStorage.getItem('adminEmail');
    if (rememberedEmail) {
        document.getElementById('adminEmail').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }
});
