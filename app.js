/* ============================================
   Straw Hut Media — Podcast Onboarding App
   ============================================ */

(function () {
  "use strict";

  // ---- State ----
  let currentSection = 1;
  const totalSections = 5;
  let approvedCompany = "";
  const uploadedFiles = { brand: [], inspo: [] };
  const MAX_INSPO_FILES = 10;

  // ---- DOM refs ----
  const gateScreen = document.getElementById("gate");
  const onboardingScreen = document.getElementById("onboarding");
  const checklistScreen = document.getElementById("checklist");
  const companyInput = document.getElementById("company-name");
  const gateError = document.getElementById("gate-error");
  const gateSubmit = document.getElementById("gate-submit");
  const displayCompany = document.getElementById("display-company");
  const checklistCompany = document.getElementById("checklist-company");
  const form = document.getElementById("onboarding-form");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-btn");
  const progressFill = document.getElementById("form-progress");
  const progressLabel = document.getElementById("progress-label");
  const formSummary = document.getElementById("form-summary");

  // ---- Helpers ----
  function show(el) { el.classList.remove("hidden"); }
  function hide(el) { el.classList.add("hidden"); }

  function switchScreen(target) {
    [gateScreen, onboardingScreen, checklistScreen].forEach(function (s) {
      s.classList.remove("active");
    });
    target.classList.add("active");
    window.scrollTo(0, 0);
  }

  function isApproved(name) {
    var lower = name.trim().toLowerCase();
    return APPROVED_COMPANIES.some(function (c) {
      return c.toLowerCase() === lower;
    });
  }

  // ---- Gate ----
  gateSubmit.addEventListener("click", function () {
    var name = companyInput.value.trim();
    if (!name) {
      companyInput.classList.add("input-error");
      return;
    }
    companyInput.classList.remove("input-error");
    if (isApproved(name)) {
      approvedCompany = name;
      hide(gateError);
      displayCompany.textContent = approvedCompany;
      checklistCompany.textContent = approvedCompany;
      switchScreen(onboardingScreen);
      updateProgress();
    } else {
      show(gateError);
    }
  });

  companyInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); gateSubmit.click(); }
  });
  companyInput.addEventListener("input", function () {
    hide(gateError);
    companyInput.classList.remove("input-error");
  });

  // ---- Multi-step form navigation ----
  function showSection(n) {
    currentSection = n;
    document.querySelectorAll(".form-section").forEach(function (s) {
      s.classList.remove("active");
    });
    var target = document.querySelector('.form-section[data-section="' + n + '"]');
    if (target) target.classList.add("active");

    prevBtn.disabled = n === 1;
    if (n === totalSections) {
      hide(nextBtn);
      show(submitBtn);
      buildSummary();
    } else {
      show(nextBtn);
      hide(submitBtn);
    }
    updateProgress();
    window.scrollTo(0, 0);
  }

  function updateProgress() {
    var pct = ((currentSection - 1) / (totalSections - 1)) * 100;
    progressFill.style.width = pct + "%";
    progressLabel.textContent = "Section " + currentSection + " of " + totalSections;
  }

  function validateCurrentSection() {
    var section = document.querySelector('.form-section[data-section="' + currentSection + '"]');
    var inputs = section.querySelectorAll("[required]");
    var valid = true;
    inputs.forEach(function (input) {
      if (input.type === "radio") {
        var group = section.querySelectorAll('input[name="' + input.name + '"]');
        var checked = Array.prototype.some.call(group, function (r) { return r.checked; });
        if (!checked) {
          valid = false;
          group.forEach(function (r) { r.closest(".radio-label").style.outline = "1px solid var(--color-error)"; });
        } else {
          group.forEach(function (r) { r.closest(".radio-label").style.outline = "none"; });
        }
      } else {
        if (!input.value.trim()) {
          valid = false;
          input.classList.add("input-error");
        } else {
          input.classList.remove("input-error");
        }
      }
    });
    return valid;
  }

  nextBtn.addEventListener("click", function () {
    if (!validateCurrentSection()) return;
    if (currentSection < totalSections) showSection(currentSection + 1);
  });

  prevBtn.addEventListener("click", function () {
    if (currentSection > 1) showSection(currentSection - 1);
  });

  // ---- Conditional visibility ----
  document.querySelectorAll('input[name="podcastStatus"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var details = document.getElementById("takeover-details");
      if (r.value === "takeover" && r.checked) show(details); else hide(details);
    });
  });

  document.querySelectorAll('input[name="hasBrandGuidelines"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var upload = document.getElementById("brand-guidelines-upload");
      if ((r.value === "yes" || r.value === "partial") && r.checked) show(upload); else hide(upload);
    });
  });

  document.querySelectorAll('input[name="recordingLocation"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var details = document.getElementById("client-location-details");
      if (r.value === "client-location" && r.checked) show(details); else hide(details);
    });
  });

  // ---- File uploads ----
  function setupFileUpload(inputId, listId, storageKey, maxFiles) {
    var input = document.getElementById(inputId);
    var list = document.getElementById(listId);
    var dropZone = input.closest(".file-upload-area");

    function renderList() {
      list.innerHTML = "";
      uploadedFiles[storageKey].forEach(function (f, i) {
        var li = document.createElement("li");
        li.innerHTML =
          '<span>' + escapeHtml(f.name) + ' <small>(' + formatSize(f.size) + ')</small></span>' +
          '<button class="remove-file" data-idx="' + i + '">&times;</button>';
        list.appendChild(li);
      });
      list.querySelectorAll(".remove-file").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          uploadedFiles[storageKey].splice(parseInt(btn.dataset.idx), 1);
          renderList();
        });
      });
    }

    function addFiles(files) {
      var limitError = document.getElementById("inspo-limit-error");
      for (var i = 0; i < files.length; i++) {
        if (maxFiles && uploadedFiles[storageKey].length >= maxFiles) {
          if (limitError) show(limitError);
          break;
        }
        uploadedFiles[storageKey].push(files[i]);
      }
      renderList();
    }

    input.addEventListener("change", function () {
      addFiles(input.files);
      input.value = "";
    });

    dropZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", function () {
      dropZone.classList.remove("drag-over");
    });
    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      addFiles(e.dataTransfer.files);
    });
  }

  setupFileUpload("brand-guidelines-file", "brand-file-list", "brand", null);
  setupFileUpload("inspiration-files", "inspo-file-list", "inspo", MAX_INSPO_FILES);

  // ---- Summary builder ----
  function buildSummary() {
    var data = getFormData();
    var html = "";

    html += '<h4>Podcast Basics</h4><dl>';
    html += row("Podcast Name", data.podcastName);
    html += row("Description", data.podcastDescription);
    html += row("Status", data.podcastStatus === "new" ? "New podcast from scratch" : "Taking over existing podcast");
    html += row("Brand", data.brandStatus === "existing" ? "Existing brand" : "New brand");
    if (data.podcastStatus === "takeover") {
      html += row("Existing URL", data.existingPodcastUrl || "—");
    }
    html += row("Genre", data.podcastGenre || "—");
    html += row("Target Audience", data.targetAudience || "—");
    html += "</dl>";

    html += '<h4>Branding</h4><dl>';
    var guidelineLabels = { yes: "Yes", no: "Need creation", partial: "Partial" };
    html += row("Has Guidelines", guidelineLabels[data.hasBrandGuidelines] || "—");
    html += row("Brand Colors", data.brandColors || "—");
    html += row("Fonts", data.brandFonts || "—");
    html += row("Voice / Tone", data.brandVoice || "—");
    if (uploadedFiles.brand.length) {
      html += row("Guideline Files", uploadedFiles.brand.map(function (f) { return escapeHtml(f.name); }).join(", "));
    }
    html += "</dl>";

    html += '<h4>Inspiration</h4><dl>';
    if (uploadedFiles.inspo.length) {
      html += row("Images", uploadedFiles.inspo.map(function (f) { return escapeHtml(f.name); }).join(", "));
    }
    html += row("Podcasts Admired", data.inspoPodcasts || "—");
    html += row("Brands Admired", data.inspoBrands || "—");
    html += row("Visual Notes", data.inspoNotes || "—");
    html += "</dl>";

    html += '<h4>Recording &amp; Logistics</h4><dl>';
    var locLabels = { studio: "Straw Hut Studio", virtual: "Virtual / Remote", "client-location": "Client location", undecided: "TBD" };
    html += row("Location", locLabels[data.recordingLocation] || "—");
    if (data.recordingLocation === "client-location") {
      html += row("Address", data.locationAddress || "—");
    }
    html += row("Frequency", data.episodeFrequency || "—");
    html += row("Episode Length", data.episodeLength || "—");
    html += row("Host(s)", data.hostsInfo || "—");
    var guestLabels = { yes: "Yes, regularly", sometimes: "Sometimes", no: "No", undecided: "TBD" };
    html += row("Guests", guestLabels[data.hasGuests] || "—");
    html += row("Launch Date", data.launchDate || "—");
    html += "</dl>";

    formSummary.innerHTML = html;
  }

  function row(label, value) {
    return "<dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd>";
  }

  function getFormData() {
    var data = {};
    var elements = form.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.name) continue;
      if (el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
      } else if (el.type === "checkbox") {
        data[el.name] = el.checked;
      } else if (el.type !== "file") {
        data[el.name] = el.value;
      }
    }
    return data;
  }

  // ---- Submit ----
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var confirmBox = document.getElementById("confirm-submit");
    if (!confirmBox.checked) {
      confirmBox.closest(".checkbox-label").style.outline = "1px solid var(--color-error)";
      return;
    }
    confirmBox.closest(".checkbox-label").style.outline = "none";

    var data = getFormData();
    data.company = approvedCompany;
    data.submittedAt = new Date().toISOString();
    data.brandFiles = uploadedFiles.brand.map(function (f) { return f.name; });
    data.inspoFiles = uploadedFiles.inspo.map(function (f) { return f.name; });

    // In production, POST this to your backend. For now, log it.
    console.log("=== ONBOARDING SUBMISSION ===");
    console.log(JSON.stringify(data, null, 2));

    // Mark brainstorm meeting as the active first step
    switchScreen(checklistScreen);
    activateFirstTask();
  });

  // ---- Checklist ----
  function activateFirstTask() {
    var first = document.querySelector('.checklist-items li[data-task="brainstorm-meeting"]');
    if (first) first.classList.add("active");
  }

  // ---- Utils ----
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

})();
