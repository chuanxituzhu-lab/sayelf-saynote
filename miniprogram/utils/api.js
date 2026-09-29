const { API_BASE_URL } = require("../config");

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${path}`,
      method: options.method || "GET",
      data: options.data,
      header: { "content-type": "application/json" },
      timeout: 10000,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        reject(new Error(`request failed: ${response.statusCode}`));
      },
      fail() {
        reject(new Error("local API unavailable"));
      },
    });
  });
}

function localDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function listToday() {
  return request(`/records?date=${localDateString()}`);
}

function createTextRecord(content) {
  return request("/records", {
    method: "POST",
    data: { content, kind: "text", source: "manual" },
  });
}

module.exports = { createTextRecord, listToday };
