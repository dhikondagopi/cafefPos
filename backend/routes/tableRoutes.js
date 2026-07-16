const express = require("express");
const mongoose = require("mongoose");

const Table = require("../models/Table");
const Floor = require("../models/Floor");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const READ_ROLES = ["admin", "employee", "cashier"];
const ADMIN_ROLES = ["admin"];
const STATUS_UPDATE_ROLES = ["admin", "employee", "cashier"];

const VALID_STATUSES = [
  "available",
  "occupied",
  "payment_pending",
  "reserved",
  "inactive",
];

const VALID_SHAPES = ["square", "round", "rectangle", "circle"];

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
// This avoids authorize import conflicts between authMiddleware and roleMiddleware.
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

const getTableName = (table) => {
  return (
    table?.name ||
    table?.tableName ||
    table?.tableNumber ||
    table?.displayName ||
    "Table"
  );
};

const normalizeStatus = (status = "available") => {
  const value = String(status || "available").toLowerCase();

  if (VALID_STATUSES.includes(value)) {
    return value;
  }

  return "available";
};

const normalizeShape = (shape = "square") => {
  const value = String(shape || "square").toLowerCase();

  if (value === "rect") return "rectangle";
  if (value === "circular") return "round";

  if (VALID_SHAPES.includes(value)) {
    return value;
  }

  return "square";
};

const buildTablePayload = (body) => {
  const name = String(
    body.name || body.tableName || body.tableNumber || ""
  ).trim();

  const capacity = Number(body.capacity ?? body.seats ?? 2);

  const floor = body.floor || body.floorId;

  return {
    name,
    tableName: name,
    tableNumber: name,
    capacity,
    seats: capacity,
    floor,
    posX: Number(body.posX ?? body.x ?? 10),
    posY: Number(body.posY ?? body.y ?? 10),
    width: Number(body.width ?? 90),
    height: Number(body.height ?? 90),
    shape: normalizeShape(body.shape),
    status: normalizeStatus(body.status),
  };
};

const validateTablePayload = async (payload, res, tableId = null) => {
  if (!payload.name) {
    sendError(res, 400, "Table name is required");
    return false;
  }

  if (!payload.capacity || payload.capacity < 1) {
    sendError(res, 400, "Valid seating capacity is required");
    return false;
  }

  if (!payload.floor) {
    sendError(res, 400, "Floor is required");
    return false;
  }

  if (!mongoose.Types.ObjectId.isValid(payload.floor)) {
    sendError(res, 400, "Invalid floor id");
    return false;
  }

  const floorExists = await Floor.findById(payload.floor);

  if (!floorExists) {
    sendError(res, 404, "Selected floor does not exist");
    return false;
  }

  const duplicateQuery = {
    floor: payload.floor,
    name: { $regex: new RegExp(`^${payload.name}$`, "i") },
  };

  if (tableId) {
    duplicateQuery._id = { $ne: tableId };
  }

  const duplicateTable = await Table.findOne(duplicateQuery);

  if (duplicateTable) {
    sendError(res, 400, "Table already exists on this floor");
    return false;
  }

  return true;
};

const emitTableUpdate = (req, eventName, table) => {
  const io = req.app.get("io") || req.io;

  if (!io) return;

  io.emit(eventName, table);
  io.emit("table_updated", table);
  io.emit("table_status_updated", {
    tableId: table?._id || table?.id,
    status: table?.status,
    table,
  });
};

// @desc    Get all tables
// @route   GET /api/tables
// @access  Admin, Employee, Cashier
router.get("/", protect, allowRoles(...READ_ROLES), async (req, res) => {
  try {
    const { floor, floorId, status, includeInactive = "false", search = "" } =
      req.query;

    const query = {};

    if (floor || floorId) {
      query.floor = floor || floorId;
    }

    if (status && status !== "all") {
      query.status = normalizeStatus(status);
    }

    if (includeInactive !== "true") {
      query.status = query.status
        ? query.status
        : { $ne: "inactive" };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { tableName: { $regex: search, $options: "i" } },
        { tableNumber: { $regex: search, $options: "i" } },
      ];
    }

    const tables = await Table.find(query)
      .populate("floor", "name color isActive")
      .sort({ createdAt: 1, name: 1 })
      .lean();

    const formattedTables = tables.map((table) => ({
      ...table,
      displayName: getTableName(table),
    }));

    return sendSuccess(res, "Tables fetched successfully", {
      count: formattedTables.length,
      tables: formattedTables,
      data: formattedTables,
    });
  } catch (error) {
    console.error("Get tables error:", error);
    return sendError(res, 500, error.message || "Failed to fetch tables");
  }
});

