// calc_hash.js
const crypto = require("crypto");

const secret = "JBL1VYBQA8B1WF5ZTS6UK94L6UJ4OBBU"; // 🔹 thay bằng key sandbox của bạn
const signData = process.argv[2]; // Dữ liệu truyền vào dòng lệnh

if (!signData) {
  console.error("❌ Vui lòng truyền vào signData sau tên file!");
  process.exit(1);
}

// Tính hash
const hmac = crypto.createHmac("sha512", secret);
const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

console.log("\n✅ Chuỗi cần ký:");
console.log(signData);
console.log("\n🔐 Kết quả chữ ký hợp lệ:");
console.log(signed);
