//Get all form elements
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signform");
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm_password");

    // error elements
    const error1 = document.getElementById("error1");
    const error2 = document.getElementById("error2");
    const errorPassword = document.getElementById("errorPassword");
    const errorConfirmPassword = document.getElementById("errorConfirmPassword");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{8,}$/;

    form.addEventListener("submit", (e) => {
        let valid = true;

        // Reset all errors
        error1.style.display = "none";
        error2.style.display = "none";
        errorPassword.style.display = "none";
        errorConfirmPassword.style.display = "none";

        // Name validation
        if (name.value.trim().length < 3) {
            error1.textContent = "Name must be at least 3 characters";
            error1.style.display = "block";
            valid = false;
        }

        // Email validation
        if (!emailRegex.test(email.value.trim())) {
            error2.textContent = "Enter a valid email address";
            error2.style.display = "block";
            valid = false;
        }

        // Password validation
        const passVal = password.value.trim();

        if (passVal === "") {
            errorPassword.textContent = "Password is required";
            errorPassword.style.display = "block";
            valid = false;
        } else if (passVal.length < 8) {
            errorPassword.textContent = "Password must be at least 8 characters";
            errorPassword.style.display = "block";
            valid = false;
        } else if (!passwordPattern.test(passVal)) {
            errorPassword.textContent = "Password must contain: uppercase, lowercase, number, and special character (@#$!%*?&)";
            errorPassword.style.display = "block";
            valid = false;
        }

        // Confirm password validation
        const confirmVal = confirmPassword.value.trim();

        if (confirmVal === "") {
            errorConfirmPassword.textContent = "Please confirm your password";
            errorConfirmPassword.style.display = "block";
            valid = false;
        } else if (passVal !== confirmVal) {
            errorConfirmPassword.textContent = "Passwords does not match";
            errorConfirmPassword.style.display = "block";
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
        }
    });
});

// Password Toggle Functionality
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const icon = event.currentTarget.querySelector('i');

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
