const express = require("express")
const dotenv = require("dotenv")
const connectDB = require("./src/config/mongodb")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const { errorHandler } = require("./src/middleware/error.middleware")
const path = require("path")

// Import routes
const authRoutes = require("./src/routes/auth.routes")
const userRoutes = require("./src/routes/user.routes")
const employeeRoutes = require("./src/routes/employee.routes")
const departmentRoutes = require("./src/routes/department.routes")
const transactionRoutes = require("./src/routes/transaction.routes")
const payrollRoutes = require("./src/routes/payroll.routes")
const attendanceRoutes = require("./src/routes/attendance.routes")

// Cấu hình dotenv
dotenv.config()

// Kết nối MongoDB
connectDB()

// Khởi tạo Express app
const app = express()

// Cấu hình CORS - cho phép frontend truy cập
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true, // Cho phép gửi cookie qua CORS
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Middleware
app.use(cookieParser()) // Xử lý cookie
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Phục vụ tệp tĩnh
app.use(express.static(path.join(__dirname, "public")))

// Middleware để log request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/departments", departmentRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/payrolls", payrollRoutes)
app.use("/api/attendance", attendanceRoutes)

// Route mặc định
app.get("/", (req, res) => res.send("🩺 HRIS API is running"))

// Middleware xử lý lỗi
app.use(errorHandler)

// Khởi động server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
