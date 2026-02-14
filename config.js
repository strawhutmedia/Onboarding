/**
 * Approved Companies Configuration
 *
 * Companies are managed via the Admin Portal (admin.html)
 * and stored in localStorage. The fallback list below is used
 * only if no companies have been added through the admin.
 */
var APPROVED_COMPANIES = (function () {
  var STORAGE_KEY = "shm_approved_companies";
  var fallback = [
    "Acme Corp",
    "Example Company",
    "Demo Client",
  ];

  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      var parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) { /* ignore */ }

  return fallback;
})();
