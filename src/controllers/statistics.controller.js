

const Order = require("../models/order.model");
const Product = require("../models/book.model");
const User = require("../models/user.model");

// 🧮 Controller thống kê tổng quan
exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 📅 Xử lý lọc theo ngày nếu có
    const filter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // đầu ngày
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // cuối ngày
      filter.createdAt = { $gte: start, $lte: end };
    }

    // 🔍 Lấy đơn hàng đã giao (và chưa xóa) + populate user
    const orders = await Order.find({
      status: "delivered",
      isDeleted: false,
      ...filter,
    }).populate("user", "name email phone gender isActive address");

    if (!orders.length) {
      return res.status(200).json({
        message: "Không có dữ liệu trong khoảng thời gian này",
        totalRevenue: 0,
        totalBooksSold: 0,
        totalCustomers: 0,
        topProducts: [],
        topCustomers: [],
        revenueByDate: [],
      });
    }

    // 🧾 Tổng doanh thu
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    // 📦 Tổng sản phẩm bán ra
    const totalBooksSold = orders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + (item.quantity || 0), 0),
      0
    );

    // 👥 Thống kê khách hàng
    const customerStats = {};
    orders.forEach((order) => {
      const user = order.user;
      if (!user) return; // nếu user bị xóa

      const id = user._id.toString();
      if (!customerStats[id]) {
        customerStats[id] = {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          totalSpent: 0,
          ordersCount: 0,
          isActive: user.isActive,
        };
      }
      customerStats[id].totalSpent += order.total;
      customerStats[id].ordersCount += 1;
    });

    const totalCustomers = Object.keys(customerStats).length;

    // 🏆 Top khách hàng chi tiêu nhiều
    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // 🔥 Thống kê sản phẩm bán chạy
    const productSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            title: item.title,
            image: item.image,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productSales[item.productId].totalQuantity += item.quantity;
        productSales[item.productId].totalRevenue += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // 📅 Doanh thu theo ngày
    const revenueByDate = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + order.total;
    });

    const revenueArray = Object.keys(revenueByDate)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((date) => ({
        date,
        total: revenueByDate[date],
      }));

    // ✅ Trả dữ liệu về frontend
    res.status(200).json({
      totalRevenue,
      totalBooksSold,
      totalCustomers,
      topProducts,
      topCustomers,
      revenueByDate: revenueArray,
    });
  } catch (error) {
    console.error("Lỗi khi thống kê:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
