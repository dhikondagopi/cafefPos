const express = require("express");
const mongoose = require("mongoose");
const Table = require("../models/Table");
const Floor = require("../models/Floor");
const Order = require("../models/Order");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const READ_ROLES = ["admin", "employee", "cashier"];
const ADMIN_ROLES = ["admin"];

const TABLE_STATUSES = [
  "available",
  "occupied",
  "payment_pending",
  "reserved",
  "inactive",
];

const TABLE_SHAPES = ["square", "round", "rectangle", "circle"];

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

const getTableDisplayName = (table) => {
  return (
    table?.name ||
    table?.tableName ||
    table?.tableNumber ||
    table?.number ||
    "Table"
  );
};

const normalizeStatus = (status = "available") => {
  const normalized = String(status || "available").toLowerCase();

  if (TABLE_STATUSES.includes(normalized)) {
    return normalized;
  }

  return "available";
};

const normalizeShape = (shape = "square") => {
  const normalized = String(shape || "square").toLowerCase();

  if (normalized === "rect") return "rectangle";
  if (normalized === "circular") return "round";

  if (TABLE_SHAPES.includes(normalized)) {
    return normalized;
  }

  return "square";
};

const buildTablePayload = (body) => {
  const payload = {};

  if (body.name !== undefined) payload.name = String(body.name).trim();
  if (body.tableName !== undefined && !payload.name) {
    payload.name = String(body.tableName).trim();
  }
  if (body.tableNumber !== undefined && !payload.name) {
    payload.name = String(body.tableNumber).trim();
  }

  if (body.capacity !== undefined || body.seats !== undefined) {
    payload.capacity = Number(body.capacity ?? body.seats ?? 2);
  }

  if (body.floor !== undefined || body.floorId !== undefined) {
    payload.floor = body.floor || body.floorId;
  }

  if (body.status !== undefined) {
    payload.status = normalizeStatus(body.status);
  }

  if (body.shape !== undefined) {
    payload.shape = normalizeShape(body.shape);
  }

  if (body.posX !== undefined || body.x !== undefined) {
    payload.posX = Number(body.posX ?? body.x ?? 10);
  }

  if (body.posY !== undefined || body.y !== undefined) {
    payload.posY = Number(body.posY ?? body.y ?? 10);
  }

  if (body.width !== undefined) {
    payload.width = Number(body.width || 90);
  }

  if (body.height !== undefined) {
    payload.height = Number(body.height || 90);
  }

  if (body.isActive !== undefined || body.active !== undefined) {
    payload.isActive = body.isActive ?? body.active;
  }

  return payload;
};

const emitTableUpdate = (req, table, eventName = "table_updated") => {
  const io = req.app.get("io");

  if (io) {
    io.emit(eventName, table);
    io.emit("table_status_updated", {
      tableId: table._id || table.id,
      status: table.status,
      table,
    });
  }
};

// @route   GET /api/tables
// @desc    Get all tables for POS/admin
// @access  Admin, Employee, Cashier
router.get("/", protect, authorize(...READ_ROLES), async (req, res) => {
  try {
    const {
      floor,
      floorId,
      status,
      includeInactive = "false",
      search = "",
    } = req.query;

    const query = {};

    if (floor || floorId) {
      query.floor = floor || floorId;
    }

    if (status && status !== "all") {
      query.status = normalizeStatus(status);
    }

    if (includeInactive !== "true") {
      query.status = { ...(query.status ? { $eq: query.status } : {}), $ne: "inactive" };
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

    const activeOrderTableIds = await Order.find({
      status: { $in: ["draft", "sent_to_kitchen"] },
    })
      .select("table status kitchenStatus total orderNumber")
      .lean();

    const orderMap = new Map();

    activeOrderTableIds.forEach((order) => {
      if (order.table) {
        orderMap.set(String(order.table), order);
      }
    });

    const formattedTables = tables.map((table) => ({
      ...table,
      displayName: getTableDisplayName(table),
      activeOrder: orderMap.get(String(table._id)) || null,
    }));

    return sendSuccess(res, "Tables fetched successfully", {
      count: formattedTables.length,
      tables: formattedTables,
      data: formattedTables,
    });
  } catch (error) {
    console.error("Get tables error:", error);
    return sendError(res, 500, "Failed to fetch tables");
  }
});

// @route   GET /api/tables/stats/summary
// @desc    Get table status summary
// @access  Admin, Employee, Cashier
router.get(
  "/stats/summary",
  protect,
  authorize(...READ_ROLES),
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
      return sendError(res, 500, "Failed to fetch table summary");
    }
  }
);

