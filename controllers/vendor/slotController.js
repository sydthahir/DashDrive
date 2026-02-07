const slotService = require("../../services/slotService")

exports.initSlotsForDate = async (req, res) => {
  try {
    const { carId } = req.params;
    const { date } = req.body;
    const vendorId = req.vendor._id;

    await slotService.initSlotsForDay({ carId, vendorId, date });
    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSlotsForDate = async (req, res) => {
  try {
    const { carId } = req.params;
    const { date } = req.query;

    const slots = await slotService.getSlotsByDate({ carId, date });
    res.json(slots);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await slotService.toggleSlotStatus(slotId);
    res.json({ success: true, status: slot.status });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};