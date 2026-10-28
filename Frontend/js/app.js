const API_BASE_URL = "http://localhost:5000/api";

// REGISTER USER
async function registerUser(event) {
  event.preventDefault();

  const form = event.target;
  const inputs = form.querySelectorAll("input");

  const first_name = inputs[0].value.trim();
  const last_name = inputs[1].value.trim();
  const email = inputs[2].value.trim();
  const phone = inputs[3].value.trim();
  const school = inputs[4].value.trim();
  const current_grade = inputs[5].value.trim();
  const password = inputs[6].value;
  const confirmPassword = inputs[7].value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        first_name,
        last_name,
        email,
        password,
        phone,
        school,
        current_grade
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Registration failed.");
      return;
    }

    alert("Registration successful. You may now login.");
    window.location.href = "login.html";
  } catch (error) {
    console.error(error);
    alert("Could not connect to the server. Make sure the backend is running.");
  }
}

// LOGIN USER
async function loginUser(event) {
  event.preventDefault();

  const form = event.target;

  const email = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Login failed.");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    alert("Login successful.");

    if (data.user.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "scholar-dashboard.html";
    }
  } catch (error) {
    console.error(error);
    alert("Could not connect to the server. Make sure the backend is running.");
  }
}

// LOGOUT USER
function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// TEMPORARY FORM FUNCTION FOR OTHER PAGES
function submitForm(event, message) {
  event.preventDefault();
  alert(message);
  event.target.reset();
}

async function loadMyProfile() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/scholars/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not load profile.");
      return;
    }

    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

    document.getElementById("profileCardName").textContent = fullName || "Scholar";
    document.getElementById("profileCardPath").textContent = data.current_path || "Not set";

    document.getElementById("profileFullName").textContent = fullName || "Not set";
    document.getElementById("profileAge").textContent = data.age || "Not set";
    document.getElementById("profileEmail").textContent = data.email || "Not set";
    document.getElementById("profilePhone").textContent = data.phone || "Not set";
    document.getElementById("profileSchool").textContent = data.school || "Not set";
    document.getElementById("profileGrade").textContent = data.current_grade || "Not set";
    document.getElementById("profileYears").textContent =
      data.years_on_scholarship !== null && data.years_on_scholarship !== undefined
        ? `${data.years_on_scholarship} Years`
        : "Not set";
    document.getElementById("profilePath").textContent = data.current_path || "Not set";
    document.getElementById("profileFamilyInfo").textContent =
      data.family_info || "Family and guardian information has not been added yet.";
  } catch (error) {
    console.error(error);
    alert("Could not connect to the server.");
  }
}

