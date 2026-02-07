// These variables will be set by the EJS template inline script
// const carId and isApproved should be defined in the EJS file before loading this script

let currentDate = new Date();
let selectedDate = null;
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

    document.getElementById("dateAvailabilityToggle").onchange = (e) => {
        document.getElementById("slotsContainer").style.display =
            e.target.checked ? "block" : "none";

        document.getElementById("unavailableMessage").style.display =
            e.target.checked ? "none" : "block";
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

    selectedDate = date;
    const isoDate = date.toISOString().split("T")[0];

    document.getElementById('selectedDateDisplay').textContent =
        date.toDateString();

    document.getElementById('slotManagementPanel').style.display = 'block';

    await initSlotsForDate(isoDate);
    await loadSlotsForDate(isoDate);
}



//  API CALLS
async function initSlotsForDate(date) {
  await fetch(`/vendor/cars/${carId}/slots/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date })
  });
}

async function loadSlotsForDate(date) {
  const res = await fetch(
    `/vendor/cars/${carId}/slots?date=${date}`
  );
  const slots = await res.json();
  renderSlots(slots);
}

async function toggleSlot(slotId) {
  const res = await fetch(`/vendor/slots/${slotId}/toggle`, {
    method: "PATCH"
  });

  const data = await res.json();
  if (data.success) {
    loadSlotsForDate(selectedDate.toISOString().split("T")[0]);
  }
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
          ${slot.status}
        </span>

        ${slot.status === "booked"
          ? `<i class="fas fa-lock text-muted"></i>`
          : `
            <button class="btn btn-sm btn-outline-${slot.status === "available" ? "danger" : "success"}"
              onclick="toggleSlot('${slot._id}')">
              ${slot.status === "available" ? "Block" : "Unblock"}
            </button>
          `}
      </div>
    `;

    list.appendChild(div);
  });
}

function formatTime(time) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}
