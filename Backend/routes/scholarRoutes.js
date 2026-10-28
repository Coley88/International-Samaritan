const express = require("express");
const db = require("../config/db");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// GET logged-in scholar profile
router.get("/me", protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        scholars.id AS scholar_id,
        users.first_name,
        users.last_name,
        users.email,
        scholars.age,
        scholars.phone,
        scholars.school,
        scholars.current_grade,
        scholars.family_info,
        scholars.years_on_scholarship,
        scholars.current_path,
        scholars.photo
      FROM scholars
      JOIN users ON scholars.user_id = users.id
      WHERE users.id = ?
      `,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Scholar profile not found." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load scholar profile." });
  }
});

// GET all scholars for admin
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const [scholars] = await db.query(`
      SELECT 
        scholars.id AS scholar_id,
        users.first_name,
        users.last_name,
        users.email,
        scholars.age,
        scholars.phone,
        scholars.school,
        scholars.current_grade,
        scholars.years_on_scholarship,
        scholars.current_path,
        scholars.photo
      FROM scholars
      JOIN users ON scholars.user_id = users.id
      ORDER BY users.first_name ASC
    `);

    res.json(scholars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load scholars." });
  }
});

// Admin views one scholar's full details
router.get("/:id/full", protect, adminOnly, async (req, res) => {
  try {
    const scholarId = req.params.id;

    const [profileRows] = await db.query(
      `
      SELECT 
        scholars.id AS scholar_id,
        users.id AS user_id,
        users.first_name,
        users.last_name,
        users.email,
        scholars.age,
        scholars.phone,
        scholars.school,
        scholars.current_grade,
        scholars.family_info,
        scholars.years_on_scholarship,
        scholars.current_path,
        scholars.photo
      FROM scholars
      JOIN users ON scholars.user_id = users.id
      WHERE scholars.id = ?
      `,
      [scholarId]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({
        message: "Scholar not found."
      });
    }

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

    const [meetings] = await db.query(
      `
      SELECT
        id,
        reason,
        preferred_date,
        preferred_time,
        message,
        status,
        admin_response,
        created_at
      FROM meeting_requests
      WHERE scholar_id = ?
      ORDER BY created_at DESC
      `,
      [scholarId]
    );

    const [assistance] = await db.query(
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

    const [notes] = await db.query(
      `
      SELECT
        admin_notes.id,
        admin_notes.note,
        admin_notes.created_at,
        users.first_name AS admin_first_name,
        users.last_name AS admin_last_name
      FROM admin_notes
      JOIN users ON admin_notes.admin_id = users.id
      WHERE admin_notes.scholar_id = ?
      ORDER BY admin_notes.created_at DESC
      `,
      [scholarId]
    );

    res.json({
      profile: profileRows[0],
      reports,
      meetings,
      assistance,
      notes
    });
  } catch (error) {
    console.error("Load full scholar details error:", error);

    res.status(500).json({
      message: "Could not load scholar details."
    });
  }
});

// Admin adds a note to a scholar profile
router.post("/:id/notes", protect, adminOnly, async (req, res) => {
  try {
    const scholarId = req.params.id;
    const { note } = req.body;

    if (!note || note.trim() === "") {
      return res.status(400).json({
        message: "Note cannot be empty."
      });
    }

    await db.query(
      `
      INSERT INTO admin_notes
      (scholar_id, admin_id, note)
      VALUES (?, ?, ?)
      `,
      [scholarId, req.user.id, note.trim()]
    );

    res.status(201).json({
      message: "Admin note added successfully."
    });
  } catch (error) {
    console.error("Add admin note error:", error);

    res.status(500).json({
      message: "Could not add admin note."
    });
  }
});

module.exports = router;