// Add ID to date input 
if (!dateInput.id) {
    dateInput.id = "dateInput";
}

dateInput.addEventListener("change", async function () {
    const selectedDate = this.value;

    console.log("Date selected:", selectedDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

     const selected = new Date(selectedDate);

     if (selected < today) {
        timeSelect.innerHTML = '<option value="">Cannot select past date</option>';
        timeSelect.disabled = true;
        return;
    }

   
    if (!selectedDate) {
        timeSelect.innerHTML = '<option value="">Select time</option>';
        return;
    }

    // Show loading state
    timeSelect.innerHTML = '<option value="">Loading slots...</option>';
    timeSelect.disabled = true;

    try {
        console.log("Fetching slots for car:", carId, "date:", selectedDate);

        const res = await fetch(`/cars/${carId}/available-slots?date=${selectedDate}`);

        console.log("Response status:", res.status);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const slots = await res.json();
        console.log("Received slots:", slots);

        // Reset select
        timeSelect.innerHTML = '<option value="">Select time</option>';
        timeSelect.disabled = false;

        //Fetch all slots
        const allSlots = slots;


        console.log("Available slots:", allSlots);

        if (allSlots.length === 0) {
            timeSelect.innerHTML = '<option value="">No slots avail. for this date</option>';
            timeSelect.disabled = true;

            // Showing alert 
            Swal.fire({
                icon: 'info',
                title: 'No Slots Available',
                text: 'No available time slots for the selected date. Please choose another date.',
                confirmButtonColor: '#0f172a'
            });

            return;
        }

        // Add available slots to dropdown
        allSlots.forEach(slot => {
            const option = document.createElement("option");
            option.value = `${slot.startTime}-${slot.endTime}`;

            const formattedTime = formatTime(slot.startTime) + " - " + formatTime(slot.endTime);

            const expired = isSlotExpired(slot, selectedDate);

            if (expired) {
                option.textContent = formattedTime + " (Expired)";
                option.disabled = true;
            }

            else if (slot.status === "available") {
                option.textContent = formattedTime + " (Available)";
            }

            else if (slot.status === "booked") {
                option.textContent = formattedTime + " (Booked)";
                option.disabled = true;
            }

            else if (slot.status === "maintenance") {
                option.textContent = formattedTime + " (Under Maintenance)";
                option.disabled = true;
            }

            timeSelect.appendChild(option);
        });

        console.log("Slots loaded successfully");

    } catch (err) {
        console.error("Error loading slots:", err);

        timeSelect.innerHTML = '<option value="">Error loading slots</option>';
        timeSelect.disabled = true;

        // Error alert 
        Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'Unable to load available time slots. Please try again later.',
            confirmButtonColor: '#ef4444'
        });

    }
});

function formatTime(time) {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 || 12;
    return `${display}:${m} ${ampm}`;
}

function isSlotExpired(slot, selectedDate) {

    const now = new Date();

    const selected = new Date(selectedDate);

    // Remove time from today 
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If yesterday or prvious days
    if (selected < today) {
        return true;
    }

    // If selected date is after today 
    if (selected > today) {
        return false;
    }

    // If Date today checks time 
    const [h, m] = slot.endTime.split(":");

    const slotEnd = new Date();
    slotEnd.setHours(parseInt(h), parseInt(m), 0, 0);

    return slotEnd <= now;
}


// Enable date input on page load
console.log("Car details page loaded. Car ID:", carId);
console.log("Date input element:", dateInput);
console.log("Time select element:", timeSelect);


// Favourites Toggle 
async function toggleDetailsFavorite(btn, carId) {
    try {
        const response = await fetch('/toggle-favourite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ carId })
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (data.success) {
            const icon = btn.querySelector('i');
            if (data.action === 'added') {
                icon.classList.remove('far', 'text-secondary');
                icon.classList.add('fas', 'text-danger');
                btn.title = "Remove from Favorites";
            } else {
                icon.classList.remove('fas', 'text-danger');
                icon.classList.add('far', 'text-secondary');
                btn.title = "Add to Favorites";
            }
        } else {
            console.error('Failed to toggle favorite:', data.message);
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}
