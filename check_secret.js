// check_secret.js
const fs = require("fs");
const secret = require("./src/config/vnpay.config").vnp_HashSecret || "";
console.log("secret length:", secret.length);
console.log("secret (visible):", secret);
console.log("secret (hex bytes):", Buffer.from(secret, "utf8").toString("hex"));
