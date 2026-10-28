const express = require("express");
const db = require("../config/db");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Scholar submits a meeting request
router.post("/", protect, async (req, res) => {
  try {
    const { reason, preferred_date, preferred_time, message } = req.body;

    if (!reason || !preferred_date || !preferred_time || !message) {
      return res.status(400).json({
        message: "Please fill in all meeting request fields."
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
      INSERT INTO meeting_requests
      (scholar_id, reason, preferred_date, preferred_time, message)
      VALUES (?, ?, ?, ?, ?)
      `,
      [scholarId, reason, preferred_date, preferred_time, message]
    );

    res.status(201).json({
      message: "Meeting request submitted successfully."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not submit meeting request."
    });
  }
});

// Admin views all meeting requests
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const [meetings] = await db.query(`
      SELECT
        meeting_requests.id,
        meeting_requests.reason,
        meeting_requests.preferred_date,
        meeting_requests.preferred_time,
        meeting_requests.message,
        meeting_requests.status,
        meeting_requests.admin_response,
        meeting_requests.created_at,
        scholars.id AS scholar_id,
        users.first_name,
        users.last_name,
        users.email,
        scholars.school,
        scholars.current_grade
      FROM meeting_requests
      JOIN scholars ON meeting_requests.scholar_id = scholars.id
      JOIN users ON scholars.user_id = users.id
      ORDER BY meeting_requests.created_at DESC
    `);

    res.json(meetings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not load meeting requests."
    });
  }
});

// Admin updates/responds to a meeting request
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
      UPDATE meeting_requests
      SET status = ?, admin_response = ?
      WHERE id = ?
      `,
      [status, admin_response || null, req.params.id]
    );

    res.json({
      message: "Meeting request updated successfully."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not update meeting request."
    });
  }
});

module.exports = router;