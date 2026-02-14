// Image Gallery and Zoom Functionality
class ImageZoom {
    constructor() {
        this.currentImageIndex = 0;
        this.images = [];
        this.zoomLevel = 1;
        this.maxZoom = 3;
        this.minZoom = 1;
        this.zoomStep = 0.3;
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;

        this.init();
    }

    init() {
        // Collect all car images
        const thumbItems = document.querySelectorAll('.thumb-item img');
        this.images = Array.from(thumbItems).map(img => img.src);

        // If no thumbnails, get main image
        if (this.images.length === 0) {
            const mainImg = document.getElementById('mainImage');
            if (mainImg) {
                this.images = [mainImg.src];
            }
        }

        this.createZoomModal();
        this.attachEventListeners();
    }

    createZoomModal() {
        const modal = document.createElement('div');
        modal.id = 'imageZoomModal';
        modal.className = 'zoom-modal';
        modal.innerHTML = `
            <div class="zoom-modal-overlay"></div>
            <div class="zoom-modal-content">
                <button class="zoom-close" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="zoom-controls">
                    <button class="zoom-btn zoom-in" aria-label="Zoom In">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <span class="zoom-level-display">100%</span>
                    <button class="zoom-btn zoom-out" aria-label="Zoom Out">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <button class="zoom-btn zoom-reset" aria-label="Reset Zoom">
                        <i class="fas fa-compress"></i>
                    </button>
                </div>
                
                <div class="zoom-image-container">
                    <img id="zoomedImage" src="" alt="Zoomed view" draggable="false">
                </div>
                
                ${this.images.length > 1 ? `
                    <button class="zoom-nav zoom-prev" aria-label="Previous Image">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="zoom-nav zoom-next" aria-label="Next Image">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    
                    <div class="zoom-thumbnails">
                        ${this.images.map((img, index) => `
                            <div class="zoom-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
                                <img src="${img}" alt="Thumbnail ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);
    }

    attachEventListeners() {
        // Main image click to open zoom
        const mainImage = document.getElementById('mainImage');
        const zoomContainer = document.querySelector('.zoom-container');

        if (mainImage) {
            mainImage.addEventListener('click', () => this.openZoom(0));
        }

        // Thumbnail clicks
        document.querySelectorAll('.thumb-item').forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                this.currentImageIndex = index;
            });
        });

        // Modal controls
        const modal = document.getElementById('imageZoomModal');
        const closeBtn = modal.querySelector('.zoom-close');
        const overlay = modal.querySelector('.zoom-modal-overlay');
        const zoomInBtn = modal.querySelector('.zoom-in');
        const zoomOutBtn = modal.querySelector('.zoom-out');
        const resetBtn = modal.querySelector('.zoom-reset');
        const prevBtn = modal.querySelector('.zoom-prev');
        const nextBtn = modal.querySelector('.zoom-next');
        const zoomedImage = document.getElementById('zoomedImage');

        // Close modal
        closeBtn.addEventListener('click', () => this.closeZoom());
        overlay.addEventListener('click', () => this.closeZoom());

        // Zoom controls
        zoomInBtn.addEventListener('click', () => this.zoom(1));
        zoomOutBtn.addEventListener('click', () => this.zoom(-1));
        resetBtn.addEventListener('click', () => this.resetZoom());

        // Navigation
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigate(1));

        // Thumbnail navigation
        modal.querySelectorAll('.zoom-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.showImage(index);
            });
        });

        // Mouse wheel zoom
        zoomedImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            this.zoom(delta * 0.5);
        });

        // Pan functionality
        zoomedImage.addEventListener('mousedown', (e) => this.startPan(e));
        zoomedImage.addEventListener('mousemove', (e) => this.pan(e));
        zoomedImage.addEventListener('mouseup', () => this.endPan());
        zoomedImage.addEventListener('mouseleave', () => this.endPan());

        // Touch support for mobile
        zoomedImage.addEventListener('touchstart', (e) => this.startPan(e.touches[0]));
        zoomedImage.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.pan(e.touches[0]);
        });
        zoomedImage.addEventListener('touchend', () => this.endPan());

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('active')) return;

            switch (e.key) {
                case 'Escape':
                    this.closeZoom();
                    break;
                case 'ArrowLeft':
                    this.navigate(-1);
                    break;
                case 'ArrowRight':
                    this.navigate(1);
                    break;
                case '+':
                case '=':
                    this.zoom(1);
                    break;
                case '-':
                    this.zoom(-1);
                    break;
                case '0':
                    this.resetZoom();
                    break;
            }
        });
    }

    openZoom(index = 0) {
        const modal = document.getElementById('imageZoomModal');
        this.currentImageIndex = index;
        this.showImage(index);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeZoom() {
        const modal = document.getElementById('imageZoomModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.resetZoom();
    }

    showImage(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentImageIndex = index;
        const zoomedImage = document.getElementById('zoomedImage');
        zoomedImage.src = this.images[index];

        // Update thumbnail active state
        document.querySelectorAll('.zoom-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        this.resetZoom();
    }

    navigate(direction) {
        let newIndex = this.currentImageIndex + direction;

        // Wrap around
        if (newIndex < 0) newIndex = this.images.length - 1;
        if (newIndex >= this.images.length) newIndex = 0;

        this.showImage(newIndex);
    }

    zoom(delta) {
        const newZoom = this.zoomLevel + (delta * this.zoomStep);
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.updateZoom();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateZoom();
    }

    updateZoom() {
        const zoomedImage = document.getElementById('zoomedImage');
        const levelDisplay = document.querySelector('.zoom-level-display');

        zoomedImage.style.transform = `scale(${this.zoomLevel}) translate(${this.translateX}px, ${this.translateY}px)`;
        levelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;

        // Change cursor based on zoom level
        zoomedImage.style.cursor = this.zoomLevel > 1 ? 'grab' : 'zoom-in';
    }

    startPan(e) {
        if (this.zoomLevel <= 1) return;

        this.isPanning = true;
        this.startX = e.clientX - this.translateX;
        this.startY = e.clientY - this.translateY;

        const zoomedImage = document.getElementById('zoomedImage');
        zoomedImage.style.cursor = 'grabbing';
    }

    pan(e) {
        if (!this.isPanning) return;

        e.preventDefault();
        this.translateX = e.clientX - this.startX;
        this.translateY = e.clientY - this.startY;
        this.updateZoom();
    }

    endPan() {
        this.isPanning = false;
        const zoomedImage = document.getElementById('zoomedImage');
        zoomedImage.style.cursor = this.zoomLevel > 1 ? 'grab' : 'zoom-in';
    }
}

// Thumbnail gallery functionality
function changeImage(element, imageSrc) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = imageSrc;

    // Update active thumbnail
    document.querySelectorAll('.thumb-item').forEach(thumb => {
        thumb.classList.remove('active');
    });
    element.classList.add('active');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Initialize zoom functionality
    const imageZoom = new ImageZoom();

    // Add click hint to main image
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        const hint = document.createElement('div');
        hint.className = 'zoom-hint';
        hint.innerHTML = '<i class="fas fa-search-plus"></i> Click to zoom';
        mainImage.parentElement.appendChild(hint);

        // Show hint on hover
        mainImage.parentElement.addEventListener('mouseenter', () => {
            hint.style.opacity = '1';
        });

        mainImage.parentElement.addEventListener('mouseleave', () => {
            hint.style.opacity = '0';
        });
    }
});
