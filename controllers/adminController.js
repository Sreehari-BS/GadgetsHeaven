const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const ImageKit = require('imagekit');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel');
const Admin = require('../models/adminModel');
const Banner = require('../models/bannerModel');
const Coupon = require('../models/couponModel');
const Offer = require('../models/offerModel');
require('dotenv').config();

// Login
const loadAdminLogin = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.render('adminLogin');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const saveAdminData = async (phoneNumber, password, res) => {
  try {
    const existingAdmin = await Admin.findOne({ adminPhoneNumber: phoneNumber });
    if (existingAdmin) {
      return;
    }

    const admin = new Admin({
      adminPhoneNumber: phoneNumber,
      adminPassword: password,
    });
    await admin.save();
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};
saveAdminData(process.env.ADMIN_PHONE_NUMBER, process.env.ADMIN_PASSWORD);

const verifyLogin = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { phoneNumber } = req.body;
    const { password } = req.body;

    const admin = await Admin.findOne({ adminPhoneNumber: phoneNumber });

    if (admin && admin.adminPassword === password) {
      req.session.admin_id = admin._id;
      res.redirect('/admin/home');
    } else {
      res.render('adminLogin', { message: 'Phone Number and password are Incorrect' });
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Dashboard
const loadDashboard = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const adminData = await Admin.findById({ _id: req.session.admin_id });
    const orderData = await Order.find().populate('purchasedProducts.product');
    const categoryData = await Category.find();
    let totalOrders = 0;
    let sales = 0;
    let returns = 0;
    let cancelled = 0;
    orderData.forEach((item) => {
      // totalOrders += item.purchasedProducts.length
      item.purchasedProducts.forEach((product) => {
        totalOrders += product.quantity;
        if (product.status === 'Delivered') {
          sales += product.quantity;
        } else if (product.status === 'Returned') {
          returns += product.quantity;
        } else if (product.status === 'Cancelled') {
          cancelled += product.quantity;
        }
      });
    });

    res.render('adminHome', {
      admin: adminData, orderData, totalOrders, sales, returns, cancelled, categoryData,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadMoreDashboard = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userData = await User.find();
    const orderData = await Order.find().populate('purchasedProducts.product');
    const categoryData = await Category.find();

    let userCount = 0;
    let totalRevenue = 0;
    let activeUsers = 0;
    let codRevenue = 0;
    let razor_payRevenue = 0;

    userData.forEach((user) => {
      if (user.isBlocked === 0) {
        userCount++;
      }
    });

    orderData.forEach((order) => {
      order.purchasedProducts.forEach((product) => {
        if (product.status === 'Delivered') {
          totalRevenue += (product.quantity * product.product.price);
          if (product.paymentMethod === 'COD') {
            codRevenue += (product.quantity * product.product.price);
          } else if (product.paymentMethod === 'razor_pay') {
            razor_payRevenue += (product.quantity * product.product.price);
          }
        }
      });
    });

    if (req.session.user_id !== undefined && req.session.user_id !== null) {
      activeUsers++;
    }

    const salesAmount = [];

    categoryData.forEach((category) => {
      let sales = 0;
      orderData.forEach((order) => {
        order.purchasedProducts.forEach((product) => {
          if (product.product.category.toString() === category._id.toString()) {
            if (product.status === 'Delivered') {
              sales += (product.quantity * product.product.price);
            }
          }
        });
      });
      salesAmount.push(sales);
    });
    const categorySales = salesAmount;

    const week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const year = ['2021', '2022', '2023', '2024', '2025', '2026', '2027'];
    const daySales = new Array(week.length).fill(0);
    const monthSales = new Array(month.length).fill(0);
    const yearSales = new Array(year.length).fill(0);

    orderData.forEach((order) => {
      order.purchasedProducts.forEach((product) => {
        const date = new Date(product.date);
        const purchasedWeek = getWeek(date);
        const currentDate = new Date();
        const currentWeek = getWeek(currentDate);
        const index = week.indexOf(week[date.getDay()]);

        if (purchasedWeek === currentWeek) {
          if (product.status !== 'Cancelled' && product.status !== 'Returned') {
            daySales[index] += product.quantity;
          }
        }
      });
    });

    orderData.forEach((order) => {
      order.purchasedProducts.forEach((product) => {
        const date = new Date(product.date);
        const purchasedMonthIndex = date.getMonth();
        if (product.status !== 'Cancelled' && product.status !== 'Returned') {
          monthSales[purchasedMonthIndex] += product.quantity;
        }
      });
    });

    orderData.forEach((order) => {
      order.purchasedProducts.forEach((product) => {
        const date = new Date(product.date);
        const purchasedYear = date.getFullYear().toString();
        const purchasedYearIndex = year.indexOf(purchasedYear);
        if (product.status !== 'Cancelled' && product.status !== 'Returned') {
          yearSales[purchasedYearIndex] += product.quantity;
        }
      });
    });

    function getWeek(date) {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const daysOffset = firstDayOfYear.getDay() - 1;
      const firstWeekDayOne = new Date(date.getFullYear(), 0, 1 + (7 - daysOffset));
      const weekNumber = Math.floor(((date - firstWeekDayOne) / 86400000) / 7);
      return weekNumber;
    }

    res.render('loadMoreDashboard', {
      userData, orderData, categoryData, userCount, totalRevenue, activeUsers, codRevenue, razor_payRevenue, categorySales, daySales, monthSales, yearSales,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Logout
const adminLogout = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    req.session.admin_id = null;
    res.redirect('/admin');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// List Users
const loadUsers = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.set('Cache-Control', 'no-store');
    const usersData = await User.find();
    res.render('users', { users: usersData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Block User
const blockUser = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.id;
    const user = await User.findById(userId);
    user.isBlocked = 1;
    await user.save();
    res.redirect('/admin/users');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Unblock User
const unblockUser = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.id;
    const user = await User.findById(userId);
    user.isBlocked = 0;
    await user.save();
    res.redirect('/admin/users');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Product
// list Products
const loadProducts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const productsData = await Product.find().populate('category');
    res.render('adminProduct', { products: productsData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Add Products
const loadAddProducts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categories = await Category.find();
    res.render('addProducts', { categories });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const insertProduct = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const productTitle = req.body.title;
    const productData = await Product.findOne({ title: productTitle });
    const categories = await Category.find();

    if (productData) {
      return res.render('addProducts', { message: 'The Same Product Already Exists', categories });
    }

    // Upload images to CDN
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        imagekit.upload({
          file: file.buffer,
          fileName: `${Date.now()}-${file.originalname}`,
          transformation: [
            {
              width: 600,
              height: 600,
              crop: 'at_max',
            },
          ],
        }, (error, result) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve(result.url);
          }
        });
      });
    });

    const uploadedImageUrls = await Promise.all(uploadPromises);

    const product = new Product({
      title: req.body.title,
      category: req.body.category,
      quantity: req.body.quantity,
      price: req.body.price,
      description: req.body.description,
      images: uploadedImageUrls,
      is_in_cart: 0,
      is_available: 0,
    });

    await product.save();
    res.render('addProducts', { message: 'Product is successfully added', categories });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Edit Product
const loadEditProduct = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const product = await Product.findById(req.params.product_id);
    const categories = await Category.find();
    res.render('editProduct', { product, categories });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const productId = req.params.product_id;
    const updatedData = {
      title: req.body.title,
      category: req.body.category,
      quantity: req.body.quantity,
      price: req.body.price,
      description: req.body.description,
    };
    if (req.files && req.files.length >= 0) {
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          imagekit.upload({
            file: file.buffer,
            fileName: `${Date.now()}-${file.originalname}`,
            transformation: [
              {
                width: 600,
                height: 600,
                crop: 'at_max',
              },
            ],
          }, (error, result) => {
            if (error) {
              console.error(error);
              reject(error);
            } else {
              resolve(result.url);
            }
          });
        });
      });

      const uploadedImageUrls = await Promise.all(uploadPromises);

      const product = await Product.findById(productId);
      product.images.push(...uploadedImageUrls);
      await product.save();

    }

    await Product.findByIdAndUpdate(productId, updatedData);
    res.redirect('/admin/products');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const productId = req.query.product_id;
    const index = req.query.index;
    const product = await Product.findById(productId);
    product.images.splice(index, 1);
    await product.save()
    res.redirect(`/admin/products/editProduct/${productId}`)
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  };
};

