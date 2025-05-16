const advancedResults = (model, populate) => async (req, res, next) => {
    let query
  
    // Sao chép req.query
    const reqQuery = { ...req.query }
  
    // Các trường cần loại bỏ
    const removeFields = ["select", "sort", "page", "limit"]
  
    // Loại bỏ các trường khỏi reqQuery
    removeFields.forEach((param) => delete reqQuery[param])
  
    // Tạo chuỗi query
    let queryStr = JSON.stringify(reqQuery)
  
    // Tạo các toán tử ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)
  
    // Tìm tài nguyên
    query = model.find(JSON.parse(queryStr))
  
    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ")
      query = query.select(fields)
    }
  
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ")
      query = query.sort(sortBy)
    } else {
      query = query.sort("-createdAt")
    }
  
    // Pagination
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Number.parseInt(req.query.limit, 10) || 25
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const total = await model.countDocuments(JSON.parse(queryStr))
  
    query = query.skip(startIndex).limit(limit)
  
    if (populate) {
      query = query.populate(populate)
    }
  
    // Thực thi query
    const results = await query
  
    // Pagination result
    const pagination = {}
  
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      }
    }
  
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      }
    }
  
    res.advancedResults = {
      success: true,
      count: results.length,
      pagination,
      data: results,
    }
  
    next()
  }
  
  module.exports = advancedResults
  