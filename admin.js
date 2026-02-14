/* ============================================
   Straw Hut Media — Admin Portal
   ============================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "shm_approved_companies";
  var SUBS_KEY = "shm_submissions";
  var CREDENTIALS = {
    username: "strawhutmedia",
    passwordHash: "a]T9#kP2x!mW"
  };

  // ---- DOM refs ----
  var loginScreen = document.getElementById("admin-login");
  var dashboard = document.getElementById("admin-dashboard");
  var usernameInput = document.getElementById("admin-username");
  var passwordInput = document.getElementById("admin-password");
  var loginBtn = document.getElementById("login-btn");
  var loginError = document.getElementById("login-error");
  var logoutBtn = document.getElementById("logout-btn");
  var newCompanyInput = document.getElementById("new-company");
  var addBtn = document.getElementById("add-company-btn");
  var addError = document.getElementById("add-error");
  var companyList = document.getElementById("company-list");
  var companyCount = document.getElementById("company-count");
  var emptyState = document.getElementById("empty-state");
  var submissionsList = document.getElementById("submissions-list");
  var submissionCount = document.getElementById("submission-count");
  var submissionsEmpty = document.getElementById("submissions-empty");

  // ---- Helpers ----
  function show(el) { el.classList.remove("hidden"); }
  function hide(el) { el.classList.add("hidden"); }

  function switchScreen(target) {
    [loginScreen, dashboard].forEach(function (s) {
      s.classList.remove("active");
    });
    target.classList.add("active");
  }

  // ---- Tabs ----
  var tabs = document.querySelectorAll(".admin-tab");
  var tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.dataset.tab;
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tabContents.forEach(function (tc) { tc.classList.remove("active"); });
      tab.classList.add("active");
      document.getElementById("tab-" + target).classList.add("active");
    });
  });

  // ---- Company storage ----
  function getCompanies() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return [];
  }

  function saveCompanies(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // ---- Submissions storage ----
  function getSubmissions() {
    try {
      var stored = localStorage.getItem(SUBS_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    return [];
  }

  function saveSubmissions(list) {
    localStorage.setItem(SUBS_KEY, JSON.stringify(list));
  }

  // ---- Auth ----
  function checkCredentials(username, password) {
    return username === CREDENTIALS.username && password === "$4ForLife";
  }

  loginBtn.addEventListener("click", function () {
    var user = usernameInput.value.trim();
    var pass = passwordInput.value;

    if (!user || !pass) {
      show(loginError);
      return;
    }

    if (checkCredentials(user, pass)) {
      hide(loginError);
      sessionStorage.setItem("shm_admin_auth", "1");
      switchScreen(dashboard);
      renderCompanies();
      renderSubmissions();
    } else {
      show(loginError);
    }
  });

  passwordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); loginBtn.click(); }
  });
  usernameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); loginBtn.click(); }
  });

  usernameInput.addEventListener("input", function () { hide(loginError); });
  passwordInput.addEventListener("input", function () { hide(loginError); });

  logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem("shm_admin_auth");
    usernameInput.value = "";
    passwordInput.value = "";
    switchScreen(loginScreen);
  });

  if (sessionStorage.getItem("shm_admin_auth") === "1") {
    switchScreen(dashboard);
    renderCompanies();
    renderSubmissions();
  }

  // ---- Company CRUD ----
  function renderCompanies() {
    var companies = getCompanies();
    companyCount.textContent = companies.length;
    companyList.innerHTML = "";

    if (companies.length === 0) {
      show(emptyState);
      return;
    }

    hide(emptyState);

    companies.forEach(function (name, idx) {
      var div = document.createElement("div");
      div.className = "company-item";
      div.innerHTML =
        '<span class="company-name">' + escapeHtml(name) + '</span>' +
        '<button class="company-remove" data-idx="' + idx + '" title="Remove">&times;</button>';
      companyList.appendChild(div);
    });

    companyList.querySelectorAll(".company-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.dataset.idx);
        var companies = getCompanies();
        companies.splice(idx, 1);
        saveCompanies(companies);
        renderCompanies();
      });
    });
  }

  addBtn.addEventListener("click", function () {
    addCompany();
  });

  newCompanyInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); addCompany(); }
  });

  newCompanyInput.addEventListener("input", function () {
    hide(addError);
    newCompanyInput.classList.remove("input-error");
  });

  function addCompany() {
    var name = newCompanyInput.value.trim();
    if (!name) {
      newCompanyInput.classList.add("input-error");
      return;
    }

    var companies = getCompanies();
    var duplicate = companies.some(function (c) {
      return c.toLowerCase() === name.toLowerCase();
    });

    if (duplicate) {
      addError.textContent = "\"" + name + "\" is already in the list.";
      show(addError);
      return;
    }

    companies.push(name);
    saveCompanies(companies);
    newCompanyInput.value = "";
    newCompanyInput.classList.remove("input-error");
    hide(addError);
    renderCompanies();
  }

  // ---- Submissions rendering ----
  function renderSubmissions() {
    var submissions = getSubmissions();
    submissionCount.textContent = submissions.length;
    submissionsList.innerHTML = "";

    if (submissions.length === 0) {
      show(submissionsEmpty);
      return;
    }

    hide(submissionsEmpty);

    // Sort by date descending (newest first)
    submissions.sort(function (a, b) {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

    submissions.forEach(function (sub, idx) {
      var card = document.createElement("div");
      card.className = "submission-card";

      var completeness = calcCompleteness(sub);
      var date = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      }) : "Unknown date";

      var statusClass = completeness >= 80 ? "status-good" : completeness >= 50 ? "status-partial" : "status-low";

      card.innerHTML =
        '<div class="submission-header" data-idx="' + idx + '">' +
          '<div class="submission-info">' +
            '<strong class="submission-company">' + escapeHtml(sub.company || "Unknown Company") + '</strong>' +
            '<span class="submission-meta">' + escapeHtml((sub.contactFirstName || "") + " " + (sub.contactLastName || "")) + ' &middot; ' + escapeHtml(date) + '</span>' +
          '</div>' +
          '<div class="submission-right">' +
            '<span class="submission-completeness ' + statusClass + '">' + completeness + '% complete</span>' +
            '<span class="submission-toggle">&#9660;</span>' +
          '</div>' +
        '</div>' +
        '<div class="submission-details hidden" id="sub-details-' + idx + '">' +
          buildSubmissionDetails(sub) +
          '<div class="submission-actions">' +
            '<button class="btn secondary btn-sm delete-sub" data-idx="' + idx + '">Delete</button>' +
          '</div>' +
        '</div>';

      submissionsList.appendChild(card);
    });

    // Toggle expand/collapse
    submissionsList.querySelectorAll(".submission-header").forEach(function (header) {
      header.addEventListener("click", function () {
        var idx = header.dataset.idx;
        var details = document.getElementById("sub-details-" + idx);
        var toggle = header.querySelector(".submission-toggle");
        if (details.classList.contains("hidden")) {
          details.classList.remove("hidden");
          toggle.innerHTML = "&#9650;";
        } else {
          details.classList.add("hidden");
          toggle.innerHTML = "&#9660;";
        }
      });
    });

    // Delete buttons
    submissionsList.querySelectorAll(".delete-sub").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.dataset.idx);
        var subs = getSubmissions();
        // Re-sort to match display order
        subs.sort(function (a, b) {
          return new Date(b.submittedAt) - new Date(a.submittedAt);
        });
        subs.splice(idx, 1);
        saveSubmissions(subs);
        renderSubmissions();
      });
    });
  }

  function calcCompleteness(sub) {
    var fields = [
      sub.contactFirstName, sub.contactLastName, sub.contactEmail,
      sub.contactPhone, sub.contactRole, sub.contactTimezone, sub.preferredContact,
      sub.podcastName, sub.podcastDescription, sub.podcastStatus, sub.brandStatus,
      sub.podcastGenre, sub.podcastFormat, sub.targetAudience,
      sub.hasBrandGuidelines, sub.brandColors, sub.brandFonts, sub.brandVoice,
      sub.inspoPodcasts, sub.inspoBrands,
      sub.needsMusic, sub.musicVibe,
      sub.socialWebsite, sub.socialInstagram,
      sub.recordingLocation, sub.episodeFrequency, sub.episodeLength, sub.hostsInfo,
      sub.hasGuests, sub.isVideo,
      sub.launchEpisodes, sub.teaserIdeas,
      sub.goals
    ];
    var filled = 0;
    fields.forEach(function (f) {
      if (f && f.toString().trim()) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  }

  function buildSubmissionDetails(sub) {
    var html = '<div class="sub-detail-grid">';

    html += sectionBlock("Contact Information", [
      ["Name", (sub.contactFirstName || "") + " " + (sub.contactLastName || "")],
      ["Email", sub.contactEmail],
      ["Phone", sub.contactPhone],
      ["Role", sub.contactRole],
      ["Timezone", sub.contactTimezone],
      ["Preferred Contact", sub.preferredContact]
    ]);

    html += sectionBlock("Podcast Basics", [
      ["Podcast Name", sub.podcastName],
      ["Description", sub.podcastDescription],
      ["Status", sub.podcastStatus],
      ["Brand Status", sub.brandStatus],
      ["Genre", sub.podcastGenre],
      ["Format", sub.podcastFormat],
      ["Target Audience", sub.targetAudience]
    ]);

    html += sectionBlock("Branding", [
      ["Has Guidelines", sub.hasBrandGuidelines],
      ["Brand Colors", sub.brandColors],
      ["Fonts", sub.brandFonts],
      ["Voice / Tone", sub.brandVoice],
      ["Brand Files", sub.brandFiles && sub.brandFiles.length ? sub.brandFiles.join(", ") : null],
      ["Logo Files", sub.logoFiles && sub.logoFiles.length ? sub.logoFiles.join(", ") : null]
    ]);

    html += sectionBlock("Inspiration", [
      ["Podcasts Admired", sub.inspoPodcasts],
      ["Brands Admired", sub.inspoBrands],
      ["Visual Notes", sub.inspoNotes],
      ["Inspiration Files", sub.inspoFiles && sub.inspoFiles.length ? sub.inspoFiles.join(", ") : null]
    ]);

    html += sectionBlock("Music & Audio", [
      ["Needs Music", sub.needsMusic],
      ["Music Vibe", sub.musicVibe],
      ["Music References", sub.musicReferences],
      ["Sound Effects", sub.wantsSFX],
      ["Music Files", sub.musicFiles && sub.musicFiles.length ? sub.musicFiles.join(", ") : null]
    ]);

    html += sectionBlock("Social Media & Web", [
      ["Website", sub.socialWebsite],
      ["Instagram", sub.socialInstagram],
      ["X (Twitter)", sub.socialTwitter],
      ["TikTok", sub.socialTiktok],
      ["YouTube", sub.socialYoutube],
      ["LinkedIn", sub.socialLinkedin],
      ["Social Management", sub.manageSocial],
      ["Short-form Clips", sub.wantsClips]
    ]);

    html += sectionBlock("Recording & Logistics", [
      ["Location", sub.recordingLocation],
      ["Address", sub.locationAddress],
      ["Frequency", sub.episodeFrequency],
      ["Episode Length", sub.episodeLength],
      ["Host(s)", sub.hostsInfo],
      ["Guests", sub.hasGuests],
      ["Video", sub.isVideo],
      ["Launch Date", sub.launchDate]
    ]);

    html += sectionBlock("Marketing & Launch", [
      ["Launch Episodes", sub.launchEpisodes],
      ["Teaser Ideas", sub.teaserIdeas],
      ["Marketing Notes", sub.marketingNotes],
      ["Goals", sub.goals]
    ]);

    if (sub.anythingElse) {
      html += sectionBlock("Additional Notes", [
        ["Notes", sub.anythingElse]
      ]);
    }

    html += '</div>';
    return html;
  }

  function sectionBlock(title, fields) {
    var html = '<div class="sub-section">';
    html += '<h4 class="sub-section-title">' + escapeHtml(title) + '</h4>';
    html += '<dl class="sub-fields">';
    fields.forEach(function (pair) {
      var label = pair[0];
      var value = pair[1];
      var hasValue = value && value.toString().trim();
      html += '<dt>' + escapeHtml(label) + '</dt>';
      html += '<dd class="' + (hasValue ? '' : 'missing') + '">' +
        (hasValue ? escapeHtml(value.toString()) : 'Not provided') + '</dd>';
    });
    html += '</dl></div>';
    return html;
  }

  // ---- Utils ----
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

})();
