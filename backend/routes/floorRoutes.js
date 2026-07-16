const express = require("express");
const Floor = require("../models/Floor");
const Table = require("../models/Table");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const READ_ROLES = ["admin", "employee", "cashier"];
const ADMIN_ROLES = ["admin"];

const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// Local role checker.
// This avoids "authorize is not a function" problems from mixed middleware files.
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "User not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Role '${req.user.role}' is not allowed to access this route`
      );
    }

    next();
  };
};

const normalizeBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
};

const getFloorName = (floor) => {
  return floor?.name || floor?.floorName || floor?.title || "Unnamed Floor";
};

const buildFloorPayload = (body) => {
  const name = String(body.name || body.floorName || body.title || "").trim();

  return {
    name,
    color: String(body.color || "#6366f1").trim(),
    isActive: normalizeBoolean(body.isActive ?? body.active, true),
    description:
      body.description !== undefined
        ? String(body.description || "").trim()
        : undefined,
    sortOrder:
      body.sortOrder !== undefined ? Number(body.sortOrder || 0) : undefined,
  };
};

const cleanPayload = (payload) => {
  const cleaned = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });

  return cleaned;
};

// @route   GET /api/floors
// @desc    Get all floors
// @access  Admin, Employee, Cashier
router.get("/", protect, allowRoles(...READ_ROLES), async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";

    const query = includeInactive ? {} : { isActive: { $ne: false } };

    const floors = await Floor.find(query)
      .sort({ sortOrder: 1, createdAt: 1, name: 1 })
      .lean();

    const floorIds = floors.map((floor) => floor._id);

    const tables = await Table.find({ floor: { $in: floorIds } })
      .select("name tableName tableNumber capacity seats status floor")
      .lean();

    const formattedFloors = floors.map((floor) => {
      const floorTables = tables.filter(
        (table) => String(table.floor) === String(floor._id)
      );

      return {
        ...floor,
        displayName: getFloorName(floor),
        tableCount: floorTables.length,
        availableTables: floorTables.filter(
          (table) => table.status === "available"
        ).length,
        occupiedTables: floorTables.filter(
          (table) => table.status === "occupied"
        ).length,
        paymentPendingTables: floorTables.filter(
          (table) => table.status === "payment_pending"
        ).length,
        reservedTables: floorTables.filter(
          (table) => table.status === "reserved"
        ).length,
      };
    });

    return sendSuccess(res, "Floors fetched successfully", {
      count: formattedFloors.length,
      floors: formattedFloors,
      data: formattedFloors,
    });
  } catch (error) {
    console.error("Get floors error:", error);
    return sendError(res, 500, error.message || "Failed to fetch floors");
  }
});

// @route   GET /api/floors/:id
// @desc    Get one floor with its tables
// @access  Admin, Employee, Cashier
router.get("/:id", protect, allowRoles(...READ_ROLES), async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id).lean();

    if (!floor) {
      return sendError(res, 404, "Floor not found");
    }

    const tables = await Table.find({ floor: floor._id })
      .sort({ createdAt: 1, name: 1 })
      .lean();

    const formattedFloor = {
      ...floor,
      displayName: getFloorName(floor),
      tables,
    };

    return sendSuccess(res, "Floor fetched successfully", {
      floor: formattedFloor,
      data: formattedFloor,
    });
  } catch (error) {
    console.error("Get floor error:", error);
    return sendError(res, 500, error.message || "Failed to fetch floor");
  }
});

// @route   POST /api/floors
// @desc    Create floor
// @access  Admin only
router.post("/", protect, allowRoles(...ADMIN_ROLES), async (req, res) => {
  try {
    const payload = cleanPayload(buildFloorPayload(req.body));

    if (!payload.name) {
      return sendError(res, 400, "Floor name is required");
    }

    const existingFloor = await Floor.findOne({
      name: { $regex: new RegExp(`^${payload.name}$`, "i") },
    });

    if (existingFloor) {
      return sendError(res, 400, "Floor name already exists");
    }

    const floor = await Floor.create(payload);

    const io = req.app.get("io") || req.io;

    if (io) {
      io.emit("floor_created", floor);
      io.emit("floor_updated", floor);
    }

    return sendSuccess(
      res,
      "Floor created successfully",
      {
        floor,
        data: floor,
      },
      201
    );
  } catch (error) {
    console.error("Create floor error:", error);
    return sendError(res, 500, error.message || "Failed to create floor");
  }
});

// @route   PUT /api/floors/:id
// @desc    Update floor
// @access  Admin only
router.put("/:id", protect, allowRoles(...ADMIN_ROLES), async (req, res) => {
  try {
    const payload = cleanPayload(buildFloorPayload(req.body));

    if (!payload.name) {
      return sendError(res, 400, "Floor name is required");
    }

    const duplicateFloor = await Floor.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${payload.name}$`, "i") },
    });

    if (duplicateFloor) {
      return sendError(res, 400, "Another floor with this name already exists");
    }

    const floor = await Floor.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!floor) {
      return sendError(res, 404, "Floor not found");
    }

    const io = req.app.get("io") || req.io;

    if (io) {
      io.emit("floor_updated", floor);
    }

    return sendSuccess(res, "Floor updated successfully", {
      floor,
      data: floor,
    });
  } catch (error) {
    console.error("Update floor error:", error);
    return sendError(res, 500, error.message || "Failed to update floor");
  }
});

// @route   PATCH /api/floors/:id
// @desc    Partially update floor
// @access  Admin only
router.patch("/:id", protect, allowRoles(...ADMIN_ROLES), async (req, res) => {
  try {
    const payload = cleanPayload(buildFloorPayload(req.body));

    const floor = await Floor.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!floor) {
      return sendError(res, 404, "Floor not found");
    }

    const io = req.app.get("io") || req.io;

    if (io) {
      io.emit("floor_updated", floor);
    }

    return sendSuccess(res, "Floor updated successfully", {
      floor,
      data: floor,
    });
  } catch (error) {
    console.error("Patch floor error:", error);
    return sendError(res, 500, error.message || "Failed to update floor");
  }
});

// @route   DELETE /api/floors/:id
// @desc    Delete floor
// @access  Admin only
router.delete("/:id", protect, allowRoles(...ADMIN_ROLES), async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);

    if (!floor) {
      return sendError(res, 404, "Floor not found");
    }

    const tablesCount = await Table.countDocuments({ floor: req.params.id });

    if (tablesCount > 0) {
      return sendError(
        res,
        400,
        `Cannot delete floor: it has ${tablesCount} table(s) configured. Delete or move tables first.`
      );
    }

    await Floor.deleteOne({ _id: req.params.id });

    const io = req.app.get("io") || req.io;

    if (io) {
      io.emit("floor_deleted", { floorId: req.params.id });
      io.emit("floor_updated", { floorId: req.params.id, deleted: true });
    }

    return sendSuccess(res, "Floor deleted successfully", {
      deletedId: req.params.id,
    });
  } catch (error) {
    console.error("Delete floor error:", error);
    return sendError(res, 500, error.message || "Failed to delete floor");
  }
});

module.exports = router;