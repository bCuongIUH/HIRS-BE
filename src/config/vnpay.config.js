const crypto = require("crypto");
require("dotenv").config();

const vnp_PayUrl = process.env.VNP_URL;
const vnp_Returnurl = process.env.VNP_RETURNURL;
const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_ApiUrl = process.env.VNP_APIURL;

// Hàm tạo SHA256
const hmacSHA256 = (key, data) => {
  return crypto
    .createHmac("sha256", Buffer.from(key, "utf-8"))
    .update(data, "utf-8")
    .digest("hex");
};

// Sắp xếp & hash các trường
const hashAllFields = (fields) => {
  const sortedKeys = Object.keys(fields).sort();
  const query = sortedKeys.map((key) => `${key}=${fields[key]}`).join("&");
  return hmacSHA256(vnp_HashSecret, query);
};

// Lấy IP client
const getIpAddress = (req) =>
  req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

// Tạo số ngẫu nhiên cho mã giao dịch
const getRandomNumber = (len) => {
  const chars = "0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

module.exports = {
  vnp_PayUrl,
  vnp_Returnurl,
  vnp_TmnCode,
  vnp_HashSecret,
  vnp_ApiUrl,
  hmacSHA256,
  hashAllFields,
  getIpAddress,
  getRandomNumber,
};
