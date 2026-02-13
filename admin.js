/* ============================================
   Straw Hut Media — Admin Portal
   ============================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "shm_approved_companies";
  var CREDENTIALS = {
    username: "strawhutmedia",
    passwordHash: "a]T9#kP2x!mW"  // simple obfuscation — not real security
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

  // ---- Helpers ----
  function show(el) { el.classList.remove("hidden"); }
  function hide(el) { el.classList.add("hidden"); }

  function switchScreen(target) {
    [loginScreen, dashboard].forEach(function (s) {
      s.classList.remove("active");
    });
    target.classList.add("active");
  }

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
    } else {
      show(loginError);
    }
  });

  // Allow Enter key to submit login
  passwordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); loginBtn.click(); }
  });
  usernameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); loginBtn.click(); }
  });

  // Clear error on input
  usernameInput.addEventListener("input", function () { hide(loginError); });
  passwordInput.addEventListener("input", function () { hide(loginError); });

  // Logout
  logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem("shm_admin_auth");
    usernameInput.value = "";
    passwordInput.value = "";
    switchScreen(loginScreen);
  });

  // ---- Check existing session ----
  if (sessionStorage.getItem("shm_admin_auth") === "1") {
    switchScreen(dashboard);
    renderCompanies();
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

  // ---- Utils ----
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

})();