// @desc    Get table summary
// @route   GET /api/tables/stats/summary
// @access  Admin, Employee, Cashier
router.get(
  "/stats/summary",
  protect,
  allowRoles(...READ_ROLES),
  async (req, res) => {
    try {
      const tables = await Table.find({}).lean();

      const summary = {
        total: tables.length,
        available: tables.filter((table) => table.status === "available").length,
        occupied: tables.filter((table) => table.status === "occupied").length,
        payment_pending: tables.filter(
          (table) => table.status === "payment_pending"
        ).length,
        reserved: tables.filter((table) => table.status === "reserved").length,
        inactive: tables.filter((table) => table.status === "inactive").length,
      };

      return sendSuccess(res, "Table summary fetched successfully", {
        summary,
        data: summary,
      });
    } catch (error) {
      console.error("Table summary error:", error);
      return sendError(res, 500, error.message || "Failed to fetch table summary");
    }
  }
);

// @desc    Get tables by floor
// @route   GET /api/tables/floor/:floorId
// @access  Admin, Employee, Cashier
router.get(
  "/floor/:floorId",
  protect,
  allowRoles(...READ_ROLES),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.floorId)) {
        return sendError(res, 400, "Invalid floor id");
      }

      const tables = await Table.find({ floor: req.params.floorId })
        .populate("floor", "name color isActive")
        .sort({ createdAt: 1, name: 1 })
        .lean();

      const formattedTables = tables.map((table) => ({
        ...table,
        displayName: getTableName(table),
      }));

      return sendSuccess(res, "Tables fetched successfully", {
        count: formattedTables.length,
        tables: formattedTables,
        data: formattedTables,
      });
    } catch (error) {
      console.error("Get tables by floor error:", error);
      return sendError(res, 500, error.message || "Failed to fetch floor tables");
    }
  }
);

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Admin, Employee, Cashier
router.get("/:id", protect, allowRoles(...READ_ROLES), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 400, "Invalid table id");
    }

    const table = await Table.findById(req.params.id)
      .populate("floor", "name color isActive")
      .lean();

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    return sendSuccess(res, "Table fetched successfully", {
      table: {
        ...table,
        displayName: getTableName(table),
      },
      data: {
        ...table,
        displayName: getTableName(table),
      },
    });
  } catch (error) {
    console.error("Get table error:", error);
    return sendError(res, 500, error.message || "Failed to fetch table");
  }
});

// @desc    Create table
// @route   POST /api/tables
// @access  Admin only
router.post("/", protect, allowRoles(...ADMIN_ROLES), async (req, res) => {
  try {
    const payload = buildTablePayload(req.body);

    const valid = await validateTablePayload(payload, res);

    if (!valid) return;

    const table = await Table.create(payload);

    const populatedTable = await Table.findById(table._id).populate(
      "floor",
      "name color isActive"
    );

    emitTableUpdate(req, "table_created", populatedTable);

    return sendSuccess(
      res,
      "Table created successfully",
      {
        table: populatedTable,
        data: populatedTable,
      },
      201
    );
  } catch (error) {
    console.error("Create table error:", error);
    return sendError(res, 500, error.message || "Failed to create table");
  }
});

// @desc    Update table layout/details
// @route   PUT /api/tables/:id
// @access  Admin only
router.put("/:id", protect, allowRoles(...ADMIN_ROLES), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 400, "Invalid table id");
    }

    const payload = buildTablePayload(req.body);

    const valid = await validateTablePayload(payload, res, req.params.id);

    if (!valid) return;

    const table = await Table.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate("floor", "name color isActive");

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    emitTableUpdate(req, "table_updated", table);

    return sendSuccess(res, "Table updated successfully", {
      table,
      data: table,
    });
  } catch (error) {
    console.error("Update table error:", error);
    return sendError(res, 500, error.message || "Failed to update table");
  }
});

