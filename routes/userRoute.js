const express = require('express');

const userRoute = express();
const session = require('express-session');

userRoute.use(session({
  secret: 'mySecretKey',
  resave: 'False',
  saveUninitialized: 'true',
}));

const path = require('path');

userRoute.use('/public/magiczoom', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

userRoute.use(express.static(path.resolve(__dirname, '../public')));

const bodyParser = require('body-parser');
const auth = require('../middleware/auth');

userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));

userRoute.set('view engine', 'ejs');
userRoute.set('views', './views/users');

const userController = require('../controllers/userController');

userRoute.get('/register', auth.isLogout, userController.loadRegister);
userRoute.post('/register', userController.insertUser);
userRoute.get('/resendOTP/:phoneNumber', auth.isLogout, userController.resendOTP);
userRoute.get('/otpVerify/:phoneNumber', auth.isLogout, userController.loadOtpVerification);
userRoute.post('/otpVerify/:phoneNumber', userController.insertOTP);
userRoute.get('/login', auth.isLogout, userController.loadLogin);
userRoute.post('/login', userController.verifyLogin);
userRoute.get('/', auth.isLogout, userController.loadGuestHome);
userRoute.get('/productDetails/:product_id', auth.isLogout, userController.loadProductDetails);
userRoute.get('/home', auth.isLogin, userController.loadUserHome);
userRoute.get('/home/productDetails/:user_id/:product_id', auth.isLogin, userController.LoadProductDetailsUserHome);
userRoute.post('/home/productDetails/:user_id/:product_id', auth.isLogin, userController.addProductToCart);
userRoute.get('/home/shopingCart/:cart_id', auth.isLogin, userController.loadShopingCart);
userRoute.post('/updateCart', userController.updateCart);
userRoute.get('/deleteProductFromCart/:cart_id/:product_id', userController.deleteCartProduct);
userRoute.get('/shippingDetails/:user_id', auth.isLogin, userController.loadShippingDetails);
userRoute.post('/shippingDetails/:user_id', userController.insertShippingDetails);
userRoute.get('/home/updateShippingAddress/:user_id', auth.isLogin, userController.loadUpdateShippingDetails);
userRoute.post('/home/updateShippingAddress/:user_id', auth.isLogin, userController.UpdateShippingDetails);
userRoute.get('/home/deleteShippingAddress', userController.deleteAddress);
userRoute.get('/home/orderHistory/:user_id', auth.isLogin, userController.loadOrderHistory);
userRoute.post('/cancelOrder/:order_id/:product_id/:user_id/:purchasedProduct_id', userController.cancelOrder);
userRoute.get('/home/shop/:user_id', auth.isLogin, userController.loadShop);
userRoute.get('/shop', auth.isLogout, userController.loadGuestShop);
userRoute.get('/shop/:category_id', auth.isLogout, userController.guestShopByCategory);
userRoute.get('/home/shop/:category_id/:user_id', auth.isLogin, userController.userShopByCategory);
userRoute.get('/logout', auth.isLogin, userController.userLogout);
userRoute.get('/forget', auth.isLogout, userController.loadForget);
userRoute.post('/forget', userController.verifyForget);
userRoute.post('/otpVerifyforResetPassword/:phoneNumber', userController.verifyOTP);
userRoute.get('/resetPassword/:phoneNumber', auth.isLogout, userController.loadResetPassword);
userRoute.post('/resetPassword/:phoneNumber', userController.resetPassword);
userRoute.get('/home/userProfile/:user_id', auth.isLogin, userController.loadUserProfile);
userRoute.get('/home/editUserProfile/:user_id', auth.isLogin, userController.loadProfileEdit);
userRoute.post('/home/editUserProfile/:user_id', userController.updateUserProfile);
userRoute.post('/home/shopingCart/checkout/:user_id', auth.isLogin, userController.cartCheckout);
userRoute.get('/home/success', auth.isLogin, userController.loadSuccessPage);
userRoute.get('/home/addToWishlist/:product_id', auth.isLogin, userController.addToWishlist);
userRoute.get('/home/removeFromWishlist/:product_id', auth.isLogin, userController.removeFromWishlist);
userRoute.get('/home/removeProductFromWishlist/:product_id/:wishlist_id', auth.isLogin, userController.removeProductFromWishlist);
userRoute.get('/home/wishlist/:wishlist_id', auth.isLogin, userController.loadWishlist);
userRoute.post('/home/addToCartFromWishlist/:wishlist_id/:product_id', userController.addToCartFromWishlist);
userRoute.post('/applyCoupon', userController.applyCoupon);
userRoute.post('/returnProduct/:order_id/:product_id/:purchasedProduct_id', userController.returnProduct);
userRoute.get('/search', auth.isLogin, userController.searchProducts);
userRoute.get('/home/wallet', auth.isLogin, userController.loadWallet);
userRoute.get('/review/:product_id', auth.isLogin, userController.loadEnterReview);
userRoute.post('/review/:product_id', userController.enterReview);
userRoute.get('/updateReview/:product_id/:user_id', auth.isLogin, userController.loadUpdateReview);
userRoute.post('/updateReview/:product_id/:user_id', userController.updateReview);
userRoute.post('/payWithWallet', userController.payWithWallet);

module.exports = userRoute;
