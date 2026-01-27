document.addEventListener('DOMContentLoaded', function () {
    const otpInputs = document.querySelectorAll('.otp-input');
    const form = document.getElementById('otpForm');
    const errorDiv = document.getElementById('otpError');
    const resendBtn = document.getElementById('resendBtn');
    const timerSpan = document.getElementById('timer');
    const countdownSpan = document.getElementById('countdown');
    const email = document.getElementById('email').value;
    let countdown = 15;
    let timerInterval;

    // OTP input handling
    otpInputs.forEach((input, index) => {
        input.addEventListener("keyup", (e) => {
            const value = e.target.value;
            if (value.length === 1 && index < otpInputs.length - 1 && /[0-9]/.test(value)) {
                otpInputs[index + 1].focus();
            } else if (e.key === "Backspace" && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
        input.addEventListener("keypress", (e) => {
            if (!/[0-9]/.test(e.key)) e.preventDefault();
        });
        input.addEventListener("input", () => {
            errorDiv.style.display = "none";
        });
    });

    // Form submission with AJAX
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const otp = Array.from(otpInputs)
            .map((input) => input.value)
            .join("");

        if (otp.length !== 4) {
            errorDiv.style.display = "block";
            errorDiv.textContent = "Please enter all 4 digits";
            return;
        }

        $.ajax({
            type: "POST",
            url: "/verify-passForgot-otp",
            data: { email: email, otp: otp },
            success: function (response) {
                if (response.success) {
                    Swal.fire({
                        icon: "success",
                        title: "OTP Verified",
                        showConfirmButton: false,
                        timer: 1500,
                    }).then(() => {
                        window.location.href = `/reset-password?token=${response.resetToken}`;
                    });
                } else {
                    errorDiv.style.display = "block";
                    errorDiv.textContent = response.message;
                }
            },
            error: function (xhr) {
                errorDiv.style.display = "block";
                errorDiv.textContent = xhr.responseJSON?.message || "An error occurred";
            }
        });
    });

    // Timer function
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (countdown > 0) {
                countdown--;
                countdownSpan.textContent = countdown;
            } else {
                clearInterval(timerInterval);
                timerSpan.classList.add("d-none");
                resendBtn.classList.remove("d-none");
            }
        }, 1000);
    }

    // Start initial timer
    startTimer();

    // Resend OTP
    resendBtn.addEventListener("click", (e) => {
        e.preventDefault();

        // Show loading state
        Swal.fire({
            title: 'Sending OTP...',
            text: 'Please wait',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            type: "POST",
            url: "/resend-forget-otp",
            data: { email: email },
            success: function (response) {
                if (response.success) {
                    Swal.fire({
                        icon: "success",
                        title: "OTP Resent",
                        timer: 1500,
                    });
                    // Reset timer
                    countdown = 15;
                    countdownSpan.textContent = countdown;
                    timerSpan.classList.remove("d-none");
                    resendBtn.classList.add("d-none");
                    startTimer();
                    // Clear inputs
                    otpInputs.forEach(input => input.value = '');
                }
            },
            error: function (xhr) {
                Swal.fire({
                    icon: "error",
                    title: "Resend Failed",
                    text: xhr.responseJSON?.message || "Please try again",
                });
            }
        });
    });
});
