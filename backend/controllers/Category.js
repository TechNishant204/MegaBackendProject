const Category = require("../models/Category");

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    //validation
    if (!name) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    //create entry
    const CategoryDetails = await Category.create(
      { name: name },
      { description: description }
    );
    console.log(CategoryDetails);

    return res.status(200).json({
      success: true,
      message: "Category created successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error occurred while creating category",
      error: err.message,
    });
  }
};

//===========================================================================================================//

// GET- Fetched all tags
exports.showAllCategories = async (req, res) => {
  try {
    console.log("Inside SHOW ALL CATEGORIES");
    const allCategories = await Category.find(
      {},
      { name: true, description: true }
    );
    console.log(allCategories);
    return res.status(200).json({
      success: true,
      message: "Categories fetched Successfully...",
      data: allCategories,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while fetching all Category",
      error: err.message,
    });
  }
};

//===========================================================================================================//

//Category Page Details Handler
exports.CategoryPageDetails = async (req, res) => {
  try {
    // data fetch
    const { categoryId } = req.body;

    //Get courses for the specified category based on the category id
    // use populate to view full course
    const selectedCategory = await Category.findById(categoryId)
      .populate("courses")
      .exec();
    console.log(selectedCategory);

    //Handle the case when the category is not found
    if (!selectedCategory) {
      console.log("Category not found");
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    //Handle the case when there are no courses
    if (selectedCategory.courses.length === 0) {
      console.log("No courses found for the selected Category");
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected Category",
      });
    }

    const selectedCourses = selectedCategory.courses;

    //Get courses for other categories
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    })
      .populate("courses")
      .exec();

    let differentCourses = [];
    // here we are looping through each category and adding its courses to the differentCourses array
    for (const category of categoriesExceptSelected) {
      differentCourses.push(...category.courses);
    }

    //Get Top-selling courses across all categories
    const allCategories = await Category.find().populate("courses").exec();
    const allCourses = allCategories.flatMap((category) => category.courses);
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // return responses
    res.status(200).json({
      selectedCourses: selectedCourses,
      differentCourses: differentCourses,
      mostSellingCourses: mostSellingCourses,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while fetching Category Page Details",
      error: err.message,
    });
  }
};
