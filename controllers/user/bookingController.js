const Car = require("../../models/carSchema");
const Booking = require("../../models/bookingSchema");
const Slot = require("../../models/slotSchema")

//Load booking details
const loadBookingDetails = async (req, res) => {
    try {
        const { carId } = req.params;
        const { date, time } = req.query;

        //Validation
        if (!date || !time) {
            return res.redirect(`/cars/${carId}`);
        }

        // Split time into start and end 
        const [startTime, endTime] = time.split("-");

        if (!startTime || !endTime) {
            console.log("Invalid time format");
            return res.redirect(`/cars/${carId}`);
        }

        const car = await Car.findById(carId)
            .populate("brand")
            .populate("vendorId");

        if (!car) {
            return res.redirect("/cars");
        }

        // Check if slot already booked 
        const existingBooking = await Booking.findOne({
            car: carId,
            bookingDate: new Date(date),
            startTime: startTime,
            paymentStatus: "paid"
        });

        if (existingBooking) {
            console.log("Slot already booked");
            return res.redirect(
                `/cars/${carId}?error=slot-already-booked`
            );
        }

        
        const vendorAddress = car.vendorId?.businessAddress || null;


        //render bookingDetails page
        res.render("bookingDetails", {
            car,
            user: req.user,
            selectedDate: date,
            startTime,
            endTime,
            vendorAddress
        });

    } catch (error) {
        console.error("Booking Details Error:", error);
        res.redirect("/pageNotFound");
    }
};

//Create booking
const createBooking = async (req, res) => {
    try {
        const {
            carId,
            vendorId,
            date,
            startTime,
            endTime,
            fullName,
            email,
            phone,
            altPhone,
            pickupLocation,
            specialRequests,
        } = req.body;

        console.log("success", req.body);

        //Basic Validation
        if (!carId || !vendorId || !date || !startTime || !endTime) {
            return res.redirect("/cars");
        }
        // Convert date 
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        //Prevent Double booking
        const existingBooking = await Booking.findOne({
            car: carId,
            bookingDate,
            startTime,
            paymentStatus: { $in: ["pending", "paid"] }
        });

        if (existingBooking) {
            return res.redirect(`/cars/${carId}?error=slot-unavailable`);
        }

        //Verify car exists
        const car = await Car.findById(carId);
        if (!car) {
            return res.redirect("/cars");
        }



        //Create Booking
        const newBooking = await Booking.create({
            userId: req.user._id,
            vendorId: vendorId,
            carId: carId,
            bookingDate,
            startTime,
            endTime,
            fullName,
            email,
            contactNumber: phone,
            altPhone,
            pickupLocation,
            specialRequests,
            paymentStatus: "pending",
            status: "confirmed"
        });

        console.log("Booking created:", newBooking._id);

        // Mark slot as booked
        await Slot.findOneAndUpdate(
            {
                carId,
                date: bookingDate,
                startTime,
                endTime
            },
            {
                $set: {
                    vendorId,
                    status: "booked"
                }
            },
            {
                upsert: true
            }
        );


        //Redirect to confirmation page
        res.redirect(`/bookings/confirmation/${newBooking._id}`);

    } catch (error) {
        console.error("Create Booking Error:", error);
        res.redirect("/pageNotFound");
    }
}

//Load booking confirmation
const loadBookingConfirmation = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate("carId")
            .populate("vendorId")
            .populate("userId")

        if (!booking) {
            return res.redirect("/home");
        }

        res.render("bookingConfirmation", { booking });

    } catch (error) {
        console.error(error, "error while loading success page");
        res.redirect("/pageNotFound");
    }
}


//View booking details
const viewBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate("carId")
            .populate("vendorId")
            .populate({
                path: "carId",
                populate: {
                    path: "brand",
                    model: "Brand"
                }
            })
            .populate("userId")

        if (!booking) {
            return res.redirect("/pageNotFound");
        }

        // Check if the booking belongs to the logged-in user
        if (booking.userId._id.toString() !== req.user._id.toString()) {
            return res.redirect("/pageNotFound");
        }

        res.render("bookingDetailsView", { booking });

    } catch (error) {
        console.error("View Booking Error:", error);
        res.redirect("/pageNotFound");
    }
}

// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // Check if user is authorized
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        // Check if booking is already cancelled
        if (booking.status === "cancelled") {
            return res.status(400).json({ success: false, message: "Booking is already cancelled" });
        }

        // Cannot cancel if completed
        if (booking.status === "completed") {
            return res.status(400).json({ success: false, message: "Cannot cancel a completed booking" });
        }

        // Update booking status
        booking.status = "cancelled";
        await booking.save();

        // Release the slot if applicable (optional, depending on business logic)
        await Slot.findOneAndUpdate(
            {
                carId: booking.carId,
                date: booking.bookingDate,
                startTime: booking.startTime
            },
            {
                $set: { status: "available" },
                $unset: { vendorId: "" }
            }
        );

        return res.json({ success: true, message: "Booking cancelled successfully" });

    } catch (error) {
        console.error("Cancel Booking Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}


module.exports = {
    loadBookingDetails,
    createBooking,
    loadBookingConfirmation,
    viewBooking,
    cancelBooking
}
