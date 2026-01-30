//search functionality

const searchInput = document.getElementById('searchInput');
const carTableBody = document.getElementById('carTableBody');
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = carTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const model = row.cells[1].textContent.toLowerCase();
        const regNumber = row.cells[3].textContent.toLowerCase();
        if (model.includes(searchTerm) || regNumber.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Smooth Scrolling
document.documentElement.style.scrollBehavior = 'smooth';
