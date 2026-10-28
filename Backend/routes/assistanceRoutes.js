const express = require("express");
const db = require("../config/db");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Scholar submits an assistance request
router.post("/", protect, async (req, res) => {
  try {
    const { assistance_type, urgency, reason } = req.body;

    if (!assistance_type || !urgency || !reason) {
      return res.status(400).json({
        message: "Please fill in all assistance request fields."
      });
    }

    const [scholarRows] = await db.query(
      "SELECT id FROM scholars WHERE user_id = ?",
      [req.user.id]
    );

    if (scholarRows.length === 0) {
      return res.status(404).json({
        message: "Scholar profile not found."
      });
    }

    const scholarId = scholarRows[0].id;

    await db.query(
      `
      INSERT INTO assistance_requests
      (scholar_id, assistance_type, urgency, reason)
      VALUES (?, ?, ?, ?)
      `,
      [scholarId, assistance_type, urgency, reason]
    );

    res.status(201).json({
      message: "Assistance request submitted successfully."
    });
  } catch (error) {
    console.error("Submit assistance request error:", error);

    res.status(500).json({
      message: "Could not submit assistance request."
    });
  }
});

// Scholar views their own assistance requests
router.get("/my", protect, async (req, res) => {
  try {
    const [scholarRows] = await db.query(
      "SELECT id FROM scholars WHERE user_id = ?",
      [req.user.id]
    );

    if (scholarRows.length === 0) {
      return res.status(404).json({
        message: "Scholar profile not found."
      });
    }

    const scholarId = scholarRows[0].id;

    const [requests] = await db.query(
      `
      SELECT
        id,
        assistance_type,
        urgency,
        reason,
        supporting_file,
        status,
        admin_response,
        created_at
      FROM assistance_requests
      WHERE scholar_id = ?
      ORDER BY created_at DESC
      `,
      [scholarId]
    );

    res.json(requests);
  } catch (error) {
    console.error("Load scholar assistance requests error:", error);

    res.status(500).json({
      message: "Could not load your assistance requests."
    });
  }
});

// Admin views all assistance requests
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT
        assistance_requests.id,
        assistance_requests.assistance_type,
        assistance_requests.urgency,
        assistance_requests.reason,
        assistance_requests.supporting_file,
        assistance_requests.status,
        assistance_requests.admin_response,
        assistance_requests.created_at,
        scholars.id AS scholar_id,
        users.first_name,
        users.last_name,
        users.email,
        scholars.school,
        scholars.current_grade
      FROM assistance_requests
      JOIN scholars ON assistance_requests.scholar_id = scholars.id
      JOIN users ON scholars.user_id = users.id
      ORDER BY assistance_requests.created_at DESC
    `);

    res.json(requests);
  } catch (error) {
    console.error("Load admin assistance requests error:", error);

    res.status(500).json({
      message: "Could not load assistance requests."
    });
  }
});

// Admin updates/responds to assistance request
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status, admin_response } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required."
      });
    }

    await db.query(
      `
      UPDATE assistance_requests
      SET status = ?, admin_response = ?
      WHERE id = ?
      `,
      [status, admin_response || null, req.params.id]
    );

    res.json({
      message: "Assistance request updated successfully."
    });
  } catch (error) {
    console.error("Update assistance request error:", error);

    res.status(500).json({
      message: "Could not update assistance request."
    });
  }
});

module.exports = router;