async function submitMeetingRequest(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  const reason = document.getElementById("meetingReason").value;
  const preferred_date = document.getElementById("meetingDate").value;
  const preferred_time = document.getElementById("meetingTime").value;
  const message = document.getElementById("meetingMessage").value;

  try {
    const response = await fetch(`${API_BASE_URL}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        reason,
        preferred_date,
        preferred_time,
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Meeting request failed.");
      return;
    }

    alert("Meeting request submitted successfully.");
    event.target.reset();
  } catch (error) {
    console.error(error);
    alert("Could not connect to the server.");
  }
}

async function loadAdminMeetings() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  if (!user || user.role !== "admin") {
    alert("Admin access only.");
    window.location.href = "login.html";
    return;
  }

  const container = document.getElementById("adminMeetingsContainer");
  const filter = document.getElementById("meetingStatusFilter")?.value || "All";

  container.innerHTML = "<p>Loading meeting requests...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/meetings`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not load meeting requests.");
      container.innerHTML = "<p>Could not load meeting requests.</p>";
      return;
    }

    let meetings = data;

    if (filter !== "All") {
      meetings = meetings.filter((meeting) => meeting.status === filter);
    }

    if (meetings.length === 0) {
      container.innerHTML = "<p>No meeting requests found.</p>";
      return;
    }

    container.innerHTML = meetings.map((meeting) => {
      const scholarName = `${meeting.first_name} ${meeting.last_name}`;
      const date = meeting.preferred_date
        ? new Date(meeting.preferred_date).toLocaleDateString()
        : "Not set";

      return `
        <div class="request-card">
          <h3>${scholarName}</h3>

          <p><strong>Email:</strong> ${meeting.email || "Not set"}</p>
          <p><strong>School:</strong> ${meeting.school || "Not set"}</p>
          <p><strong>Grade/Year:</strong> ${meeting.current_grade || "Not set"}</p>
          <p><strong>Reason:</strong> ${meeting.reason || "Not set"}</p>
          <p><strong>Preferred Date:</strong> ${date}</p>
          <p><strong>Preferred Time:</strong> ${meeting.preferred_time || "Not set"}</p>
          <p><strong>Message:</strong> ${meeting.message || "No message provided."}</p>
          <p><strong>Status:</strong> <span class="status pending">${meeting.status}</span></p>

          <label>Admin Response</label>
          <textarea id="meetingResponse-${meeting.id}" placeholder="Write response...">${meeting.admin_response || ""}</textarea>

          <div class="action-row">
            <button class="mini-btn approve" onclick="updateMeetingRequest(${meeting.id}, 'Approved')">Approve</button>
            <button class="mini-btn warning" onclick="updateMeetingRequest(${meeting.id}, 'Rescheduled')">Reschedule</button>
            <button class="mini-btn reject" onclick="updateMeetingRequest(${meeting.id}, 'Declined')">Decline</button>
            <button class="mini-btn approve" onclick="updateMeetingRequest(${meeting.id}, 'Completed')">Complete</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Could not connect to the server.</p>";
  }
}

async function updateMeetingRequest(meetingId, status) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  const responseBox = document.getElementById(`meetingResponse-${meetingId}`);
  const admin_response = responseBox ? responseBox.value.trim() : "";

  try {
    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status,
        admin_response
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not update meeting request.");
      return;
    }

    alert("Meeting request updated successfully.");
    loadAdminMeetings();
  } catch (error) {
    console.error(error);
    alert("Could not connect to the server.");
  }
}

async function submitAssistanceRequest(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  const assistance_type = document.getElementById("assistanceType").value;
  const urgency = document.getElementById("assistanceUrgency").value;
  const reason = document.getElementById("assistanceReason").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/assistance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        assistance_type,
        urgency,
        reason
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Assistance request failed.");
      return;
    }

    alert("Assistance request submitted successfully.");
    event.target.reset();

    await loadMyAssistanceRequests();
  } catch (error) {
    console.error("Submit assistance request error:", error);
    alert("Could not connect to the server.");
  }
}

async function loadMyAssistanceRequests() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("myAssistanceContainer");

  if (!container) {
    return;
  }

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  container.innerHTML = "<p>Loading your assistance requests...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/assistance/my`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      alert("Your login session has expired. Please login again.");
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) {
      container.innerHTML = `
        <p>${escapeHtml(data.message || "Could not load assistance requests.")}</p>
      `;
      return;
    }

    if (data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No assistance requests yet</h3>
          <p>Your submitted assistance requests will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data
      .map((request) => {
        const submittedDate = formatPortalDate(request.created_at);
        const statusClass = getAssistanceStatusClass(request.status);
        const urgencyClass = getUrgencyClass(request.urgency);

        return `
          <article class="request-card">
            <div class="request-card-header">
              <div>
                <h3>${escapeHtml(request.assistance_type || "Assistance Request")}</h3>
                <p class="request-reference">
                  Request #${request.id}
                </p>
              </div>

              <span class="status ${statusClass}">
                ${escapeHtml(request.status || "Pending")}
              </span>
            </div>

            <div class="request-information">
              <p>
                <strong>Urgency:</strong>
                <span class="urgency ${urgencyClass}">
                  ${escapeHtml(request.urgency || "Not set")}
                </span>
              </p>

              <p>
                <strong>Submitted:</strong>
                ${submittedDate}
              </p>

              <p>
                <strong>Your reason:</strong>
                ${escapeHtml(request.reason || "No reason provided.")}
              </p>
            </div>

            <div class="admin-response-box">
              <strong>Administrator Response</strong>

              <p>
                ${
                  request.admin_response
                    ? escapeHtml(request.admin_response)
                    : "No response has been added yet."
                }
              </p>
            </div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load assistance requests error:", error);

    container.innerHTML = `
      <p>Could not connect to the server. Make sure the backend is running.</p>
    `;
  }
}

function getAssistanceStatusClass(status) {
  switch (status) {
    case "Approved":
      return "approved";

    case "Completed":
      return "completed";

    case "Denied":
      return "declined";

    case "Need More Information":
      return "rescheduled";

    default:
      return "pending";
  }
}

function getUrgencyClass(urgency) {
  switch (urgency) {
    case "High":
      return "urgency-high";

    case "Medium":
      return "urgency-medium";

    default:
      return "urgency-low";
  }
}

async function loadAdminAssistanceRequests() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const container = document.getElementById("adminAssistanceContainer");

  if (!container) {
    return;
  }

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  if (!user || user.role !== "admin") {
    alert("Admin access only.");
    window.location.href = "login.html";
    return;
  }

  const filter = document.getElementById("assistanceStatusFilter")?.value || "All";

  container.innerHTML = "<p>Loading assistance requests...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/assistance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not load assistance requests.");
      container.innerHTML = "<p>Could not load assistance requests.</p>";
      return;
    }

    let requests = data;

    if (filter !== "All") {
      requests = requests.filter((request) => request.status === filter);
    }

    if (requests.length === 0) {
      container.innerHTML = "<p>No assistance requests found.</p>";
      return;
    }

    container.innerHTML = requests
      .map((request) => {
        const scholarName = `${request.first_name} ${request.last_name}`;
        const submittedDate = formatPortalDate(request.created_at);
        const statusClass = getAssistanceStatusClass(request.status);
        const urgencyClass = getUrgencyClass(request.urgency);

        return `
          <div class="request-card">
            <div class="request-card-header">
              <div>
                <h3>${escapeHtml(scholarName)}</h3>
                <p class="request-reference">Request #${request.id}</p>
              </div>

              <span class="status ${statusClass}">
                ${escapeHtml(request.status || "Pending")}
              </span>
            </div>

            <p><strong>Email:</strong> ${escapeHtml(request.email || "Not set")}</p>
            <p><strong>School:</strong> ${escapeHtml(request.school || "Not set")}</p>
            <p><strong>Grade/Year:</strong> ${escapeHtml(request.current_grade || "Not set")}</p>
            <p><strong>Assistance Type:</strong> ${escapeHtml(request.assistance_type || "Not set")}</p>
            <p>
              <strong>Urgency:</strong>
              <span class="urgency ${urgencyClass}">
                ${escapeHtml(request.urgency || "Not set")}
              </span>
            </p>
            <p><strong>Submitted:</strong> ${submittedDate}</p>
            <p><strong>Reason:</strong> ${escapeHtml(request.reason || "No reason provided.")}</p>

            <label>Admin Response</label>
            <textarea id="assistanceResponse-${request.id}" placeholder="Write response...">${request.admin_response || ""}</textarea>

            <div class="action-row">
              <button class="mini-btn approve" onclick="updateAssistanceRequest(${request.id}, 'Approved')">Approve</button>
              <button class="mini-btn warning" onclick="updateAssistanceRequest(${request.id}, 'Need More Information')">Need More Info</button>
              <button class="mini-btn reject" onclick="updateAssistanceRequest(${request.id}, 'Denied')">Deny</button>
              <button class="mini-btn approve" onclick="updateAssistanceRequest(${request.id}, 'Completed')">Complete</button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load admin assistance requests error:", error);
    container.innerHTML = "<p>Could not connect to the server.</p>";
  }
}

async function updateAssistanceRequest(requestId, status) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  const responseBox = document.getElementById(`assistanceResponse-${requestId}`);
  const admin_response = responseBox ? responseBox.value.trim() : "";

  try {
    const response = await fetch(`${API_BASE_URL}/assistance/${requestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status,
        admin_response
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not update assistance request.");
      return;
    }

    alert("Assistance request updated successfully.");
    loadAdminAssistanceRequests();
  } catch (error) {
    console.error("Update assistance request error:", error);
    alert("Could not connect to the server.");
  }
}

function formatPortalDate(dateValue) {
  if (!dateValue) {
    return "Not set";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleDateString("en-JM", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function escapeHtml(value) {
  const text = String(value ?? "");

  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMeetingStatusClass(status) {
  switch (status) {
    case "Approved":
      return "approved";

    case "Completed":
      return "completed";

    case "Declined":
      return "declined";

    case "Rescheduled":
      return "rescheduled";

    default:
      return "pending";
  }
}

function getAssistanceStatusClass(status) {
  switch (status) {
    case "Approved":
      return "approved";

    case "Completed":
      return "completed";

    case "Denied":
      return "declined";

    case "Need More Information":
      return "rescheduled";

    default:
      return "pending";
  }
}

function getUrgencyClass(urgency) {
  switch (urgency) {
    case "High":
      return "urgency-high";

    case "Medium":
      return "urgency-medium";

    default:
      return "urgency-low";
  }
}

async function submitReportUpload(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  const report_type = document.getElementById("reportType").value;
  const school_year = document.getElementById("reportSchoolYear").value.trim();
  const term_or_semester = document.getElementById("reportTerm").value;
  const comment = document.getElementById("reportComment").value.trim();
  const fileInput = document.getElementById("reportFile");

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please choose a file to upload.");
    return;
  }

  const formData = new FormData();

  formData.append("report_type", report_type);
  formData.append("school_year", school_year);
  formData.append("term_or_semester", term_or_semester);
  formData.append("comment", comment);
  formData.append("report_file", fileInput.files[0]);

  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Report upload failed.");
      return;
    }

    alert("Report uploaded successfully.");
    event.target.reset();

    await loadMyReports();
  } catch (error) {
    console.error("Submit report upload error:", error);
    alert("Could not connect to the server.");
  }
}

async function loadMyReports() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("myReportsContainer");

  if (!container) {
    return;
  }

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  container.innerHTML = "<p>Loading your reports...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/reports/my`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      container.innerHTML = `
        <p>${escapeHtml(data.message || "Could not load reports.")}</p>
      `;
      return;
    }

    if (data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No reports uploaded yet</h3>
          <p>Your uploaded reports will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data
      .map((report) => {
        const uploadedDate = formatPortalDate(report.uploaded_at);
        const fileUrl = report.file_path
          ? `http://localhost:5000/${report.file_path}`
          : "#";

        return `
          <article class="request-card">
            <div class="request-card-header">
              <div>
                <h3>${escapeHtml(report.report_type || "Report")}</h3>
                <p class="request-reference">Report #${report.id}</p>
              </div>

              <span class="status ${getReportStatusClass(report.status)}">
                ${escapeHtml(report.status || "Pending")}
              </span>
            </div>

            <div class="request-information">
              <p><strong>School Year:</strong> ${escapeHtml(report.school_year || "Not set")}</p>
              <p><strong>Term/Semester:</strong> ${escapeHtml(report.term_or_semester || "Not set")}</p>
              <p><strong>Uploaded:</strong> ${uploadedDate}</p>
              <p><strong>Comment:</strong> ${escapeHtml(report.comment || "No comment provided.")}</p>
            </div>

            <a
              href="${fileUrl}"
              target="_blank"
              class="table-btn"
            >
              View File
            </a>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load reports error:", error);

    container.innerHTML = `
      <p>Could not connect to the server. Make sure the backend is running.</p>
    `;
  }
}

function getReportStatusClass(status) {
  switch (status) {
    case "Approved":
      return "approved";

    case "Reviewed":
      return "completed";

    case "Need Correction":
      return "rescheduled";

    default:
      return "pending";
  }
}

async function loadAdminReports() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const container = document.getElementById("adminReportsContainer");

  if (!container) {
    return;
  }

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  if (!user || user.role !== "admin") {
    alert("Admin access only.");
    window.location.href = "login.html";
    return;
  }

  const filter = document.getElementById("reportStatusFilter")?.value || "All";

  container.innerHTML = "<p>Loading reports...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not load reports.");
      container.innerHTML = "<p>Could not load reports.</p>";
      return;
    }

    let reports = data;

    if (filter !== "All") {
      reports = reports.filter((report) => report.status === filter);
    }

    if (reports.length === 0) {
      container.innerHTML = "<p>No reports found.</p>";
      return;
    }

    container.innerHTML = reports
      .map((report) => {
        const scholarName = `${report.first_name} ${report.last_name}`;
        const uploadedDate = formatPortalDate(report.uploaded_at);
        const fileUrl = report.file_path
          ? `http://localhost:5000/${report.file_path}`
          : "#";

        return `
          <div class="request-card">
            <div class="request-card-header">
              <div>
                <h3>${escapeHtml(scholarName)}</h3>
                <p class="request-reference">Report #${report.id}</p>
              </div>

              <span class="status ${getReportStatusClass(report.status)}">
                ${escapeHtml(report.status || "Pending")}
              </span>
            </div>

            <p><strong>Email:</strong> ${escapeHtml(report.email || "Not set")}</p>
            <p><strong>School:</strong> ${escapeHtml(report.school || "Not set")}</p>
            <p><strong>Grade/Year:</strong> ${escapeHtml(report.current_grade || "Not set")}</p>
            <p><strong>Report Type:</strong> ${escapeHtml(report.report_type || "Not set")}</p>
            <p><strong>School Year:</strong> ${escapeHtml(report.school_year || "Not set")}</p>
            <p><strong>Term/Semester:</strong> ${escapeHtml(report.term_or_semester || "Not set")}</p>
            <p><strong>Uploaded:</strong> ${uploadedDate}</p>
            <p><strong>Comment:</strong> ${escapeHtml(report.comment || "No comment provided.")}</p>

            <div class="action-row">
              <a href="${fileUrl}" target="_blank" class="table-btn">View File</a>
              <button class="mini-btn approve" onclick="updateReportStatus(${report.id}, 'Approved')">Approve</button>
              <button class="mini-btn warning" onclick="updateReportStatus(${report.id}, 'Need Correction')">Need Correction</button>
              <button class="mini-btn approve" onclick="updateReportStatus(${report.id}, 'Reviewed')">Reviewed</button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load admin reports error:", error);
    container.innerHTML = "<p>Could not connect to the server.</p>";
  }
}

async function updateReportStatus(reportId, status) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not update report status.");
      return;
    }

    alert("Report status updated successfully.");
    loadAdminReports();
  } catch (error) {
    console.error("Update report status error:", error);
    alert("Could not connect to the server.");
  }
}

let adminScholarsCache = [];

async function loadAdminScholars() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const tableBody = document.getElementById("adminScholarsTableBody");

  if (!tableBody) {
    return;
  }

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  if (!user || user.role !== "admin") {
    alert("Admin access only.");
    window.location.href = "login.html";
    return;
  }

  tableBody.innerHTML = `
    <tr>
      <td colspan="8">Loading scholars...</td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/scholars`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">${escapeHtml(data.message || "Could not load scholars.")}</td>
        </tr>
      `;
      return;
    }

    adminScholarsCache = data;
    renderAdminScholars(data);
  } catch (error) {
    console.error("Load scholars error:", error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="8">Could not connect to the server.</td>
      </tr>
    `;
  }
}

function renderAdminScholars(scholars) {
  const tableBody = document.getElementById("adminScholarsTableBody");

  if (!tableBody) {
    return;
  }

  if (!scholars || scholars.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">No scholars found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = scholars
    .map((scholar) => {
      const fullName = `${scholar.first_name || ""} ${scholar.last_name || ""}`.trim();

      return `
        <tr>
          <td>${escapeHtml(fullName || "Unnamed Scholar")}</td>
          <td>${escapeHtml(scholar.email || "Not set")}</td>
          <td>${escapeHtml(scholar.age ?? "Not set")}</td>
          <td>${escapeHtml(scholar.school || "Not set")}</td>
          <td>${escapeHtml(scholar.current_grade || "Not set")}</td>
          <td>${escapeHtml(scholar.years_on_scholarship ?? 0)}</td>
          <td>${escapeHtml(scholar.current_path || "Not set")}</td>
          <td>
            <a
              href="scholar-details.html?id=${encodeURIComponent(scholar.scholar_id)}"
              class="table-btn"
            >
              View
            </a>
          </td>
        </tr>
      `;
    })
    .join("");
}

function filterAdminScholars() {
  const searchInput = document.getElementById("scholarSearchInput");

  if (!searchInput) {
    return;
  }

  const searchTerm = searchInput.value.toLowerCase().trim();

  if (!searchTerm) {
    renderAdminScholars(adminScholarsCache);
    return;
  }

  const filteredScholars = adminScholarsCache.filter((scholar) => {
    const fullName = `${scholar.first_name || ""} ${scholar.last_name || ""}`.toLowerCase();

    return (
      fullName.includes(searchTerm) ||
      String(scholar.email || "").toLowerCase().includes(searchTerm) ||
      String(scholar.school || "").toLowerCase().includes(searchTerm) ||
      String(scholar.current_grade || "").toLowerCase().includes(searchTerm) ||
      String(scholar.current_path || "").toLowerCase().includes(searchTerm)
    );
  });

  renderAdminScholars(filteredScholars);
}

function getScholarIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadScholarDetails() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const scholarId = getScholarIdFromUrl();

  if (!scholarId) {
    alert("No scholar selected.");
    window.location.href = "admin-scholars.html";
    return;
  }

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  if (!user || user.role !== "admin") {
    alert("Admin access only.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/scholars/${scholarId}/full`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not load scholar details.");
      window.location.href = "admin-scholars.html";
      return;
    }

    renderScholarProfile(data.profile);
    renderScholarReports(data.reports);
    renderScholarMeetings(data.meetings);
    renderScholarAssistance(data.assistance);
    renderAdminNotes(data.notes);
  } catch (error) {
  console.error("Load scholar details error:", error);
  alert("The note saved, but the page could not reload scholar details. Check the console for the exact error.");
  }
}

function renderScholarProfile(profile) {
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

  document.getElementById("adminScholarName").textContent = fullName || "Unnamed Scholar";
  document.getElementById("adminScholarPath").textContent = profile.current_path || "Not set";

  document.getElementById("detailFullName").textContent = fullName || "Not set";
  document.getElementById("detailEmail").textContent = profile.email || "Not set";
  document.getElementById("detailAge").textContent = profile.age || "Not set";
  document.getElementById("detailPhone").textContent = profile.phone || "Not set";
  document.getElementById("detailSchool").textContent = profile.school || "Not set";
  document.getElementById("detailGrade").textContent = profile.current_grade || "Not set";
  document.getElementById("detailYears").textContent =
    profile.years_on_scholarship !== null && profile.years_on_scholarship !== undefined
      ? `${profile.years_on_scholarship} Years`
      : "Not set";
  document.getElementById("detailPath").textContent = profile.current_path || "Not set";
  document.getElementById("detailFamilyInfo").textContent =
    profile.family_info || "Family and guardian information has not been added yet.";
}

function renderScholarReports(reports) {
  const container = document.getElementById("scholarReportsContainer");

  if (!reports || reports.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No reports uploaded</h3>
        <p>This scholar has not uploaded any reports yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reports
    .map((report) => {
      const uploadedDate = formatPortalDate(report.uploaded_at);
      const fileUrl = report.file_path
        ? `http://localhost:5000/${report.file_path}`
        : "#";

      return `
        <article class="request-card">
          <div class="request-card-header">
            <div>
              <h3>${escapeHtml(report.report_type || "Report")}</h3>
              <p class="request-reference">Report #${report.id}</p>
            </div>

            <span class="status ${getReportStatusClass(report.status)}">
              ${escapeHtml(report.status || "Pending")}
            </span>
          </div>

          <p><strong>School Year:</strong> ${escapeHtml(report.school_year || "Not set")}</p>
          <p><strong>Term/Semester:</strong> ${escapeHtml(report.term_or_semester || "Not set")}</p>
          <p><strong>Uploaded:</strong> ${uploadedDate}</p>
          <p><strong>Comment:</strong> ${escapeHtml(report.comment || "No comment provided.")}</p>

          <a href="${fileUrl}" target="_blank" class="table-btn">View File</a>
        </article>
      `;
    })
    .join("");
}

function renderScholarMeetings(meetings) {
  const container = document.getElementById("scholarMeetingsContainer");

  if (!meetings || meetings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No meeting requests</h3>
        <p>This scholar has not submitted any meeting requests yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = meetings
    .map((meeting) => {
      const preferredDate = formatPortalDate(meeting.preferred_date);
      const submittedDate = formatPortalDate(meeting.created_at);
      const preferredTime = formatPortalTime(meeting.preferred_time);
      const statusClass = getMeetingStatusClass(meeting.status);

      return `
        <article class="request-card">
          <div class="request-card-header">
            <div>
              <h3>${escapeHtml(meeting.reason || "Meeting Request")}</h3>
              <p class="request-reference">Request #${meeting.id}</p>
            </div>

            <span class="status ${statusClass}">
              ${escapeHtml(meeting.status || "Pending")}
            </span>
          </div>

          <p><strong>Preferred Date:</strong> ${preferredDate}</p>
          <p><strong>Preferred Time:</strong> ${preferredTime}</p>
          <p><strong>Submitted:</strong> ${submittedDate}</p>
          <p><strong>Message:</strong> ${escapeHtml(meeting.message || "No message provided.")}</p>

          <div class="admin-response-box">
            <strong>Admin Response</strong>
            <p>${meeting.admin_response ? escapeHtml(meeting.admin_response) : "No response yet."}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderScholarAssistance(assistance) {
  const container = document.getElementById("scholarAssistanceContainer");

  if (!assistance || assistance.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No assistance requests</h3>
        <p>This scholar has not submitted any assistance requests yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = assistance
    .map((request) => {
      const submittedDate = formatPortalDate(request.created_at);
      const statusClass = getAssistanceStatusClass(request.status);
      const urgencyClass = getUrgencyClass(request.urgency);

      return `
        <article class="request-card">
          <div class="request-card-header">
            <div>
              <h3>${escapeHtml(request.assistance_type || "Assistance Request")}</h3>
              <p class="request-reference">Request #${request.id}</p>
            </div>

            <span class="status ${statusClass}">
              ${escapeHtml(request.status || "Pending")}
            </span>
          </div>

          <p>
            <strong>Urgency:</strong>
            <span class="urgency ${urgencyClass}">
              ${escapeHtml(request.urgency || "Not set")}
            </span>
          </p>

          <p><strong>Submitted:</strong> ${submittedDate}</p>
          <p><strong>Reason:</strong> ${escapeHtml(request.reason || "No reason provided.")}</p>

          <div class="admin-response-box">
            <strong>Admin Response</strong>
            <p>${request.admin_response ? escapeHtml(request.admin_response) : "No response yet."}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAdminNotes(notes) {
  const container = document.getElementById("adminNotesContainer");

  if (!notes || notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No admin notes</h3>
        <p>No private notes have been added for this scholar yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notes
    .map((note) => {
      const adminName = `${note.admin_first_name || ""} ${note.admin_last_name || ""}`.trim();
      const noteDate = formatPortalDate(note.created_at);

      return `
        <div class="note-card">
          <div class="note-meta">
            <strong>${escapeHtml(adminName || "Admin")}</strong>
            <span>${noteDate}</span>
          </div>

          <p>${escapeHtml(note.note)}</p>
        </div>
      `;
    })
    .join("");
}

async function addAdminNote(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");
  const scholarId = getScholarIdFromUrl();
  const noteInput = document.getElementById("adminNoteInput");
  const note = noteInput.value.trim();

  if (!note) {
    alert("Please write a note first.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/scholars/${scholarId}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        note
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not save note.");
      return;
    }

    alert("Admin note saved successfully.");
    noteInput.value = "";

    await loadScholarDetails();
  } catch (error) {
    console.error("Add admin note error:", error);
    alert("Could not connect to the server.");
  }
}

function formatPortalTime(timeValue) {
  if (!timeValue) {
    return "Not set";
  }

  const parts = String(timeValue).split(":");

  if (parts.length < 2) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);

  return date.toLocaleTimeString("en-JM", {
    hour: "numeric",
    minute: "2-digit"
  });
}

async function loadAdminDashboard() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  if (!user || user.role !== "admin") {
    alert("Admin access only.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/admin-stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not load dashboard.");
      return;
    }

    document.getElementById("totalScholarsStat").textContent =
      data.total_scholars ?? 0;

    document.getElementById("pendingReportsStat").textContent =
      data.pending_reports ?? 0;

    document.getElementById("pendingMeetingsStat").textContent =
      data.pending_meetings ?? 0;

    document.getElementById("pendingAssistanceStat").textContent =
      data.pending_assistance ?? 0;

    renderAdminRecentActivity(data.recent_activity || []);
  } catch (error) {
    console.error("Load admin dashboard error:", error);
    alert("Could not connect to the server.");
  }
}

function renderAdminRecentActivity(activityList) {
  const tableBody = document.getElementById("adminRecentActivityBody");

  if (!tableBody) {
    return;
  }

  if (!activityList || activityList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4">No recent activity found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = activityList
    .map((activity) => {
      const scholarName = `${activity.first_name || ""} ${activity.last_name || ""}`.trim();
      const date = formatPortalDate(activity.activity_date);
      const status = activity.status || "Pending";
      const statusClass = getGeneralStatusClass(status);

      return `
        <tr>
          <td>${date}</td>
          <td>${escapeHtml(scholarName || "Unknown Scholar")}</td>
          <td>
            <strong>${escapeHtml(activity.activity_type || "Activity")}</strong>
            <br>
            <span>${escapeHtml(activity.activity_detail || "")}</span>
          </td>
          <td>
            <span class="status ${statusClass}">
              ${escapeHtml(status)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

function getGeneralStatusClass(status) {
  switch (status) {
    case "Approved":
      return "approved";

    case "Reviewed":
    case "Completed":
      return "completed";

    case "Denied":
    case "Declined":
      return "declined";

    case "Need Correction":
    case "Need More Information":
    case "Rescheduled":
      return "rescheduled";

    default:
      return "pending";
  }
}