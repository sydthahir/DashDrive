// Get all form elements
document.addEventListener("DOMContentLoaded", () => {
    const formElements = {
        firstName: document.getElementById("firstName"),
        lastName: document.getElementById("lastName"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        password: document.getElementById("password"),
        confirmPassword: document.getElementById("confirmPassword"),
        companyName: document.getElementById("companyName"),
        businessAddress: document.getElementById("businessAddress"),
        businessLicense: document.getElementById("businessLicense"),
        taxId: document.getElementById("taxId"),
        documents: document.getElementById("documents"),
        terms: document.getElementById("terms"),
        signupForm: document.getElementById("signupForm")
    };

    // Get all error elements
    const errorElements = {
        firstName: document.getElementById("firstNameError"),
        lastName: document.getElementById("lastNameError"),
        email: document.getElementById("emailError"),
        phone: document.getElementById("phoneError"),
        password: document.getElementById("passwordError"),
        confirmPassword: document.getElementById("confirmPasswordError"),
        companyName: document.getElementById("companyNameError"),
        businessAddress: document.getElementById("businessAddressError"),
        businessLicense: document.getElementById("businessLicenseError"),
        taxId: document.getElementById("taxIdError"),
        documents: document.getElementById("documentsError"),
        terms: document.getElementById("termsError")
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{8,}$/;
    const namePattern = /^[A-Za-z\s]+$/;
    const phonePattern = /^\d{10}$/;

    // Name Validation
    function validateName(nameInput, errorElement) {
        const nameVal = nameInput.value.trim();

        if (!nameVal) {
            errorElement.style.display = "block";
            errorElement.textContent = "Name is required";
            return false;
        } else if (nameVal.length < 3) {
            errorElement.style.display = "block";
            errorElement.textContent = "Name must be at least 3 characters";
            return false;
        } else if (!namePattern.test(nameVal)) {
            errorElement.style.display = "block";
            errorElement.textContent = "Name must contain only letters";
            return false;
        }
        errorElement.style.display = "none";
        return true;
    }

    // Email Validation
    function validateEmail() {
        const emailVal = formElements.email.value.trim();

        if (!emailVal) {
            errorElements.email.style.display = "block";
            errorElements.email.textContent = "Email is required";
            return false;
        } else if (!emailRegex.test(emailVal)) {
            errorElements.email.style.display = "block";
            errorElements.email.textContent = "Enter a valid email address";
            return false;
        }
        errorElements.email.style.display = "none";
        return true;
    }

    // Phone Validation
    function validatePhone() {
        const phoneVal = formElements.phone.value.trim();

        if (!phoneVal) {
            errorElements.phone.style.display = "block";
            errorElements.phone.textContent = "Phone number is required";
            return false;
        } else if (!phonePattern.test(phoneVal)) {
            errorElements.phone.style.display = "block";
            errorElements.phone.textContent = "Phone must be 10 digits";
            return false;
        }
        errorElements.phone.style.display = "none";
        return true;
    }

    // Password Validation
    function validatePassword() {
        const passVal = formElements.password.value.trim();
        const cPassVal = formElements.confirmPassword.value.trim();
        let isValid = true;

        // Password validation
        if (passVal === "") {
            errorElements.password.style.display = "block";
            errorElements.password.textContent = "Password is required";
            isValid = false;
        } else if (passVal.length < 8) {
            errorElements.password.style.display = "block";
            errorElements.password.textContent = "Password must be at least 8 characters";
            isValid = false;
        } else if (!passwordPattern.test(passVal)) {
            errorElements.password.style.display = "block";
            errorElements.password.textContent = "Password must contain: uppercase, lowercase, number, and special character (@#$!%*?&)";
            isValid = false;
        } else {
            errorElements.password.style.display = "none";
        }

        // Confirm password validation
        if (cPassVal === "") {
            errorElements.confirmPassword.style.display = "block";
            errorElements.confirmPassword.textContent = "Please confirm your password";
            isValid = false;
        } else if (passVal !== cPassVal) {
            errorElements.confirmPassword.style.display = "block";
            errorElements.confirmPassword.textContent = "Passwords does not match";
            isValid = false;
        } else {
            errorElements.confirmPassword.style.display = "none";
        }

        return isValid;
    }

    // Company Name Validation
    function validateCompanyName() {
        const value = formElements.companyName.value.trim();

        if (!value) {
            errorElements.companyName.style.display = "block";
            errorElements.companyName.textContent = "Company name is required";
            return false;
        } else if (value.length < 3) {
            errorElements.companyName.style.display = "block";
            errorElements.companyName.textContent = "Company name must be at least 3 characters";
            return false;
        }
        errorElements.companyName.style.display = "none";
        return true;
    }

    // Business Address Validation
    function validateBusinessAddress() {
        const value = formElements.businessAddress.value.trim();

        if (!value) {
            errorElements.businessAddress.style.display = "block";
            errorElements.businessAddress.textContent = "Business address is required";
            return false;
        } else if (value.length < 10) {
            errorElements.businessAddress.style.display = "block";
            errorElements.businessAddress.textContent = "Please enter a complete address";
            return false;
        }
        errorElements.businessAddress.style.display = "none";
        return true;
    }

    // Licene Number Validation 
    function validateBusinessLicense() {
        const value = formElements.businessLicense.value.trim();

        if (!value) {
            errorElements.businessLicense.style.display = "block";
            return true;
        } else if (value.length < 5) {
            errorElements.businessLicense.style.display = "block";
            errorElements.businessLicense.textContent = "Please enter a valid Licence No.";
            return false;
        }
        errorElements.businessLicense.style.display = "none";
        return true;
    }

    // Tax ID Validation
    function validateTaxId() {
        const value = formElements.taxId.value.trim();

        if (!value) {
            errorElements.taxId.style.display = "block";
            errorElements.taxId.textContent = "Tax ID is required";
            return false;
        } else if (value.length < 5) {
            errorElements.taxId.style.display = "block";
            errorElements.taxId.textContent = "Please enter a valid Tax ID";
            return false;
        }
        errorElements.taxId.style.display = "none";
        return true;
    }

    // Terms Validation
    function validateTerms() {
        if (!formElements.terms.checked) {
            errorElements.terms.style.display = "block";
            errorElements.terms.textContent = "Please Agree to the terms and conditions";
            return false;
        }
        errorElements.terms.style.display = "none";
        return true;
    }

    // Documents Validation
    function validateDocuments() {
        if (!formElements.documents.files || formElements.documents.files.length === 0) {
            errorElements.documents.style.display = "block";
            errorElements.documents.textContent = "Please upload at least one business document";
            return false;
        }
        errorElements.documents.style.display = "none";
        return true;
    }

    // Form Submission Validation
    formElements.signupForm.addEventListener("submit", function (e) {
        let isValid = true;

        // Reset all errors
        Object.values(errorElements).forEach(error => {
            if (error) {
                error.style.display = "none";
                error.textContent = "";
            }
        });

        // Perform validations one by one to ensure all errors are caught
        if (!validateName(formElements.firstName, errorElements.firstName)) isValid = false;
        if (!validateName(formElements.lastName, errorElements.lastName)) isValid = false;
        if (!validateEmail()) isValid = false;
        if (!validatePhone()) isValid = false;
        if (!validatePassword()) isValid = false;
        if (!validateCompanyName()) isValid = false;
        if (!validateBusinessAddress()) isValid = false;
        if (!validateBusinessLicense()) isValid = false; // Added back
        if (!validateTaxId()) isValid = false;
        if (!validateDocuments()) isValid = false;
        if (!validateTerms()) isValid = false;

        if (!isValid) {
            e.preventDefault();

            // Scroll to the first error
            const firstError = document.querySelector(".error-message[style*='display: block']");
            if (firstError) {
                firstError.previousElementSibling.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    // Auto-hide error message after 5 seconds
    const errorAlert = document.getElementById("errorAlert");
    if (errorAlert) {
        setTimeout(function () {
            errorAlert.classList.add("fade-out");
            setTimeout(function () {
                errorAlert.remove();
            }, 500);
        }, 5000);
    }
});

// Password Toggle Functionality
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const icon = event.currentTarget.querySelector("i");

    if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        passwordField.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}