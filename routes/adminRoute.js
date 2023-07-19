const express = require('express');

const adminRoute = express();

const session = require('express-session');

adminRoute.use(session({
  secret: 'mySecretKey',
  resave: 'false',
  saveUninitialized: 'true',
}));

const multer = require('multer');
const path = require('path');
const auth = require('../middleware/adminAuth');

const adminController = require('../controllers/adminController');

adminRoute.use(express.static(path.resolve(__dirname, '../public')));

// const bodyParser = require("body-parser")
// adminRoute.use(bodyParser.json())
// adminRoute.use(bodyParser.urlencoded({ extended: true }))

adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../public/'));
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../public/categoryImages'));
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  },
});
const categoryUpload = multer({ storage: categoryStorage });

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../public/bannerImages'));
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  },
});
const bannerUpload = multer({ storage: bannerStorage });

adminRoute.set('view engine', 'ejs');
adminRoute.set('views', './views/admin');

adminRoute.get('/', auth.isLogout, adminController.loadAdminLogin);
adminRoute.post('/', adminController.verifyLogin);
adminRoute.get('/home', auth.isLogin, adminController.loadDashboard);
adminRoute.get('/home/loadMore', auth.isLogin, adminController.loadMoreDashboard);
adminRoute.get('/adminLogout', auth.isLogin, adminController.adminLogout);
adminRoute.get('/users', auth.isLogin, adminController.loadUsers);
adminRoute.post('/users/block/:id', auth.isLogin, adminController.blockUser);
adminRoute.post('/users/unblock/:id', auth.isLogin, adminController.unblockUser);
adminRoute.get('/products', auth.isLogin, adminController.loadProducts);
adminRoute.get('/products/addProducts', auth.isLogin, adminController.loadAddProducts);
adminRoute.post('/products/addProducts', auth.isLogin, upload.array('images'), adminController.insertProduct);
adminRoute.get('/products/editProduct/:product_id', auth.isLogin, adminController.loadEditProduct);
adminRoute.post('/products/editProduct/:product_id', upload.array('images'), adminController.updateProduct);
adminRoute.get('/deleteProductImage',auth.isLogin,adminController.deleteProductImage);
adminRoute.post('/products/deleteProduct/:product_id', auth.isLogin, adminController.deleteProduct);
adminRoute.post('/products/recoverProduct/:product_id', adminController.recoverProduct);
adminRoute.get('/category', auth.isLogin, adminController.loadCategory);
adminRoute.get('/category/addCategories', auth.isLogin, adminController.loadAddCategory);
adminRoute.post('/category/addCategories', auth.isLogin, categoryUpload.single('categoryImage'), adminController.insertCategory);
adminRoute.post('/category/deleteCategory/:category_id', adminController.deleteCategory);
adminRoute.post('/category/recoverCategory/:category_id', adminController.recoverCategory);
adminRoute.get('/category/editCategory/:category_id', auth.isLogin, adminController.loadEditCategory);
adminRoute.post('/category/editCategory/:category_id', categoryUpload.single('categoryImage'), adminController.updateCategory);
adminRoute.get('/orders', auth.isLogin, adminController.loadOrders);
adminRoute.get('/detailedOrder/:purchased_date/:cart_id',auth.isLogin,adminController.loadDetailedOrder);
adminRoute.post('/orders/updateOrderStatus/:order_id/:product_id/:purchasedProduct_id', adminController.updateOrderStatus);
adminRoute.get('/banner', auth.isLogin, adminController.loadBanner);
adminRoute.get('/banner/addBanner', auth.isLogin, adminController.loadAddBanner);
adminRoute.post('/banner/addBanner', bannerUpload.single('bannerImage'), adminController.insertBanner);
adminRoute.post('/banner/deleteBanner/:banner_id', adminController.deleteBanner);
adminRoute.post('/banner/recoverBanner/:banner_id', adminController.recoverBanner);
adminRoute.get('/banner/editBanner/:banner_id', auth.isLogin, adminController.loadEditBanner);
adminRoute.post('/banner/editBanner/:banner_id', bannerUpload.single('bannerImage'), adminController.updateBanner);
adminRoute.get('/coupons', auth.isLogin, adminController.loadCoupon);
adminRoute.get('/coupon/addCoupon', auth.isLogin, adminController.loadAddCoupon);
adminRoute.post('/coupon/addCoupon', adminController.insertCoupon);
adminRoute.get('/coupons/editCoupon/:coupon_id', auth.isLogin, adminController.loadCouponEdit);
adminRoute.post('/coupons/editCoupon/:coupon_id', adminController.updateCoupon);
adminRoute.get('/offer', auth.isLogin, adminController.loadOffers);
adminRoute.get('/offer/addOffer', auth.isLogin, adminController.loadAddOffer);
adminRoute.post('/offer/addOffer', adminController.insertOffer);
adminRoute.get('/offer/editOffer/:offer_id', auth.isLogin, adminController.loadEditOffer);
adminRoute.post('/offer/editOffer/:offer_id', adminController.updateOffer);
adminRoute.get('/salesReport', auth.isLogin, adminController.loadSalesReport);
adminRoute.get('/salesReport/download', auth.isLogin, adminController.downloadSalesReport);

adminRoute.get('*', (req, res) => { res.redirect('/admin'); });

module.exports = adminRoute;