// @desc    Patch table
// @route   PATCH /api/tables/:id
// @access  Admin only
router.patch("/:id", protect, allowRoles(...ADMIN_ROLES), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 400, "Invalid table id");
    }

    const existingTable = await Table.findById(req.params.id);

    if (!existingTable) {
      return sendError(res, 404, "Table not found");
    }

    const payload = {
      name:
        req.body.name ||
        req.body.tableName ||
        req.body.tableNumber ||
        existingTable.name,
      tableName:
        req.body.name ||
        req.body.tableName ||
        req.body.tableNumber ||
        existingTable.name,
      tableNumber:
        req.body.name ||
        req.body.tableName ||
        req.body.tableNumber ||
        existingTable.name,
      capacity:
        req.body.capacity !== undefined || req.body.seats !== undefined
          ? Number(req.body.capacity ?? req.body.seats)
          : existingTable.capacity,
      seats:
        req.body.capacity !== undefined || req.body.seats !== undefined
          ? Number(req.body.capacity ?? req.body.seats)
          : existingTable.seats || existingTable.capacity,
      floor: req.body.floor || req.body.floorId || existingTable.floor,
      posX:
        req.body.posX !== undefined || req.body.x !== undefined
          ? Number(req.body.posX ?? req.body.x)
          : existingTable.posX,
      posY:
        req.body.posY !== undefined || req.body.y !== undefined
          ? Number(req.body.posY ?? req.body.y)
          : existingTable.posY,
      width:
        req.body.width !== undefined ? Number(req.body.width) : existingTable.width,
      height:
        req.body.height !== undefined
          ? Number(req.body.height)
          : existingTable.height,
      shape: req.body.shape
        ? normalizeShape(req.body.shape)
        : existingTable.shape || "square",
      status: req.body.status
        ? normalizeStatus(req.body.status)
        : existingTable.status || "available",
    };

    const valid = await validateTablePayload(payload, res, req.params.id);

    if (!valid) return;

    const table = await Table.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate("floor", "name color isActive");

    emitTableUpdate(req, "table_updated", table);

    return sendSuccess(res, "Table updated successfully", {
      table,
      data: table,
    });
  } catch (error) {
    console.error("Patch table error:", error);
    return sendError(res, 500, error.message || "Failed to update table");
  }
});

// @desc    Update table status
// @route   PATCH /api/tables/:id/status
// @access  Admin, Employee, Cashier
router.patch(
  "/:id/status",
  protect,
  allowRoles(...STATUS_UPDATE_ROLES),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 400, "Invalid table id");
      }

      const status = normalizeStatus(req.body.status);

      const table = await Table.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      ).populate("floor", "name color isActive");

      if (!table) {
        return sendError(res, 404, "Table not found");
      }

      emitTableUpdate(req, "table_status_updated", table);

      return sendSuccess(res, "Table status updated successfully", {
        table,
        data: table,
      });
    } catch (error) {
      console.error("Update table status error:", error);
      return sendError(
        res,
        500,
        error.message || "Failed to update table status"
      );
    }
  }
);

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Admin only
router.delete("/:id", protect, allowRoles(...ADMIN_ROLES), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 400, "Invalid table id");
    }

    const table = await Table.findById(req.params.id);

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    await Table.deleteOne({ _id: req.params.id });

    const io = req.app.get("io") || req.io;

    if (io) {
      io.emit("table_deleted", { tableId: req.params.id });
      io.emit("table_updated", { tableId: req.params.id, deleted: true });
    }

    return sendSuccess(res, "Table deleted successfully", {
      deletedId: req.params.id,
    });
  } catch (error) {
    console.error("Delete table error:", error);
    return sendError(res, 500, error.message || "Failed to delete table");
  }
});

module.exports = router;