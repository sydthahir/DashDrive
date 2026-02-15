let cropper = null;
let currentInput = null;

document.addEventListener("DOMContentLoaded", function () {

  const cropperModalEl = document.getElementById("cropperModal");
  const cropperImage = document.getElementById("cropperImage");
  const cropImageBtn = document.getElementById("cropImageBtn");

 
  document.body.appendChild(cropperModalEl);

  const cropperModal = new bootstrap.Modal(cropperModalEl);

  // Handle image select
  document.querySelectorAll(".car-image-input").forEach(input => {
    input.addEventListener("change", function (e) {

      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        e.target.value = "";
        return;
      }

      currentInput = e.target;

      const reader = new FileReader();
      reader.onload = function (event) {

        cropperImage.src = event.target.result;
        cropperModal.show();

      };

      reader.readAsDataURL(file);
    });
  });

  // Initialize cropper AFTER modal is shown
  cropperModalEl.addEventListener("shown.bs.modal", function () {

    if (cropper) {
      cropper.destroy();
      cropper = null;
    }

    cropper = new Cropper(cropperImage, {
      aspectRatio: 16 / 9,
      viewMode: 1,
      autoCropArea: 1,
      responsive: true
    });

  });

  // Destroy cropper when modal closes
  cropperModalEl.addEventListener("hidden.bs.modal", function () {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  });

  // Crop button
  cropImageBtn.addEventListener("click", function () {

    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width: 800,
      height: 600
    });

    canvas.toBlob(blob => {

      const file = new File([blob], "cropped.jpg", {
        type: "image/jpeg"
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      currentInput.files = dataTransfer.files;

      const box = currentInput.closest(".image-upload-box");
      const preview = box.querySelector(".image-preview");

      preview.src = canvas.toDataURL();
      preview.style.display = "block";
      box.classList.add("has-image");

      cropperModal.hide();

    }, "image/jpeg", 0.9);

  });

});
