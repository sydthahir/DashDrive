const car = require("../../models/carSchema")
const uploadFile = require("../../utils/s3");


const loadCarForm = async (req, res) => {
    try {


        const carBrands = [
            "Audi",
            "Bentley",
            "BMW",
            "Ford",
            "Kia",
            "Land Rover",
            "Mercedes",
            "Toyota",
            "Volkswagen",
            "Volvo"
        ];
        const Features = ["SportEdition", "Petrol", "GPS", "Leather Seats"]
        res.render("registerCar", {
            title: "Register New Car",
            carBrands: carBrands,
            features: Features,
            daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            timeSlots: ["9:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 1:00 PM", "2:00 PM - 3:00 PM", "3:00 PM - 4:00 PM", "4:00 PM - 5:00 PM"],

        });
    } catch (error) {
        console.error("Error loading car form:", error);
        res.redirect("/page-error");
    }
};
const registerCar = async (req, res) => {
    try {
        const imageUrl = await uploadFile(req.file);

        const { brand, model, year, registerationNumber, color, mileage, features, chargePerSlot, description } = req.body

        const newCar = new car({
            vendor: req.vendor.id,
            brand,
            model,
            year,
            registerationNumber,
            color,
            mileage,
            features,
            chargePerSlot,
            securityDeposit,
            availableDays,
            description,
            image: imageUrl,

        })

        await newCar.save()
        console.log("car registered");

        console.log("Uploaded image URL:", imageUrl);
        res.redirect("/vendor/cars?success=Car registered successfully");

    } catch (error) {
        console.error("Error while registering car:", error);
        res.redirect("/page-error");
    }

}

const listCars = async (req, res) => {
    try {
        // Use req.user.id from JWT
        const cars = await car.find({ vendor: req.vendor.id }).lean();
        res.render("carList", {
            title: "My Cars",
            cars,
            query: req.query,
        });
    } catch (error) {
        console.error("Error listing cars:", error);
        res.redirect("/page-error?error=" + encodeURIComponent(error.message || "Failed to list cars"));
    }
};












module.exports = {
    loadCarForm,
    registerCar,
    listCars
}