// @route   GET /api/tables/:id
// @desc    Get single table
// @access  Admin, Employee, Cashier
router.get("/:id", protect, authorize(...READ_ROLES), async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate("floor", "name color isActive")
      .lean();

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    const activeOrder = await Order.findOne({
      table: table._id,
      status: { $in: ["draft", "sent_to_kitchen"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedTable = {
      ...table,
      displayName: getTableDisplayName(table),
      activeOrder,
    };

    return sendSuccess(res, "Table fetched successfully", {
      table: formattedTable,
      data: formattedTable,
    });
  } catch (error) {
    console.error("Get table error:", error);
    return sendError(res, 500, "Failed to fetch table");
  }
});

// @route   POST /api/tables
// @desc    Create table
// @access  Admin only
router.post("/", protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const payload = buildTablePayload(req.body);

    if (!payload.name) {
      return sendError(res, 400, "Table name is required");
    }

    if (!payload.capacity || payload.capacity < 1) {
      return sendError(res, 400, "Valid seating capacity is required");
    }

    if (!payload.floor) {
      return sendError(res, 400, "Floor is required");
    }

    if (!mongoose.Types.ObjectId.isValid(payload.floor)) {
      return sendError(res, 400, "Invalid floor id");
    }

    const floorExists = await Floor.findById(payload.floor);

    if (!floorExists) {
      return sendError(res, 404, "Selected floor does not exist");
    }

    const duplicateTable = await Table.findOne({
      floor: payload.floor,
      name: { $regex: new RegExp(`^${payload.name}$`, "i") },
    });

    if (duplicateTable) {
      return sendError(res, 400, "Table already exists on this floor");
    }

    const table = await Table.create({
      ...payload,
      status: payload.status || "available",
      posX: payload.posX ?? 10,
      posY: payload.posY ?? 10,
      width: payload.width ?? 90,
      height: payload.height ?? 90,
      shape: payload.shape || "square",
    });

    const populatedTable = await Table.findById(table._id).populate(
      "floor",
      "name color isActive"
    );

    emitTableUpdate(req, populatedTable, "table_created");

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

// @route   PUT /api/tables/:id
// @desc    Update table
// @access  Admin only
router.put("/:id", protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const payload = buildTablePayload(req.body);

    if (payload.floor && !mongoose.Types.ObjectId.isValid(payload.floor)) {
      return sendError(res, 400, "Invalid floor id");
    }

    if (payload.floor) {
      const floorExists = await Floor.findById(payload.floor);

      if (!floorExists) {
        return sendError(res, 404, "Selected floor does not exist");
      }
    }

    if (payload.name && payload.floor) {
      const duplicateTable = await Table.findOne({
        _id: { $ne: req.params.id },
        floor: payload.floor,
        name: { $regex: new RegExp(`^${payload.name}$`, "i") },
      });

      if (duplicateTable) {
        return sendError(res, 400, "Another table with this name already exists on this floor");
      }
    }

    const table = await Table.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate("floor", "name color isActive");

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    emitTableUpdate(req, table, "table_updated");

    return sendSuccess(res, "Table updated successfully", {
      table,
      data: table,
    });
  } catch (error) {
    console.error("Update table error:", error);
    return sendError(res, 500, error.message || "Failed to update table");
  }
});

// @route   PATCH /api/tables/:id
// @desc    Update table partially
// @access  Admin only
router.patch("/:id", protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const payload = buildTablePayload(req.body);

    const table = await Table.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate("floor", "name color isActive");

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    emitTableUpdate(req, table, "table_updated");

    return sendSuccess(res, "Table updated successfully", {
      table,
      data: table,
    });
  } catch (error) {
    console.error("Patch table error:", error);
    return sendError(res, 500, error.message || "Failed to update table");
  }
});

// @route   PATCH /api/tables/:id/status
// @desc    Update table status
// @access  Admin only
router.patch("/:id/status", protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("floor", "name color isActive");

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    emitTableUpdate(req, table, "table_status_updated");

    return sendSuccess(res, "Table status updated successfully", {
      table,
      data: table,
    });
  } catch (error) {
    console.error("Update table status error:", error);
    return sendError(res, 500, error.message || "Failed to update table status");
  }
});

// @route   DELETE /api/tables/:id
// @desc    Delete table
// @access  Admin only
router.delete("/:id", protect, authorize(...ADMIN_ROLES), async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return sendError(res, 404, "Table not found");
    }

    const activeOrder = await Order.findOne({
      table: table._id,
      status: { $in: ["draft", "sent_to_kitchen"] },
    });

    if (activeOrder) {
      return sendError(
        res,
        400,
        "Cannot delete table because it has an active order"
      );
    }

    await table.deleteOne();

    const io = req.app.get("io");
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