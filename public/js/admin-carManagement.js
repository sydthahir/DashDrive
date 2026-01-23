// Car Management JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // View Car Details
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const carId = e.currentTarget.getAttribute('data-car-id');
            await showCarDetails(carId);
        });
    });

    // Approve Car
    const approveButtons = document.querySelectorAll('.approve-btn');
    approveButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const carId = e.currentTarget.getAttribute('data-car-id');
            await approveCar(carId, e.currentTarget);
        });
    });

    // Reject Car
    const rejectButtons = document.querySelectorAll('.reject-btn');
    rejectButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const carId = e.currentTarget.getAttribute('data-car-id');
            await rejectCar(carId, e.currentTarget);
        });
    });
});

// Show Car Details in Modal
async function showCarDetails(carId) {
    const modal = new bootstrap.Modal(document.getElementById('carDetailsModal'));
    const modalContent = document.getElementById('carDetailsContent');

    // Show loading state
    modalContent.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    modal.show();

    try {
        const response = await fetch(`/admin/cars/details/${carId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const car = data.car;
            modalContent.innerHTML = generateCarDetailsHTML(car);
        } else {
            modalContent.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    ${data.message || 'Failed to load car details'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching car details:', error);
        modalContent.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                An error occurred while loading car details
            </div>
        `;
    }
}

// Generate Car Details HTML
function generateCarDetailsHTML(car) {
    const statusBadgeClass = car.status === 'approved' ? 'approved' :
        car.status === 'rejected' ? 'rejected' : 'pending';

    const statusIcon = car.status === 'approved' ? 'fa-check-circle' :
        car.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';

    return `
        <!-- Car Images -->
        <div class="car-detail-section">
            <h6><i class="fas fa-images me-2"></i>Car Images</h6>
            <div class="car-images-grid">
                ${car.images && car.images.length > 0 ?
            car.images.map(img => `
                        <img src="/${img}" alt="${car.model}" class="car-detail-image" 
                             onclick="window.open('/${img}', '_blank')">
                    `).join('') :
            '<p class="text-muted">No images available</p>'
        }
            </div>
        </div>

        <!-- Car Information -->
        <div class="car-detail-section">
            <h6><i class="fas fa-car me-2"></i>Car Information</h6>
            <div class="detail-row">
                <div class="detail-label">Model:</div>
                <div class="detail-value"><strong>${car.model || 'N/A'}</strong></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Brand:</div>
                <div class="detail-value">
                    ${car.brand ? `
                        <div class="d-flex align-items-center gap-2">
                            ${car.brand.logo ? `<img src="/${car.brand.logo}" alt="${car.brand.name}" style="width: 24px; height: 24px; object-fit: contain;">` : ''}
                            <span>${car.brand.name}</span>
                        </div>
                    ` : 'N/A'}
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Year:</div>
                <div class="detail-value">${car.year || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Registration Number:</div>
                <div class="detail-value">
                    <span class="registration-number">${car.registrationNumber || 'N/A'}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Color:</div>
                <div class="detail-value">${car.color || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Mileage:</div>
                <div class="detail-value">${car.mileage || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Car Type:</div>
                <div class="detail-value">${car.carType || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Fuel Type:</div>
                <div class="detail-value">
                    <span class="fuel-badge ${car.fuelType ? car.fuelType.toLowerCase() : ''}">${car.fuelType || 'N/A'}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Features:</div>
                <div class="detail-value">${car.features || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">
                    <span class="status-badge ${statusBadgeClass}">
                        <i class="fas ${statusIcon}"></i> ${car.status ? car.status.charAt(0).toUpperCase() + car.status.slice(1) : 'N/A'}
                    </span>
                </div>
            </div>
        </div>

        <!-- Pricing Information -->
        <div class="car-detail-section">
            <h6><i class="fas fa-rupee-sign me-2"></i>Pricing Information</h6>
            <div class="detail-row">
                <div class="detail-label">Charge Per Slot:</div>
                <div class="detail-value"><span class="price">₹${car.chargePerSlot || 'N/A'}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Security Deposit:</div>
                <div class="detail-value">₹${car.securityDeposit || 'N/A'}</div>
            </div>
        </div>

        <!-- Vendor Information -->
        <div class="car-detail-section">
            <h6><i class="fas fa-user-tie me-2"></i>Vendor Information</h6>
            ${car.vendor ? `
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">
                        <a href="/admin/vendors/details/${car.vendor._id}" class="vendor-link" target="_blank">
                            ${car.vendor.fullName}
                        </a>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Company:</div>
                    <div class="detail-value">${car.vendor.companyName || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">${car.vendor.email || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">${car.vendor.phone || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Business Address:</div>
                    <div class="detail-value">${car.vendor.businessAddress || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Tax ID (GST):</div>
                    <div class="detail-value">${car.vendor.taxId || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Business License:</div>
                    <div class="detail-value">${car.vendor.businessLicense || 'N/A'}</div>
                </div>
            ` : '<p class="text-muted">Vendor information not available</p>'}
        </div>

        <!-- Additional Information -->
        ${car.description ? `
            <div class="car-detail-section">
                <h6><i class="fas fa-info-circle me-2"></i>Description</h6>
                <p class="text-muted">${car.description}</p>
            </div>
        ` : ''}

        ${car.availableDays && car.availableDays.length > 0 ? `
            <div class="car-detail-section">
                <h6><i class="fas fa-calendar-alt me-2"></i>Available Days</h6>
                <div class="d-flex flex-wrap gap-2">
                    ${car.availableDays.map(day => `
                        <span class="badge bg-primary">${day}</span>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// Approve Car
async function approveCar(carId, button) {
    const result = await Swal.fire({
        title: 'Approve Car?',
        text: 'Are you sure you want to approve this car registration?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    // Disable button
    button.disabled = true;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`/admin/cars/approve/${carId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Approved!',
                text: data.message,
                showConfirmButton: false,
                timer: 1500
            });

            // Update UI
            const row = button.closest('tr');
            const statusBadge = row.querySelector('.status-badge');

            if (statusBadge) {
                statusBadge.className = 'status-badge approved';
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Approved';
            }

            // Remove action buttons
            const actionButtons = row.querySelector('.action-buttons');
            const viewBtn = actionButtons.querySelector('.view-btn');
            actionButtons.innerHTML = '';
            if (viewBtn) {
                actionButtons.appendChild(viewBtn);
            }

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'Failed to approve car'
            });
            button.disabled = false;
            button.innerHTML = originalHTML;
        }
    } catch (error) {
        console.error('Error approving car:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while approving the car'
        });
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
}

// Reject Car
async function rejectCar(carId, button) {
    const result = await Swal.fire({
        title: 'Reject Car?',
        text: 'Are you sure you want to reject this car registration?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    // Disable button
    button.disabled = true;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`/admin/cars/reject/${carId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Rejected!',
                text: data.message,
                showConfirmButton: false,
                timer: 1500
            });

            // Update UI
            const row = button.closest('tr');
            const statusBadge = row.querySelector('.status-badge');

            if (statusBadge) {
                statusBadge.className = 'status-badge rejected';
                statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Rejected';
            }

            // Remove action buttons
            const actionButtons = row.querySelector('.action-buttons');
            const viewBtn = actionButtons.querySelector('.view-btn');
            actionButtons.innerHTML = '';
            if (viewBtn) {
                actionButtons.appendChild(viewBtn);
            }

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'Failed to reject car'
            });
            button.disabled = false;
            button.innerHTML = originalHTML;
        }
    } catch (error) {
        console.error('Error rejecting car:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while rejecting the car'
        });
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
}

// Toast Notification Helper
function showToast(message, type = 'success') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
}
