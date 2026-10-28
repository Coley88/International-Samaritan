const express = require("express");
const db = require("../config/db");
const upload = require("../middleware/uploadMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Scholar uploads a report
router.post("/", protect, upload.single("report_file"), async (req, res) => {
  try {
    const { report_type, school_year, term_or_semester, comment } = req.body;

    if (!report_type || !school_year || !term_or_semester) {
      return res.status(400).json({
        message: "Please fill in all required report fields."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a report file."
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

    const filePath = `uploads/${req.file.filename}`;

    await db.query(
      `
      INSERT INTO reports
      (scholar_id, report_type, school_year, term_or_semester, file_path, comment)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        scholarId,
        report_type,
        school_year,
        term_or_semester,
        filePath,
        comment || null
      ]
    );

    res.status(201).json({
      message: "Report uploaded successfully."
    });
  } catch (error) {
    console.error("Upload report error:", error);

    res.status(500).json({
      message: error.message || "Could not upload report."
    });
  }
});

// Scholar views their own reports
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

    const [reports] = await db.query(
      `
      SELECT
        id,
        report_type,
        school_year,
        term_or_semester,
        file_path,
        comment,
        status,
        uploaded_at
      FROM reports
      WHERE scholar_id = ?
      ORDER BY uploaded_at DESC
      `,
      [scholarId]
    );

    res.json(reports);
  } catch (error) {
    console.error("Load scholar reports error:", error);

    res.status(500).json({
      message: "Could not load your reports."
    });
  }
});

// Admin views all reports
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const [reports] = await db.query(`
      SELECT
        reports.id,
        reports.report_type,
        reports.school_year,
        reports.term_or_semester,
        reports.file_path,
        reports.comment,
        reports.status,
        reports.uploaded_at,
        scholars.id AS scholar_id,
        users.first_name,
        users.last_name,
        users.email,
        scholars.school,
        scholars.current_grade
      FROM reports
      JOIN scholars ON reports.scholar_id = scholars.id
      JOIN users ON scholars.user_id = users.id
      ORDER BY reports.uploaded_at DESC
    `);

    res.json(reports);
  } catch (error) {
    console.error("Load admin reports error:", error);

    res.status(500).json({
      message: "Could not load reports."
    });
  }
});

// Admin updates report status
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required."
      });
    }

    await db.query(
      `
      UPDATE reports
      SET status = ?
      WHERE id = ?
      `,
      [status, req.params.id]
    );

    res.json({
      message: "Report status updated successfully."
    });
  } catch (error) {
    console.error("Update report status error:", error);

    res.status(500).json({
      message: "Could not update report status."
    });
  }
});

module.exports = router;