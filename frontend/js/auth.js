function getToken() {
  return localStorage.getItem("token");
}
function setToken(token) {
  localStorage.setItem("token", token);
}
function removeToken() {
  localStorage.removeItem("token");
}
function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}
function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}
function removeUser() {
  localStorage.removeItem("user");
}
function isLoggedIn() {
  return !!getToken();
}
function isAdmin() {
  const user = getUser();
  return user && user.role === "admin";
}
function logout() {
  removeToken();
  removeUser();
  window.location.href = "/login.html";
}
function authHeaders() {
  const token = getToken();
  return token ? { "Authorization": "Bearer " + token } : {};
}
