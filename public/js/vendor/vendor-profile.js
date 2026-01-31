/**
 * Vendor Profile Page JavaScript
 * Handles edit mode, validation, and form submission
 */

(function () {
    'use strict';

    // DOM Elements
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const profileForm = document.getElementById('profileForm');
    const profileFields = document.querySelectorAll('.profile-field');
    const profileImageInput = document.getElementById('profileImage');
    const profilePreview = document.querySelector('.profile-preview');
    const imageUploadOverlay = document.querySelector('.image-upload-overlay');

    // Store original values for cancel functionality
    let originalValues = {};

    // Initialize
    document.addEventListener('DOMContentLoaded', function () {
        initializeEventListeners();
        storeOriginalValues();
    });

    /**
     * Initialize event listeners
     */
    function initializeEventListeners() {
        if (editBtn) {
            editBtn.addEventListener('click', enableEditMode);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelEdit);
        }

        if (profileForm) {
            profileForm.addEventListener('submit', handleFormSubmit);
        }

        if (profileImageInput) {
            profileImageInput.addEventListener('change', handleImagePreview);
        }


        // Real-time validation
        profileFields.forEach(field => {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        });
    }

    /**
     * Store original form values
     */
    function storeOriginalValues() {
        profileFields.forEach(field => {
            if (field.tagName === 'TEXTAREA') {
                originalValues[field.id] = field.value;
            } else {
                originalValues[field.id] = field.value;
            }
        });

        if (profilePreview) {
            originalValues.profileImageSrc = profilePreview.src;
        }
    }

    /**
     * Enable edit mode
     */
    function enableEditMode() {
        // Make fields editable (except email)
        profileFields.forEach(field => {
            if (field.id !== 'email') {
                field.removeAttribute('readonly');
                field.classList.add('editable');
            }
        });

        // Show/hide buttons
        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';

        // Show image upload overlay
        if (imageUploadOverlay) {
            imageUploadOverlay.style.display = 'flex';
        }


        const firstEditable = document.querySelector('.profile-field.editable');
        if (firstEditable) {
            firstEditable.focus();
        }
    }

    /**
     * Cancel edit and restore original values
     */
    function cancelEdit() {
        // Restore original values
        profileFields.forEach(field => {
            if (field.id !== 'email') {
                field.value = originalValues[field.id] || '';
                field.setAttribute('readonly', 'readonly');
                field.classList.remove('editable');
                field.classList.remove('is-invalid');
            }
        });



        // Show/hide buttons
        if (editBtn) editBtn.style.display = 'inline-flex';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';

        // Hide image upload overlay
        if (imageUploadOverlay) {
            imageUploadOverlay.style.display = 'none';
        }

        // Reset image preview if it was changed
        if (profileImageInput) profileImageInput.value = '';
        if (profilePreview && originalValues.profileImageSrc) {
            profilePreview.src = originalValues.profileImageSrc;
        }

        // Clear all validation errors
        clearAllErrors();
    }

    /**
     * Handle image preview
     */
    function handleImagePreview(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showFieldError(profileImageInput, 'Please select a valid image file (JPEG, PNG, or WebP)');
            profileImageInput.value = '';
            return;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showFieldError(profileImageInput, 'Image size must be less than 5MB');
            profileImageInput.value = '';
            return;
        }

        // Clear any errors
        clearFieldError({ target: profileImageInput });

        // Create preview
        const reader = new FileReader();
        reader.onload = function (e) {
            if (profilePreview) {
                profilePreview.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }

    /**
     * Handle form submission
     */
    async function handleFormSubmit(event) {
        event.preventDefault();

        // Validate all fields
        let isValid = true;
        profileFields.forEach(field => {
            if (field.id !== 'email' && !validateField({ target: field })) {
                isValid = false;
            }
        });

        if (!isValid) {
            showAlert('Please fix the errors before submitting', 'danger');
            return;
        }

        // Disable save button and show loading state
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('loading');
        }

        // Create FormData
        const formData = new FormData(profileForm);

        try {
            const response = await fetch('/vendor/profile/update', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const result = await response.json();

            if (result.success) {
                showAlert(result.message || 'Profile updated successfully!', 'success');

                // Update original values
                storeOriginalValues();

                // Exit edit mode after a delay
                setTimeout(() => {
                    cancelEdit();
                    // Reload page to show updated data
                    window.location.reload();
                }, 1500);
            } else {
                showAlert(result.message || 'Failed to update profile. Please try again.', 'danger');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove('loading');
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showAlert('An error occurred. Please try again.', 'danger');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.classList.remove('loading');
            }
        }
    }

    /**
     * Validate individual field
     */
    function validateField(event) {
        const field = event.target || event;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Check required fields (except email)
        if (field.id !== 'email' && field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Phone validation
        if (field.id === 'phone' && value) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Phone number must be 10 digits';
            }
        }

        // Email readonly check (security)
        if (field.id === 'email') {
            field.setAttribute('readonly', 'readonly');
        }

        // Update field state
        if (isValid) {
            field.classList.remove('is-invalid');
            clearFieldError({ target: field });
        } else {
            field.classList.add('is-invalid');
            showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Show field error message
     */
    function showFieldError(field, message) {
        const feedback = field.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.style.display = 'block';
        }
    }

    /**
     * Clear field error
     */
    function clearFieldError(event) {
        const field = event.target;
        field.classList.remove('is-invalid');
        const feedback = field.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
    }

    /**
     * Clear all errors
     */
    function clearAllErrors() {
        profileFields.forEach(field => {
            field.classList.remove('is-invalid');
            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.style.display = 'none';
            }
        });
    }

    /**
     * Show alert message
     */
    function showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');

        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        alertDiv.innerHTML = `
            <i class="fas ${icon} me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // Insert at the top of profile container
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) {
            profileContainer.insertBefore(alertDiv, profileContainer.firstChild);
        }

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 5000);
    }
})();

