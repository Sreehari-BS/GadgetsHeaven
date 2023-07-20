const mongoose = require('mongoose');
const axios = require('axios');
const Razorpay = require('razorpay');
const moment = require('moment-timezone');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Banner = require('../models/bannerModel');
const Wishlist = require('../models/wishlistModel');
const Coupon = require('../models/couponModel');
const Wallet = require('../models/walletModel');
const Offer = require('../models/offerModel');
const Review = require('../models/productReviewModel');

// User Registration
const loadRegister = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.render('userRegistration');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const insertUser = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const existingNumber = await User.findOne({ phoneNumber: req.body.phoneNumber });
    if (existingNumber) {
      return res.render('userRegistration', { message: 'Phone number is already exists.Plese enter another one.' });
    }
    req.session.user = {
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      isBlocked: 0,
    };
    if (req.body.password !== req.body.confirmPassword) {
      return res.render('userRegistration', { message: 'Please Enter Correct Password' });
    }
    const generateOTP = async () => {
      const randomNumber = Math.floor(Math.random() * 10000);
      const otp = randomNumber.toString().padStart(4, '0');
      console.log(otp);
      req.session.otp = otp;
      await sendSMS(otp, req.body.phoneNumber);
    };
    generateOTP();
    res.render('userOTPverification', { phoneNumber });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const sendSMS = (otp, phoneNumber) => {
  const body = {
    authorization: '9mCRNewf4y51lc6KJLFYIgZtEjxv0WV3PuoHOra2BphzsGUMiqwmdFs3TZfEMB2vkcG5JqNeRSyCj8Yp',
    variables_values: otp,
    route: 'otp',
    numbers: phoneNumber,
  };

  return axios({
    method: 'GET',
    url: 'https://www.fast2sms.com/dev/bulkV2',
    data: body,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const loadOtpVerification = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { phoneNumber } = req.params;
    res.render('userOTPverification', { phoneNumber });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const generateOTP = async () => {
      const randomNumber = Math.floor(Math.random() * 10000);
      const otp = randomNumber.toString().padStart(4, '0');
      console.log(otp);
      req.session.otp = otp;
      await sendSMS(otp, phoneNumber);
      res.redirect('/otpVerify/${phoneNumber}');
    };
    generateOTP();
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const insertOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const enteredOTP = req.body.otp;
    const { otp } = req.session;
    if (enteredOTP == otp) {
      const newUser = new User(req.session.user);
      await newUser.save();
      req.session.user = null;
      res.redirect('/login');
    } else {
      res.render('userOTPverification', { message: 'Invalid OTP', phoneNumber });
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// User Login
const loadLogin = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.render('userLogin');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const verifyLogin = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { phoneNumber } = req.body;
    const { password } = req.body;

    const userData = await User.findOne({ phoneNumber });

    if (userData && userData.isBlocked === 0) {
      if (userData.password !== password) {
        res.render('userLogin', { message: 'Phone Number and Password are Incorect' });
      } else {
        const cart = await Cart.findOne({ user: userData._id });
        const wishlist = await Wishlist.findOne({ user: userData._id });
        let cartId;
        let wishlistId;

        if (!cart && !wishlist) {
          const newCart = new Cart({
            user: userData._id,
            products: [],
            totalAmount: 0,
          });

          const newWishlist = new Wishlist({
            user: userData._id,
            wishList: [],
          });

          await newWishlist.save();
          await newCart.save();
          req.session.user_id = userData._id;
          res.redirect('/home');
        } else {
          req.session.user_id = userData._id;
          res.redirect('/home');
        }
      }
    } else {
      res.render('userLogin', { message: 'Phone Number and Password are Incorect' });
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// Guest Home
const loadGuestHome = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const productData = await Product.find().populate('category');
    const categoryData = await Category.find();
    const bannerData = await Banner.find();
    res.render('guestHome', { products: productData, categories: categoryData, banners: bannerData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadProductDetails = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const user_Id = req.params.user_id;
    const user = await User.findById(user_Id);
    const productId = req.params.product_id;
    const product = await Product.findById(productId);
    res.render('guestProductDetails', { product, user });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const LoadProductDetailsUserHome = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const user_Id = req.params.user_id;
    const user = await User.findById(user_Id);
    const productId = req.params.product_id;
    const product = await Product.findById(productId).populate('category');
    const cart = await Cart.findOne({ user: user_Id });
    const offer = await Offer.findOne({ $or: [{ product: product._id }, { category: product.category._id }] });
    const orders = await Order.findOne({ cart: cart._id });
    const reviews = await Review.find({}).populate('user');
    res.render('productDetails', {
      product, user, cart, offer, reviews, orders,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadUserHome = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userData = await User.findById({ _id: req.session.user_id });
    const productData = await Product.find().populate('category');
    const categoryData = await Category.find();
    const bannerData = await Banner.find();
    const cartData = await Cart.findOne({ user: userData._id }).populate({
      path: 'products.product',
      select: 'images price category offerPrice quantity',
    });

    const wishlist = await Wishlist.findOne({ user: userData._id });
    const offerData = await Offer.find();

    if (offerData) {
      for (const product of productData) {
        for (const offer of offerData) {
          if (offer.offerType === "Product_Offer" && offer.is_available) {
            if (offer.product.toString() === product._id.toString()) {
              const productOfferPrice = Math.round(product.price - (product.price * (offer.offerDiscount / 100)));
              product.offerPrice = productOfferPrice;
              await product.save();
            }
          } else if (offer.offerType === "Category_Offer" && offer.is_available) {
            if (offer.category.toString() === product.category._id.toString()) {
              const categoryOfferPrice = Math.round(product.price - (product.price * (offer.offerDiscount / 100)));
              product.offerPrice = categoryOfferPrice;
              await product.save();
            }
          }
        }
      }
    }


    res.render('userHome', {
      user: userData, products: productData, categories: categoryData, cart: cartData, banners: bannerData, wish: wishlist, offers: offerData,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// user Logout
const userLogout = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    req.session.user_id = null;
    res.redirect('/');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// forget password
const loadForget = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.render('forget');
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const verifyForget = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { phoneNumber } = req.body;
    const userData = await User.findOne({ phoneNumber });
    if (userData) {
      const generateOTP = async () => {
        const randomNumber = Math.floor(Math.random() * 10000);
        const otp = randomNumber.toString().padStart(4, '0');
        console.log(otp);
        req.session.otp = otp;
        await sendSMS(otp, req.body.phoneNumber);
      };
      generateOTP();
      res.render('userOTPverificationForResetPassword', { phoneNumber });
    } else {
      res.render('forget', { message: 'Phone Number is incorrect' });
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const enteredOTP = req.body.otp;
    const { otp } = req.session;
    if (enteredOTP === otp) {
      res.redirect(`/resetPassword/${phoneNumber}`);
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadResetPassword = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    res.set('Cache-Control', 'no-store');
    res.render('resetPassword', { phoneNumber });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { phoneNumber } = req.params;
    const { newPassword } = req.body;
    const { confirmNewPassword } = req.body;

    const userData = await User.findOne({ phoneNumber });

    if (userData && newPassword === confirmNewPassword) {
      userData.password = newPassword;
      userData.confirmPassword = newPassword;
      await userData.save();
      res.redirect('/login');
    } else {
      res.render('resetPassword', { message: 'failed to reset the Password', phoneNumber });
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

// user Profile
const loadUserProfile = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const user = await User.findById(userId);
    res.render('userProfile', { user });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadProfileEdit = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const user = await User.findById(userId);
    res.render('userProfileEdit', { user });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const userData = await User.findByIdAndUpdate(userId, { $set: { name: req.body.name, email: req.body.email, phoneNumber: req.body.phoneNumber } });
    if (userData) {
      res.redirect(`/home/userProfile/${userId}`);
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const addProductToCart = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const user = await User.findById(userId)
    const productId = req.params.product_id;
    const quantity = parseInt(req.body.numOfProducts);

    const product = await Product.findById(productId).populate('category');

    const offer = await Offer.findOne({ $or: [{ product: product._id }, { category: product.category._id }] });

    let cart = await Cart.findOne({ user: user._id }).populate('products.product');
    const orders = await Order.findOne({ cart: cart._id });
    const reviews = await Review.find({}).populate('user');

    if (quantity > 0) {
      if (quantity <= product.quantity) {
        const cartItem = {
          product: productId,
          productName: product.title,
          quantity,
          price: offer ? product.offerPrice * quantity : product.price * quantity,
        };

        if (!cart) {
          cart = new Cart({
            user: user._id,
            products: [cartItem],
            totalAmount: cartItem.price,
          });
          await cart.save();
        } else {
          const existingProduct = cart.products.find((item) => item.product._id.toString() === product._id.toString());
          if (existingProduct) {
            return res.render('productDetails', { message: 'Product is Already in the Cart', product, user: user._id, cart, offer, reviews, orders });
          }

          cart.products.push(cartItem);
          cart.totalAmount += cartItem.price;
          await cart.save();
        }

        res.redirect(`/home/productDetails/${new mongoose.Types.ObjectId(userId)}/${new mongoose.Types.ObjectId(productId)}`);
      } else {
        return res.render('productDetails', { message: `Only ${product.quantity} item is Availble`, product, user: user._id, cart, offer, reviews, orders });
      }
    } else {
      return res.render('productDetails', { message: 'Quantity should be atleast 1', product, user: user._id, cart, offer, reviews, orders });
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadShopingCart = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const cartId = req.params.cart_id;
    const productData = await Product.find();
    const orderData = await Order.findOne({ cart: cartId });
    const cartData = await Cart.findById(cartId)
      .populate({
        path: 'products.product',
        select: 'images price category offerPrice quantity',
      })
      .populate('user');
    const userId = cartData.user._id;
    const userData = await User.findById(userId);
    const couponData = await Coupon.find();
    const offerData = await Offer.find();
    const wallet = await Wallet.findOne({ user: userId });
    res.render('shopingCart', {
      coupons: couponData, cart: cartData, products: productData, order: orderData, user: userData, offers: offerData, wallet,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateCart = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.session.user_id;
    const cartData = await Cart.findOne({ user: userId }).populate({
      path: 'products.product',
      select: 'price offerPrice',
    });
    const cartId = cartData._id;
    let quantities = req.body.numOfproducts;

    // Validate quantities
    if (quantities.some(quantity => quantity <= 0)) {
      quantities = quantities.map(quantity => Math.max(quantity, 1)); // Set any quantity less than or equal to 0 to 1
    }

    cartData.products.forEach((item, index) => {
      item.quantity = quantities[index];
      item.price = item.product.offerPrice > 0 ? item.product.offerPrice * item.quantity : item.product.price * item.quantity;
    });

    const updatedTotalAmount = cartData.products.reduce(
      (total, item) => total + item.price,
      0,
    );

    cartData.totalAmount = updatedTotalAmount;

    await cartData.save();

    res.json({
      subtotal: cartData.totalAmount,
      total: cartData.totalAmount,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the cart.' });
  }
};

const deleteCartProduct = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const cartId = req.params.cart_id;
    const productId = req.params.product_id;

    const cartData = await Cart.findById(cartId).populate({
      path: 'products.product',
      select: 'price',
    });

    const productIndex = cartData.products.findIndex(
      (item) => item.product._id.toString() === new mongoose.Types.ObjectId(productId).toString(),
    );

    if (productIndex !== -1) {
      cartData.products.splice(productIndex, 1);
    }

    const updatedTotalAmount = cartData.products.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );

    cartData.totalAmount = updatedTotalAmount;

    await cartData.save();
    res.redirect(`/home/shopingCart/${new mongoose.Types.ObjectId(cartId)}`);
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadShippingDetails = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('user');
    const order = await Order.findOne({ cart: cart._id });
    res.render('shippingAddress', { user, cart, order });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const insertShippingDetails = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;

    const {
      name,
      houseName,
      place,
      city,
      district,
      state,
      pinCode,
      phoneNumber,
    } = req.body;

    const user = await User.findById(userId);

    const cart = await Cart.findOne({ user: userId });

    const order = await Order.findOne({ cart: cart._id });

    if (!order) {
      const newOrder = new Order({
        cart: cart._id,
        purchasedProducts: [],
        shippingAddress: [{
          name,
          houseName,
          place,
          city,
          district,
          state,
          pinCode,
          phoneNumber,
        }],
      });
      await newOrder.save();
    } else {
      const shippingAddress = {
        name,
        houseName,
        place,
        city,
        district,
        state,
        pinCode,
        phoneNumber,
      };
      order.shippingAddress.push(shippingAddress);
      await order.save();
    }
    res.redirect(`/shippingDetails/${userId}`);
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadUpdateShippingDetails = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const { addressIndex } = req.query;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId });
    const order = await Order.findOne({ cart: cart._id });
    res.render('updateShippingDetails', {
      user, cart, order, addressIndex,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const UpdateShippingDetails = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const { addressIndex } = req.query;

    const {
      name,
      houseName,
      place,
      city,
      district,
      state,
      pinCode,
      phoneNumber,
    } = req.body;

    const cart = await Cart.findOne({ user: userId });
    const order = await Order.findOne({ cart: cart._id });

    if (order) {
      order.shippingAddress[addressIndex].name = name;
      order.shippingAddress[addressIndex].houseName = houseName;
      order.shippingAddress[addressIndex].place = place;
      order.shippingAddress[addressIndex].city = city;
      order.shippingAddress[addressIndex].district = district;
      order.shippingAddress[addressIndex].state = state;
      order.shippingAddress[addressIndex].pinCode = pinCode;
      order.shippingAddress[addressIndex].phoneNumber = phoneNumber;

      await order.save();
      res.redirect(`/shippingDetails/${new mongoose.Types.ObjectId(userId)}`);
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { addressIndex } = req.query;

    const cart = await Cart.findOne({ user: userId });
    const order = await Order.findOne({ cart: cart._id });

    if (order) {
      order.shippingAddress.splice(addressIndex, 1);
      await order.save();
      res.redirect(`/shippingDetails/${userId}`);
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const cartCheckout = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const user = await User.findById(userId);
    const cartData = await Cart.findOne({ user: userId }).populate('products.product');
    const orderData = await Order.findOne({ cart: cartData._id });
    const coupons = await Coupon.find();
    const offers = await Offer.find();
    const wallet = await Wallet.findOne({ user: userId })

    if (cartData.products.length === 0) {
      return res.status(400).json({ message: 'Cart is Empty' });
    }

    if (!orderData) {
      return res.render('shopingCart', {
        message: 'Please Enter a Shipping Address', user, cart: cartData, order: orderData, coupons, offers, wallet
      });
    }
    if (orderData.shippingAddress.length === 0) {
      return res.render('shopingCart', {
        message: 'Please Enter a Shipping Address', user, cart: cartData, order: orderData, coupons, offers, wallet
      });
    }

    const { paymentMethod } = req.body;

    if (paymentMethod === 'COD') {
      cartData.products.forEach(async (item) => {
        const purchasedProduct = {
          userName: user.name,
          product: item.product._id,
          quantity: item.quantity,
          paymentMethod: req.body.paymentMethod,
          address: {
            name: orderData.shippingAddress[0].name,
            houseName: orderData.shippingAddress[0].houseName,
            place: orderData.shippingAddress[0].place,
            city: orderData.shippingAddress[0].city,
            district: orderData.shippingAddress[0].district,
            state: orderData.shippingAddress[0].state,
            pinCode: orderData.shippingAddress[0].pinCode,
            phoneNumber: orderData.shippingAddress[0].phoneNumber,
          },
          status: 'Pending',
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
        };
        orderData.purchasedProducts.push(purchasedProduct);

        const product = await Product.findById(item.product._id);
        product.quantity -= item.quantity;
        await product.save();
      });

      await orderData.save();

      cartData.products = [];
      cartData.totalAmount = 0;

      await cartData.save();

      res.redirect('/home/success');
      // res.redirect("/home")
      // res.status(500).json({success:true,message:"Order is Successful using COD"})
    } else {
      const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

      const razorpay = new Razorpay({
        key_id: RAZORPAY_ID_KEY,
        key_secret: RAZORPAY_SECRET_KEY,
      });

      const amount = cartData.totalAmount * 100;
      const options = {
        amount,
        currency: 'INR',
        receipt: 'razorPayUser@gmail.com',
      };

      razorpay.orders.create(options, async (error, order) => {
        if (!error) {
          res.status(200).send({
            success: true,
            msg: 'Order Created',
            order_id: order.id,
            amount,
            key_id: RAZORPAY_ID_KEY,
          });

          const { paymentId } = req.body;
          const { orderId } = req.body;
          const { signature } = req.body;

          if (paymentId === undefined || paymentId === null) {
            return;
          }

          if (orderData.shippingAddress.length === 0) {
            return res.json({ success: false, message: "Please Enter a Shipping Address" })
          }

          cartData.products.forEach(async (item) => {
            const purchasedProduct = {
              userName: user.name,
              product: item.product._id,
              quantity: item.quantity,
              paymentMethod: 'razor_pay',
              address: {
                name: orderData.shippingAddress[0].name,
                houseName: orderData.shippingAddress[0].houseName,
                place: orderData.shippingAddress[0].place,
                city: orderData.shippingAddress[0].city,
                district: orderData.shippingAddress[0].district,
                state: orderData.shippingAddress[0].state,
                pinCode: orderData.shippingAddress[0].pinCode,
                phoneNumber: orderData.shippingAddress[0].phoneNumber,
              },
              status: 'Pending',
              date: moment().format('YYYY-MM-DD HH:mm:ss'),
            };
            orderData.purchasedProducts.push(purchasedProduct);

            const product = await Product.findById(item.product._id);
            product.quantity -= item.quantity;
            await product.save();
          });

          await orderData.save();

          cartData.products = [];
          cartData.totalAmount = 0;

          await cartData.save();
        } else {
          res.status(400).send({ success: false, message: 'Something Went Wrong' });
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went Wrong' });
  }
};

const loadSuccessPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    res.render('successPage', { user: userData });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadOrderHistory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const user = await User.findById(userId);
    const cartData = await Cart.findOne({ user: userId });
    const orderData = await Order.findOne({ cart: cartData._id }).populate('purchasedProducts.product');
    res.render('orderHistory', { cart: cartData, order: orderData, user });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const user = await User.findById(userId);
    const productId = req.params.product_id;
    const product = await Product.findById(productId);
    const orderId = req.params.order_id;
    const purchasedProductId = req.params.purchasedProduct_id;
    const order = await Order.findById(orderId);

    const purchasedProductIndex = order.purchasedProducts.findIndex((product) => product.product.toString() === productId && product._id.toString() === purchasedProductId);

    if (purchasedProductIndex !== -1) {
      const purchasedProduct = order.purchasedProducts[purchasedProductIndex];
      const { paymentMethod } = purchasedProduct;

      if (paymentMethod === 'razor_pay' || paymentMethod === 'Wallet') {
        let wallet = await Wallet.findOne({ user: userId });

        if (!wallet) {
          wallet = new Wallet({ user: userId });
        }

        wallet.balance += purchasedProduct.quantity * product.price;

        order.purchasedProducts[purchasedProductIndex].status = 'Cancelled';
        order.purchasedProducts[purchasedProductIndex].cancelledDate = new Date();

        await order.save();

        product.quantity += purchasedProduct.quantity;
        await product.save();

        const credit = {
          order: orderId,
          date: purchasedProduct.cancelledDate,
          productName: product.title,
          quantity: purchasedProduct.quantity,
          amount: purchasedProduct.quantity * product.price,
        };

        wallet.credits.push(credit);

        await wallet.save();

        res.redirect(`/home/orderHistory/${user._id}`);
      } else {
        order.purchasedProducts[purchasedProductIndex].status = 'Cancelled';
        order.purchasedProducts[purchasedProductIndex].cancelledDate = new Date();

        await order.save();

        product.quantity += purchasedProduct.quantity;
        await product.save();

        res.redirect(`/home/orderHistory/${user._id}`);
      }
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const returnProduct = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const productId = req.params.product_id;
    const product = await Product.findById(productId);
    const orderId = req.params.order_id;
    const order = await Order.findById(orderId);
    const purchasedProductId = req.params.purchasedProduct_id;

    const purchasedProductIndex = order.purchasedProducts.findIndex((product) => product.product.toString() === productId && product._id.toString() === purchasedProductId);

    if (purchasedProductIndex !== -1) {
      const purchasedProduct = order.purchasedProducts[purchasedProductIndex];

      let wallet = await Wallet.findOne({ user: userId });

      if (!wallet) {
        wallet = new Wallet({ user: userId });
      }

      wallet.balance += purchasedProduct.quantity * product.price;

      order.purchasedProducts[purchasedProductIndex].status = 'Returned';
      order.purchasedProducts[purchasedProductIndex].returnedDate = new Date();

      await order.save();

      product.quantity += purchasedProduct.quantity;
      await product.save();

      const credit = {
        order: orderId,
        date: purchasedProduct.returnedDate,
        productName: product.title,
        quantity: purchasedProduct.quantity,
        amount: purchasedProduct.quantity * product.price,
      };

      wallet.credits.push(credit);

      await wallet.save();

      res.redirect(`/home/orderHistory/${user._id}`);
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadShop = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const user = await User.findById(userId);
    const products = await Product.find().populate('category');
    const categories = await Category.find();
    const offers = await Offer.find();
    res.render('shop', {
      user, products, categories, offers,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadGuestShop = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    const categories = await Category.find();
    res.render('guestShop', { products, categories });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const guestShopByCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categoryId = req.params.category_id;
    const category = await Category.findById(categoryId);
    const products = await Product.find().populate('category');
    res.render('guestShopByCategory', { category, products });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const userShopByCategory = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.user_id;
    const categoryId = req.params.category_id;
    const user = await User.findById(userId);
    const category = await Category.findById(categoryId);
    const products = await Product.find().populate('category');
    const offers = await Offer.find();
    res.render('userShopByCategory', {
      user, category, products, offers,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const userId = req.session.user_id;
    const productId = req.params.product_id;
    const product = await Product.findById(productId);

    let wishlist = await Wishlist.findOne({ user: userId });

    const wishlistItems = {
      product: productId,
      productName: product.title,
      is_in_wishlist: true,
    };

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        wishList: [wishlistItems],
      });
    }

    const productIndex = wishlist.wishList.findIndex(
      (item) => item.product.toString() === productId.toString(),
    );

    if (productIndex !== -1) {
      if (wishlist.wishList[productIndex].is_in_wishlist) {
        return res.status(200).json({
          success: false,
          message: 'Product is already in the wishlist',
        });
      }
      wishlist.wishList[productIndex].is_in_wishlist = true;
    } else {
      wishlist.wishList.push(wishlistItems);
    }

    await wishlist.save();

    res.redirect('/home');
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.params.product_id;
    const product = await Product.findById(productId);
    let wishlist = await Wishlist.findOne({ user: userId });

    const wishlistItems = {
      product: productId,
      productName: product.title,
      is_in_wishlist: false,
    };

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        wishList: [wishlistItems],
      });
    }

    if (wishlist.wishList && wishlist.wishList.length > 0) {
      const productIndex = wishlist.wishList.findIndex(
        (item) => item.product.toString() === productId.toString(),
      );

      if (productIndex !== -1) {
        wishlist.wishList[productIndex].is_in_wishlist = false;
      }
    }

    await wishlist.save();

    res.redirect('/home');
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const removeProductFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.params.product_id;
    const wishlistId = req.params.wishlist_id;
    const product = await Product.findById(productId);
    let wishlist = await Wishlist.findOne({ user: userId });

    const wishlistItems = {
      product: productId,
      productName: product.title,
      is_in_wishlist: false,
    };

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        wishList: [wishlistItems],
      });
    }

    if (wishlist.wishList && wishlist.wishList.length > 0) {
      const productIndex = wishlist.wishList.findIndex(
        (item) => item.product.toString() === productId.toString(),
      );

      if (productIndex !== -1) {
        wishlist.wishList[productIndex].is_in_wishlist = false;
      }
    }

    await wishlist.save();

    res.redirect(`/home/wishlist/${wishlistId}`);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const wishlistId = req.params.wishlist_id;
    const wishlists = await Wishlist.findById(wishlistId).populate('wishList.product');
    const product = await Product.findOne({ title: wishlists.productName });
    const user = await User.findById(userId);
    res.render('wishlist', { user, wishlists, product });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const addToCartFromWishlist = async (req, res) => {
  try {
    const wishlistId = req.params.wishlist_id;
    const productId = req.params.product_id;
    const userId = req.session.user_id;
    const wishlist = await Wishlist.findById(wishlistId).populate('wishList.product');

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [],
        totalAmount: 0,
      });
    }

    const wishlistProductIndex = wishlist.wishList.findIndex((item) => item.product._id.toString() === productId);

    const existingProductIncart = cart.products.find((item) => item.product.toString() === productId);

    if (existingProductIncart) {
      existingProductIncart.quantity += 1;
    } else {
      const wishlistProduct = wishlist.wishList[wishlistProductIndex];
      const newProduct = {
        product: productId,
        productName: wishlistProduct.productName,
        quantity: 1,
        price: wishlistProduct.product.price,
      };
      cart.products.push(newProduct);
    }

    cart.totalAmount += wishlist.wishList[wishlistProductIndex].product.price;

    wishlist.wishList.splice(wishlistProductIndex, 1);

    await cart.save();
    await wishlist.save();

    res.redirect(`/home/wishlist/${wishlistId}`);
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const couponCode = req.body.coupon;
    const coupon = await Coupon.findOne({ code: couponCode });
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    const user = await User.findById(userId);
    const order = await Order.findOne({ cart: cart._id });
    const coupons = await Coupon.find();
    const wallet = await Wallet.findOne({ user: userId });

    const currentDate = new Date();
    if (currentDate < coupon.validityStart || currentDate > coupon.validityEnd) {
      coupon.is_active = false;
      await coupon.save();
      return res.json({ success: false, message: 'The Coupon is Expired' });
    }

    if (coupon.totalUsageCount >= coupon.usageLimit) {
      coupon.is_active = false;
      await coupon.save();
      return res.json({ success: false, message: 'The Coupon usage limit has reached' });
    }

    let { totalAmount } = cart;

    if (coupon.is_active) {
      if (coupon.discountType === 'Percentage') {
        if (totalAmount >= coupon.minimumOrderAmount) {
          const discountablePrice = totalAmount * (coupon.discountValue / 100);
          if (discountablePrice <= coupon.maximumDiscountAmount) {
            totalAmount -= discountablePrice;

            const userDetails = {
              user: userId,
            };
            coupon.usedBy.push(userDetails);
            coupon.totalUsageCount += 1;

            cart.totalAmount = totalAmount;

            await cart.save();
            await coupon.save();

            res.json({
              success: true,
              message: 'Coupon Applied Successfully',
              cart,
              order,
              coupons,
            });
          } else {
            totalAmount -= coupon.maximumDiscountAmount;

            const userDetails = {
              user: userId,
            };
            coupon.usedBy.push(userDetails);
            coupon.totalUsageCount += 1;

            cart.totalAmount = totalAmount;

            await cart.save();
            await coupon.save();

            res.json({
              success: true,
              message: 'Coupon Applied Successfully',
              cart,
              order,
              coupons,
            });
          }
        } else {
          res.json({ success: false, message: `The Minimum Order Amount for Applying this Coupon is ₹${coupon.minimumOrderAmount}` });
        }
      } else if (totalAmount >= coupon.minimumOrderAmount) {
        const discountablePrice = coupon.discountValue;
        totalAmount -= discountablePrice;

        const userDetails = {
          user: userId,
        };
        coupon.usedBy.push(userDetails);
        coupon.totalUsageCount += 1;

        cart.totalAmount = totalAmount;

        await cart.save();
        await coupon.save();
        res.json({
          success: true,
          message: 'Coupon Applied Successfully',
          cart,
          order,
          coupons,
        });
      } else {
        res.json({ success: false, message: `The Minimum Order Amount for Applying this Coupon is ₹${coupon.minimumOrderAmount}` });
      }
    } else {
      res.json({ success: false, message: 'Coupon is inactive' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error applying coupon' });
  }
};

const searchProducts = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const productData = await Product.find().populate('category');
    const offers = await Offer.find();
    const { search } = req.query;
    if (search !== '') {
      const flteredProducts = productData.filter((product) => product.title.toLowerCase().startsWith(search.toLowerCase()));
      res.render('shopBySearch', { user, products: flteredProducts, offers });
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = new Wallet({
        user: userId,
      });
      wallet = await wallet.save();
    }

    res.render('wallet', { user, wallet });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

module.exports = loadWallet;

const loadEnterReview = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const productId = req.params.product_id;
    const product = await Product.findById(productId);
    res.render('reviewEntry', { user, product });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const enterReview = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.params.product_id;
    const { rating, content } = req.body;

    const user = await User.findById(userId);
    const product = await Product.findById(productId);

    let productReview = await Review.findOne({ user: user._id });

    if (!productReview) {
      productReview = new Review({
        user: user._id,
      });
    }

    const details = {
      product: product._id,
      rating: parseInt(rating),
      content,
      date: new Date(),
    };
    productReview.review.push(details);

    await productReview.save();

    res.redirect(`/home/productDetails/${userId}/${productId}`);
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const loadUpdateReview = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const productId = req.params.product_id;
    const user = await User.findById(userId);
    let rating;
    let content;
    const reviews = await Review.findOne({ user: userId });
    reviews.review.forEach((review) => {
      if (review.product.toString() === productId.toString()) {
        rating = review.rating;
        content = review.content;
      }
    });
    res.render('updateReview', {
      rating, content, userId, productId, user,
    });
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const userId = req.params.user_id;
    const reviews = await Review.findOne({ user: userId });
    reviews.review.forEach((review) => {
      if (review.product.toString() === productId.toString()) {
        review.rating = req.body.rating;
        review.content = req.body.content;
        review.date = new Date();
      }
    });
    await reviews.save();
    res.redirect(`/home/productDetails/${userId}/${productId}`);
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const payWithWallet = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ user: userId });
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    const order = await Order.findOne({ cart: cart._id });
    if (wallet.balance >= cart.totalAmount && wallet.balance > 0) {
      cart.products.forEach(async (item) => {
        const purchasedProducts = {
          userName: user.name,
          product: item.product._id,
          quantity: item.quantity,
          paymentMethod: 'Wallet',
          address: {
            name: order.shippingAddress[0].name,
            houseName: order.shippingAddress[0].houseName,
            place: order.shippingAddress[0].place,
            city: order.shippingAddress[0].city,
            district: order.shippingAddress[0].district,
            state: order.shippingAddress[0].state,
            pinCode: order.shippingAddress[0].pinCode,
            phoneNumber: order.shippingAddress[0].phoneNumber,
          },
          status: 'Pending',
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
        };
        order.purchasedProducts.push(purchasedProducts);

        const product = await Product.findById(item.product._id);
        product.quantity -= item.quantity;
        await product.save();
      });
      await order.save();

      wallet.balance -= cart.totalAmount;
      const debit = {
        order: order._id,
        date: new Date(),
        amount: cart.totalAmount,
      };
      wallet.debits.push(debit);
      await wallet.save();

      cart.products = [];
      cart.totalAmount = 0;
      await wallet.save();

      await cart.save();

      res.redirect('/home/success');
    } else if (wallet.balance < cart.totalAmount && wallet.balance > 0) {
      const debit = {
        order: order._id,
        date: new Date(),
        amount: wallet.balance,
      };
      wallet.debits.push(debit);

      cart.totalAmount -= wallet.balance;
      await cart.save();

      wallet.balance = 0;
      await wallet.save();

      res.redirect(`/home/shopingCart/${cart._id}`);
    } else {
      res.redirect(`/home/shopingCart/${cart._id}`);
    }
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

module.exports = {
  loadRegister,
  insertUser,
  loadOtpVerification,
  resendOTP,
  insertOTP,
  loadLogin,
  verifyLogin,
  loadGuestHome,
  loadUserHome,
  userLogout,
  loadForget,
  verifyForget,
  verifyOTP,
  loadResetPassword,
  resetPassword,
  loadProfileEdit,
  updateUserProfile,
  LoadProductDetailsUserHome,
  loadProductDetails,
  addProductToCart,
  loadShopingCart,
  updateCart,
  deleteCartProduct,
  loadShippingDetails,
  insertShippingDetails,
  loadUpdateShippingDetails,
  UpdateShippingDetails,
  deleteAddress,
  loadUserProfile,
  cartCheckout,
  loadSuccessPage,
  loadOrderHistory,
  loadShop,
  loadGuestShop,
  guestShopByCategory,
  userShopByCategory,
  cancelOrder,
  addToWishlist,
  removeFromWishlist,
  removeProductFromWishlist,
  loadWishlist,
  addToCartFromWishlist,
  applyCoupon,
  returnProduct,
  searchProducts,
  loadWallet,
  loadEnterReview,
  enterReview,
  loadUpdateReview,
  updateReview,
  payWithWallet,
};