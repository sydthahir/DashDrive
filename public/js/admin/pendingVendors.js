
let selectedVendorId = null;
let actionType = null;
let isProcessing = false;


//Vendor Appproval
function approveVendor(vendorId) {
    selectedVendorId = vendorId;
    actionType = 'approve';
    document.getElementById('confirmationMessage').textContent = 'Are you sure you want to approve this vendor?';
    new bootstrap.Modal(document.getElementById('confirmationModal')).show();
}

//Vendor Rejection
function rejectVendor(vendorId) {
    selectedVendorId = vendorId;
    actionType = 'reject';
    document.getElementById('confirmationMessage').textContent = 'Are you sure you want to reject this vendor?';
    new bootstrap.Modal(document.getElementById('confirmationModal')).show();
}
//Confirm action Modal
document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', () => {
    isProcessing = false;
    selectedVendorId = null;
    actionType = null;

    const confirmBtn = document.getElementById('confirmAction');
    confirmBtn.disabled = false;
    confirmBtn.innerText = "Confirm";
});

//Confirm Action
document.getElementById('confirmAction').addEventListener('click', async function () {
    if (!selectedVendorId || !actionType || isProcessing) return;

    isProcessing = true;

    const confirmBtn = this;
    confirmBtn.disabled = true;
    confirmBtn.innerText = "Processing...";

    try {
        const response = await fetch(`/admin/vendors/${actionType}/${selectedVendorId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: data.message || 'Action completed'
            }).then(() => {
                window.location.reload();
            });
        } else {
            throw new Error(data.message || 'Failed to perform action');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'An error occurred', 'error');

        //Re-enable button on failure
        isProcessing = false;
        confirmBtn.disabled = false;
        confirmBtn.innerText = "Confirm";

    }
});
