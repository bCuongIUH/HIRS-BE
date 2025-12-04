

const Order = require("../models/order.model");
const Product = require("../models/book.model");
const User = require("../models/user.model");

// 🧮 Controller thống kê tổng quan
// exports.getStatistics = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     // 📅 Xử lý lọc theo ngày nếu có
//     const filter = {};
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       start.setHours(0, 0, 0, 0); // đầu ngày
//       const end = new Date(endDate);
//       end.setHours(23, 59, 59, 999); // cuối ngày
//       filter.createdAt = { $gte: start, $lte: end };
//     }

//     // 🔍 Lấy đơn hàng đã giao (và chưa xóa) + populate user
//     const orders = await Order.find({
//       status: "delivered",
//       isDeleted: false,
//       ...filter,
//     }).populate("user", "name email phone gender isActive address");

//     if (!orders.length) {
//       return res.status(200).json({
//         message: "Không có dữ liệu trong khoảng thời gian này",
//         totalRevenue: 0,
//         totalBooksSold: 0,
//         totalCustomers: 0,
//         topProducts: [],
//         topCustomers: [],
//         revenueByDate: [],
//       });
//     }

//     // 🧾 Tổng doanh thu
//     const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

//     // 📦 Tổng sản phẩm bán ra
//     const totalBooksSold = orders.reduce(
//       (sum, order) => sum + order.items.reduce((s, item) => s + (item.quantity || 0), 0),
//       0
//     );

//     // 👥 Thống kê khách hàng
//     const customerStats = {};
//     orders.forEach((order) => {
//       const user = order.user;
//       if (!user) return; // nếu user bị xóa

//       const id = user._id.toString();
//       if (!customerStats[id]) {
//         customerStats[id] = {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           phone: user.phone,
//           gender: user.gender,
//           totalSpent: 0,
//           ordersCount: 0,
//           isActive: user.isActive,
//         };
//       }
//       customerStats[id].totalSpent += order.total;
//       customerStats[id].ordersCount += 1;
//     });

//     const totalCustomers = Object.keys(customerStats).length;

//     // 🏆 Top khách hàng chi tiêu nhiều
//     const topCustomers = Object.values(customerStats)
//       .sort((a, b) => b.totalSpent - a.totalSpent)
//       .slice(0, 10);

//     // 🔥 Thống kê sản phẩm bán chạy
//     const productSales = {};
//     orders.forEach((order) => {
//       order.items.forEach((item) => {
//         if (!productSales[item.productId]) {
//           productSales[item.productId] = {
//             title: item.title,
//             productId: item.productId,
//             image: item.image,
//             totalQuantity: 0,
//             totalRevenue: 0,
//           };
//         }
//         productSales[item.productId].totalQuantity += item.quantity;
//         productSales[item.productId].totalRevenue += item.total;
//       });
//     });

//     const topProducts = Object.values(productSales)
//       .sort((a, b) => b.totalQuantity - a.totalQuantity)
//       .slice(0, 5);

//     // 📅 Doanh thu theo ngày
//     const revenueByDate = {};
//     orders.forEach((order) => {
//       const date = order.createdAt.toISOString().split("T")[0];
//       revenueByDate[date] = (revenueByDate[date] || 0) + order.total;
//     });

//     const revenueArray = Object.keys(revenueByDate)
//       .sort((a, b) => new Date(a) - new Date(b))
//       .map((date) => ({
//         date,
//         total: revenueByDate[date],
//       }));

//     // ✅ Trả dữ liệu về frontend
//     res.status(200).json({
//       totalRevenue,
//       totalBooksSold,
//       totalCustomers,
//       topProducts,
//       topCustomers,
//       revenueByDate: revenueArray,
//     });
//   } catch (error) {
//     console.error("Lỗi khi thống kê:", error);
//     res.status(500).json({ message: "Lỗi server", error: error.message });
//   }
// };
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
    for (const order of orders) {
      for (const item of order.items) {
        // Tìm sản phẩm tương ứng từ productId
        const product = await Product.findById(item.productId);  // Sử dụng `Product` để tìm sản phẩm theo ID

        if (product) {
          const ISSN = product.ISSN || "Không có ISSN"; // Lấy ISSN từ sản phẩm, nếu có

          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              title: item.title,
              productId: item.productId,
              image: item.image,
              ISSN: ISSN, // Lưu ISSN vào thống kê sản phẩm
              totalQuantity: 0,
              totalRevenue: 0,
            };
          }
          productSales[item.productId].totalQuantity += item.quantity;
          productSales[item.productId].totalRevenue += item.total;
        }
      }
    }

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

//
exports.getTopProducts = async (req, res) => {
  try {
    // 🔍 Lấy đơn hàng đã giao (và chưa xóa) + populate user
    const orders = await Order.find({
      status: "delivered",
      isDeleted: false,
    }).populate("user", "name email phone gender isActive address");

    if (!orders.length) {
      return res.status(200).json({
        message: "Không có đơn hàng nào",
        topProducts: [],
      });
    }

    // 🔥 Thống kê sản phẩm bán chạy
    const productSales = {};
    for (const order of orders) {
      for (const item of order.items) {
        // Tìm sản phẩm tương ứng từ productId và populate category
        const product = await Product.findById(item.productId).populate("category", "name");  // Populate category

        if (product) {
          const ISSN = product.ISSN || "Không có ISSN"; // Lấy ISSN từ sản phẩm, nếu có
          const categoryName = product.category?.name || "Không có danh mục"; // Lấy tên danh mục
           const author = product.author || "Không có tác giả";
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              title: item.title,
              productId: item.productId,
              image: item.image,
              ISSN: ISSN, 
                author: author,
              category: categoryName,
              totalQuantity: 0,
              totalRevenue: 0,
            };
          }
          productSales[item.productId].totalQuantity += item.quantity;
          productSales[item.productId].totalRevenue += item.total;
        }
      }
    }

    // 🏆 Top sản phẩm bán chạy
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)  // Sắp xếp theo tổng số lượng bán
      .slice(0, 10);  // Chỉ lấy top 10 sản phẩm bán chạy nhất

    // ✅ Trả dữ liệu về frontend
    res.status(200).json({
      topProducts,
    });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm bán chạy:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
