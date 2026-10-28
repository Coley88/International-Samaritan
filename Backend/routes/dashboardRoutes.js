const express = require("express");
const db = require("../config/db");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin dashboard statistics
router.get("/admin-stats", protect, adminOnly, async (req, res) => {
  try {
    const [[scholarCount]] = await db.query(`
      SELECT COUNT(*) AS total_scholars
      FROM scholars
    `);

    const [[pendingReports]] = await db.query(`
      SELECT COUNT(*) AS pending_reports
      FROM reports
      WHERE status = 'Pending'
    `);

    const [[pendingMeetings]] = await db.query(`
      SELECT COUNT(*) AS pending_meetings
      FROM meeting_requests
      WHERE status = 'Pending'
    `);

    const [[pendingAssistance]] = await db.query(`
      SELECT COUNT(*) AS pending_assistance
      FROM assistance_requests
      WHERE status = 'Pending'
    `);

    const [recentReports] = await db.query(`
      SELECT
        'Report Upload' AS activity_type,
        reports.uploaded_at AS activity_date,
        reports.status,
        users.first_name,
        users.last_name,
        CONCAT(reports.report_type, ' - ', reports.term_or_semester) AS activity_detail
      FROM reports
      JOIN scholars ON reports.scholar_id = scholars.id
      JOIN users ON scholars.user_id = users.id
    `);

    const [recentMeetings] = await db.query(`
      SELECT
        'Meeting Request' AS activity_type,
        meeting_requests.created_at AS activity_date,
        meeting_requests.status,
        users.first_name,
        users.last_name,
        meeting_requests.reason AS activity_detail
      FROM meeting_requests
      JOIN scholars ON meeting_requests.scholar_id = scholars.id
      JOIN users ON scholars.user_id = users.id
    `);

    const [recentAssistance] = await db.query(`
      SELECT
        'Assistance Request' AS activity_type,
        assistance_requests.created_at AS activity_date,
        assistance_requests.status,
        users.first_name,
        users.last_name,
        assistance_requests.assistance_type AS activity_detail
      FROM assistance_requests
      JOIN scholars ON assistance_requests.scholar_id = scholars.id
      JOIN users ON scholars.user_id = users.id
    `);

    const recentActivity = [
      ...recentReports,
      ...recentMeetings,
      ...recentAssistance
    ]
      .sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date))
      .slice(0, 8);

    res.json({
      total_scholars: scholarCount.total_scholars,
      pending_reports: pendingReports.pending_reports,
      pending_meetings: pendingMeetings.pending_meetings,
      pending_assistance: pendingAssistance.pending_assistance,
      recent_activity: recentActivity
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);

    res.status(500).json({
      message: "Could not load dashboard statistics."
    });
  }
});

module.exports = router;