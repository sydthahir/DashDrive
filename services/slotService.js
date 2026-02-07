const slot = require("../models/slotSchema")
const { generateDaySlots } = require("../utils/slotGenerator")


exports.initSlotsForDay = async ({ carId, vendorId, date }) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);


    // Prevent past dates
  if (day < new Date().setHours(0,0,0,0)) {
    throw new Error("Cannot create slots for past dates");
  }
  //Check existing
  const exists = await slot.findOne({ carId, date: day });
  if (exists) return;

  const slots = generateDaySlots().map(s => ({
    carId,
    vendorId,
    date: day,
    startTime: s.start,
    endTime: s.end
  }));

  await slot.insertMany(slots);
};



exports.getSlotsByDate = async ({ carId, date }) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  return Slot.find({ carId, date: day }).sort({ startTime: 1 });
};

exports.toggleSlotStatus = async (slotId) => {
  const slot = await Slot.findById(slotId);
  if (!slot) throw new Error("Slot not found");

  if (slot.status === "booked") {
    throw new Error("Booked slot cannot be modified");
  }

  slot.status = slot.status === "available" ? "blocked" : "available";
  await slot.save();

  return slot;
};