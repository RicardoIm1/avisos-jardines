// ==================== AUTH ====================

// LOGIN
async function login(email, password) {
  return API.login(email, password);
}

// LOGOUT
function logout() {
  API.logout();
}