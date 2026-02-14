const slotService = require("../../services/slotService")
const Car = require("../../models/carSchema")
const Slot = require("../../models/slotSchema")

const addSlot = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const { carId } = req.params;
    const vendorId = req.vendor._id;


    //Check the car belongs to this vendor
    const car = await Car.findOne({ _id: carId, vendorId });

    if (!car) {
      return res.status(403).json({
        message: "You are not allowed to add slots for this car"
      });
    }

    if (car.status !== "approved") {
      return res.status(400).json({
        message: "Slots can only be added after approval"
      });
    }

    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);
    // Create slot
    await Slot.create({
      carId,
      vendorId,
      date: slotDate,
      startTime,
      endTime
    });

    res.status(201).json({
      message: "Slot added successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getSlots = async (req, res) => {
  try {
    const { carId } = req.params;
    const { date } = req.query;
    const vendorId = req.vendor._id;

    //Normalizing Date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);


    // Check if the car is approved 
    const car = await Car.findOne({ _id: carId, vendorId });
    if (!car || car.status !== "approved") {
      return res.json([]);
    }

    //  Generate default slots in memory
    const defaultSlots = [];

    for (let hour = 10; hour < 18; hour += 2) {
      defaultSlots.push({
        startTime: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 2).toString().padStart(2, "0")}:00`,
        status: "available"
      });
    }

    //  Fetch only overrides (blocked + booked)
    const overrides = await Slot.find({
      carId,
      vendorId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });


    // Merge overrides with default
    const finalSlots = defaultSlots.map(slot => {
      const override = overrides.find(o =>
        o.startTime === slot.startTime &&
        o.endTime === slot.endTime
      );

      if (override) {
        return {
          _id: override._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: override.status
        };
      }

      return slot;
    });

    res.json(finalSlots);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const vendorId = req.vendor._id;

    const slot = await Slot.findOne({ _id: slotId, vendorId });

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    if (slot.status === "booked") {
      return res.status(400).json({ success: false, message: "Cannot modify booked slot" });
    }

    await Slot.deleteOne({ _id: slotId });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



const toggleDateSlots = async (req, res) => {
  try {
    const { carId } = req.params;
    const { date, status } = req.body; //  'available' or 'maintenance'
    const vendorId = req.vendor._id;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const car = await Car.findOne({ _id: carId, vendorId });
    if (!car) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (status === "maintenance") {
      // Block whole day 
      const slotsToCreate = [];

      for (let hour = 10; hour < 18; hour += 2) {
        slotsToCreate.push({
          carId,
          vendorId,
          date: startOfDay,
          startTime: `${hour.toString().padStart(2, "0")}:00`,
          endTime: `${(hour + 2).toString().padStart(2, "0")}:00`,
          status: "maintenance"
        });
      }

      await Slot.insertMany(slotsToCreate, { ordered: false });

    } else {
      // Unblock whole day → remove maintenance records only
      await Slot.deleteMany({
        carId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "maintenance"
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

 const createMaintenanceSlot = async (req, res) => {
  try {
    const { carId, date, startTime, endTime } = req.body;
    const vendorId = req.vendor._id;

    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    await Slot.create({
      carId,
      vendorId,
      date: slotDate,
      startTime,
      endTime,
      status: "maintenance"
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



// User slot management
  const getUserSlots = async (req, res) => {
  try {
    const { carId } = req.params;
    const { date } = req.query;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const car = await Car.findOne({ _id: carId, status: "approved" });

    if (!car) {
      return res.json([]);
    }

    // Generate default slots
    const defaultSlots = [];
    for (let hour = 10; hour < 18; hour += 2) {
      defaultSlots.push({
        startTime: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 2).toString().padStart(2, "0")}:00`,
        status: "available"
      });
    }

    // Fetch overrides
    const overrides = await Slot.find({
      carId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Merge
    const finalSlots = defaultSlots.map(slot => {
      const override = overrides.find(o =>
        o.startTime === slot.startTime &&
        o.endTime === slot.endTime
      );

      if (override) {
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: override.status
        };
      }

      return slot;
    });

    res.json(finalSlots);

  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};





module.exports = {
  createMaintenanceSlot,
  toggleDateSlots,
  toggleSlot,
  getSlots,
  addSlot,
  getUserSlots

}