const deleteProduct = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const productId = req.params.product_id;
    const product = await Product.findById(productId);
    product.is_available = 1;
    await product.save();
    res.redirect('/admin/products');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const recoverProduct = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const productId = req.params.product_id;
    const product = await Product.findById(productId);
    product.is_available = 0;
    await product.save();
    res.redirect('/admin/products');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Category
const loadCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categoryData = await Category.find();
    res.render('adminCategory', { categories: categoryData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadAddCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.render('addCategory');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const insertCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { categoryName } = req.body;
    const categoryData = await Category.findOne({ categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') } });

    if (categoryData) {
      return res.render('addCategory', { message: 'The same category name already exists' });
    }
    const category = new Category({
      categoryName: req.body.categoryName,
      categoryDescription: req.body.categoryDescription,
      categoryImage: req.file.filename,
      is_available: true,
    });
    await category.save();
    res.render('addCategory', { message: 'Category is successfully added' });
  } catch (error) {
    res.render('addCategory', { message: 'An error occurred while adding the category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categoryId = req.params.category_id;
    const category = await Category.findById(categoryId);
    category.is_available = false;
    await category.save();
    res.redirect('/admin/category');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const recoverCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categoryId = req.params.category_id;
    const category = await Category.findById(categoryId);
    category.is_available = true;
    await category.save();
    res.redirect('/admin/category');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadEditCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categoryId = req.params.category_id;
    const category = await Category.findById(categoryId);
    res.render('editCategory', { category });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categoryId = req.params.category_id;
    const category = await Category.findById(categoryId);

    const updatedData = {
      categoryName: req.body.categoryName,
      categoryDescription: req.body.categoryDescription,
      categoryImage: req.file ? req.file.filename : category.categoryImage,
    };

    await Category.findByIdAndUpdate(categoryId, updatedData);
    res.redirect('/admin/category');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadOrders = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const orders = await Order.find().populate('purchasedProducts.product');

    res.render('adminOrder', { orders });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadDetailedOrder = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const purchasedDate = new Date(req.params.purchased_date);
    const cartId = req.params.cart_id;
    const cart = await Cart.findById(cartId);
    const userId = cart.user;
    const user = await User.findById(userId);
    const order = await Order.findOne({ cart: cartId });
    let products = [];

    for (const orderItem of order.purchasedProducts) {
      if (
        orderItem.date.toISOString() === purchasedDate.toISOString() &&
        orderItem.userName === user.name
      ) {
        const product = await Product.findById(orderItem.product).populate('category');
        products.push(product);
      }
    }
    res.render('detailedOrder', { user, products, order, purchasedDate });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const orderId = req.params.order_id;
    const productId = req.params.product_id;
    const order = await Order.findById(orderId);
    const purchasedProductId = req.params.purchasedProduct_id;

    const purchasedProductIndex = order.purchasedProducts.findIndex((product) => product.product.toString() === productId && product._id.toString() === purchasedProductId);
    const changedStatus = req.body.status;
    if (purchasedProductIndex !== -1) {
      order.purchasedProducts[purchasedProductIndex].status = changedStatus;
      await order.save();
      if (order.purchasedProducts[purchasedProductIndex].status === 'Delivered') {
        order.purchasedProducts[purchasedProductIndex].deliveredDate = new Date();
        await order.save();
        const { deliveredDate } = order.purchasedProducts[purchasedProductIndex];
        const returnDate = new Date(deliveredDate);
        returnDate.setDate(returnDate.getDate() + 14);

        order.purchasedProducts[purchasedProductIndex].lastReturnDate = returnDate;
        await order.save();
      }
      res.redirect('/admin/orders');
    } else {
      res.render('404_errorPage', { message: 'Product is not found' });
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadBanner = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const bannerData = await Banner.find().populate('category');
    res.render('adminBanner', { banners: bannerData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadAddBanner = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categoryData = await Category.find();
    res.render('addBanner', { categories: categoryData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const insertBanner = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { bannerTitle } = req.body;
    const bannerData = await Banner.findOne({ title: bannerTitle });
    const categoryName = req.body.category;
    const categories = await Category.find();

    if (bannerData) {
      return res.render('addBanner', {
        message: 'Same Banner Title already Exists',
        category: categoryName,
        categories,
      });
    }
    const banner = new Banner({
      title: req.body.bannerTitle,
      description: req.body.bannerDescription,
      category: req.body.category,
      link: `/shop/${categoryName}`,
      bannerImage: req.file.filename,
      isActive: true,
    });

    await banner.save();
    res.render('addBanner', {
      message: 'Banner is successfully added',
      category: categoryName,
      categories,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const bannerId = req.params.banner_id;
    const banner = await Banner.findById(bannerId);
    banner.isActive = false;
    await banner.save();
    res.redirect('/admin/banner');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const recoverBanner = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const bannerId = req.params.banner_id;
    const banner = await Banner.findById(bannerId);
    banner.isActive = true;
    await banner.save();
    res.redirect('/admin/banner');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadEditBanner = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const bannerId = req.params.banner_id;
    const banner = await Banner.findById(bannerId).populate('category');
    const categories = await Category.find();
    res.render('editBanner', { banner, categories });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const bannerId = req.params.banner_id;
    const categoryName = req.body.category;
    const banner = await Banner.findById(bannerId);

    let category;
    if (categoryName) {
      category = await Category.findById(categoryName);
    } else {
      category = await Category.findById(banner.category);
    }

    const updatedData = {
      title: req.body.bannerTitle,
      description: req.body.bannerDescription,
      category: categoryName || banner.category,
      link: `/shop/${category._id}`,
      bannerImage: req.file ? req.file.filename : banner.bannerImage,
    };

    await Banner.findByIdAndUpdate(bannerId, updatedData);
    res.redirect('/admin/banner');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadCoupon = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const couponData = await Coupon.find();
    res.render('adminCoupon', { coupons: couponData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadAddCoupon = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.render('addCoupon');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const insertCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      validityStart,
      validityEnd,
      usageLimit,
    } = req.body;

    const couponData = await Coupon.findOne({ code: req.body.code });

    if (couponData) {
      return res.render('addCoupon', { message: 'The same Coupon Code is already Exists' });
    }
    const newCoupon = new Coupon({
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      validityStart,
      validityEnd,
      usageLimit,
    });

    await newCoupon.save();

    res.render('addCoupon', { message: 'Coupon added Successfully' });
  } catch (error) {
    res.render('addCoupon', { message: 'Error adding coupon' });
  }
};

const loadCouponEdit = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const couponId = req.params.coupon_id;
    const coupon = await Coupon.findById(couponId);
    res.render('editCoupon', { coupon });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const couponId = req.params.coupon_id;
    const coupon = await Coupon.findById(couponId);

    coupon.code = req.body.code;
    coupon.description = req.body.description;
    coupon.discountType = req.body.discountType;
    coupon.discountValue = req.body.discountValue;
    coupon.minimumOrderAmount = req.body.minimumOrderAmount;
    coupon.maximumDiscountAmount = req.body.maximumDiscountAmount;
    coupon.validityStart = req.body.validityStart;
    coupon.validityEnd = req.body.validityEnd;
    coupon.usageLimit = req.body.usageLimit;

    await coupon.save();

    res.redirect('/admin/coupons');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadOffers = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const offerData = await Offer.find()
      .populate('product')
      .populate('category');
    res.render('adminOffer', { offers: offerData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadAddOffer = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const productData = await Product.find();
    const categoryData = await Category.find();
    res.render('addOffer', { products: productData, categories: categoryData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const insertOffer = async (req, res) => {
  try {
    const productData = await Product.find();
    const categoryData = await Category.find();
    const {
      offerTitle,
      offerType,
      product,
      category,
      referralCode,
      offerDiscount,
      startDate,
      endDate,
    } = req.body;

    const currentDate = new Date();
    const offerEndDate = new Date(endDate);

    if (currentDate > offerEndDate) {
      res.render('addOffer', { message: 'End date of the offer has already passed', products: productData, categories: categoryData });
      return;
    }

    const newOffer = new Offer({
      offerTitle,
      offerType,
      product,
      category,
      referralCode,
      offerDiscount,
      startDate,
      endDate,
      is_available: true,
    });
    await newOffer.save();
    res.render('addOffer', { message: 'Offer added successfully', products: productData, categories: categoryData });
  } catch (error) {
    const productData = await Product.find();
    const categoryData = await Category.find();
    res.render('addOffer', { message: 'Failed to add Offer', products: productData, categories: categoryData });
  }
};

const loadEditOffer = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const offerId = req.params.offer_id;
    const offer = await Offer.findById(offerId)
      .populate('product')
      .populate('category');
    const products = await Product.find();
    const categories = await Category.find();
    res.render('editOffer', { offer, products, categories });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateOffer = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const offerId = req.params.offer_id;
    const offer = await Offer.findById(offerId);

    offer.offerTitle = req.body.offerTitle;
    offer.offerType = req.body.offerType;
    offer.product = req.body.product;
    offer.category = req.body.category;
    offer.referralCode = req.body.referralCode;
    offer.offerDiscount = req.body.offerDiscount;
    offer.startDate = req.body.startDate;
    offer.endDate = req.body.endDate;

    await offer.save();

    res.redirect('/admin/offer');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadSalesReport = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const orderData = await Order.find().populate('purchasedProducts.product');
    const startDate = req.query.from;
    const endDate = req.query.to;

    res.render('salesReport', { startDate, endDate, orderData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const downloadSalesReport = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const orderData = await Order.find().populate('purchasedProducts.product');
    const startDate = req.query.from;
    const endDate = req.query.to;

    const browser = await puppeteer.launch({
      executablePath: '/snap/bin/chromium',
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Render the EJS template with data
    const templatePath = path.join(__dirname, '..', 'views', 'admin', 'salesReportPDF.ejs');

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const renderedHtml = ejs.render(templateContent, {
      orderData,
      startDate,
      endDate,
    });

    // Set the page content to the rendered HTML
    await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    // Close the Puppeteer browser
    await browser.close();

    // Generate a unique filename for the PDF
    const filename = `sales_report_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '..', 'public', filename);

    // Save the PDF file
    fs.writeFileSync(filepath, pdfBuffer);

    // Download the PDF
    res.download(filepath, (err) => {
      if (err) {
        res.render('404_errorPage', { message: err });
      }

      // Delete the generated file after download
      fs.unlink(filepath, (err) => {
        if (err) {
          res.render('404_errorPage', { message: err });
        }
      });
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};    

module.exports = {
  loadAdminLogin,
  verifyLogin,
  loadDashboard,
  loadMoreDashboard,
  adminLogout,
  loadUsers,
  blockUser,
  unblockUser,
  loadProducts,
  loadAddProducts,
  insertProduct,
  loadEditProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
  recoverProduct,
  loadCategory,
  loadAddCategory,
  insertCategory,
  deleteCategory,
  recoverCategory,
  loadOrders,
  loadDetailedOrder,
  updateOrderStatus,
  loadBanner,
  loadAddBanner,
  insertBanner,
  deleteBanner,
  recoverBanner,
  loadEditBanner,
  updateBanner,
  loadEditCategory,
  updateCategory,
  loadCoupon,
  loadAddCoupon,
  insertCoupon,
  loadCouponEdit,
  updateCoupon,
  loadOffers,
  loadAddOffer,
  insertOffer,
  loadEditOffer,
  updateOffer,
  loadSalesReport,
  downloadSalesReport,
};
