let currentDate = new Date();
let selectedDate = null;
let isLoading = false;
let slotsData = {};
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];


document.addEventListener("DOMContentLoaded", () => {
  renderCalendar(currentDate);

  document.getElementById("prevMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  };

  document.getElementById("nextMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  };


});


//  CALENDAR RENDERING
function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysContainer = document.getElementById('calendarDays');
  daysContainer.innerHTML = '';

  // Empty padding
  for (let i = 0; i < firstDay.getDay(); i++) {
    daysContainer.appendChild(document.createElement("div"));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const div = document.createElement("div");
    const loopDate = new Date(year, month, day);

    loopDate.setHours(0, 0, 0, 0);

    div.className = "calendar-day";
    div.innerHTML = `<div class="day-number">${day}</div>`;

    if (loopDate < today || !isApproved) {
      div.classList.add("disabled");
    } else {
      div.onclick = () => selectDate(div, loopDate);
    }


    daysContainer.appendChild(div);
  }
}

// DATE SELECTION
async function selectDate(element, date) {
  if (!isApproved) return;

  document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
  element.classList.add('selected');

  selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;

  document.getElementById('selectedDateDisplay').textContent =
    selectedDate.toDateString();

  document.getElementById('slotManagementPanel').style.display = 'block';

  await loadSlotsForDate(isoDate);
}

// TOGGLE DATE AVAILABILITY
document.getElementById("dateAvailabilityToggle").onchange = async (e) => {
  if (isLoading) return;

  const isChecked = e.target.checked;

  if (!selectedDate) return;

  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;

  try {
    isLoading = true;
    const res = await fetch(`/vendor/cars/${carId}/toggle-date`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: isoDate,
        status: isChecked ? "available" : "maintenance"
      })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    await loadSlotsForDate(isoDate);

  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to update date availability");
    // Revert toggle if failed
    e.target.checked = !isChecked;
  } finally {
    isLoading = false;
  }
};


//  API CALLS
async function loadSlotsForDate(date) {
  try {
    const res = await fetch(
      `/vendor/cars/${carId}/slots?date=${date}`
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to load slots");
    }

    const slots = await res.json();
    updateUIState(slots);
    renderSlots(slots);

  } catch (err) {
    console.error("Error loading slots:", err);
    showError(err.message || "Failed to load slots.");
  }
}

async function toggleSlot(slot) {
  if (isLoading) return;
  isLoading = true;

  try {
    let res;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    if (slot._id) {
      // Maintenance slot → delete override
      res = await fetch(`/vendor/slots/${slot._id}/toggle`, {
        method: "PATCH"
      });
    } else {
      // Available slot → create maintenance override
      res = await fetch(`/vendor/slots/create-maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          date: isoDate,
          startTime: slot.startTime,
          endTime: slot.endTime
        })
      });
    }

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Toggle failed");
    }

    await loadSlotsForDate(isoDate);

  } catch (err) {
    console.error(err);
    showError(err.message || "Unable to update slot.");
  }

  isLoading = false;
}



//SLOT RENDERING
function renderSlots(slots) {
  const list = document.getElementById("slotsList");
  list.innerHTML = "";

  if (!slots.length) {
    list.innerHTML =
      `<div class="text-center text-muted small py-3">
        No slots available
      </div>`;
    return;
  }


  slots.forEach(slot => {
    const div = document.createElement("div");
    div.className = "slot-item";

    div.innerHTML = `
    <div class="slot-time">
      ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}
    </div>

    <div class="d-flex align-items-center gap-2">
      <span class="slot-status ${slot.status}">
        ${capitalize(slot.status)}
      </span>
    </div>
  `;

    if (slot.status !== "booked") {
      const button = document.createElement("button");
      button.className = `btn btn-sm btn-outline-${slot.status === "available" ? "danger" : "success"}`;
      button.textContent = slot.status === "available" ? "Block" : "Unblock";
      button.onclick = () => toggleSlot(slot);

      div.querySelector(".d-flex").appendChild(button);
    } else {
      const lock = document.createElement("i");
      lock.className = "fas fa-lock text-muted";
      div.querySelector(".d-flex").appendChild(lock);
    }

    list.appendChild(div);
  });

}


// Helpers 
function formatTime(time) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonText: 'OK'
  });
}

function updateUIState(slots) {
  const toggle = document.getElementById("dateAvailabilityToggle");
  const container = document.getElementById("slotsContainer");
  const message = document.getElementById("unavailableMessage");

  // Consider "Available" if there is at least one 'available' slot.
  const hasAvailable = slots.some(s => s.status === 'available');
  const hasBooked = slots.some(s => s.status === 'booked');

  // Update toggle checked state without triggering 'change' event
  toggle.checked = hasAvailable;

  // Visibility Logic
  if (hasAvailable || hasBooked) {
    container.style.display = "block";
    message.style.display = "none";
  } else {
    // All maintenance or empty (shouldn't be empty due to defaults)
    container.style.display = "none";
    message.style.display = "block";
  }
}
