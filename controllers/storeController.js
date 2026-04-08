const Home = require("../models/home");
const User = require("../models/user");

exports.getIndex = async (req, res, next) => {
  try {
    const category = req.query.category || 'all';
    const search = req.query.search || '';
    
    // Build query
    let query = {};
    if (category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { location: { $regex: search, $options: 'i' } },
        { houseName: { $regex: search, $options: 'i' } }
      ];
    }

    const registeredHomes = await Home.find(query);
    
    // Get user's favourites for heart state
    let favouriteIds = [];
    if (req.isLoggedIn && req.session.user) {
      const user = await User.findById(req.session.user._id);
      if (user) {
        favouriteIds = user.favourites.map(id => id.toString());
      }
    }

    // Attach isFavourite flag to each home
    const homesWithMeta = registeredHomes.map(home => ({
      ...home._doc,
      isFavourite: favouriteIds.includes(home._id.toString())
    }));

    res.render("store/index", {
      registeredHomes: homesWithMeta,
      pageTitle: "AuraStay | Experience the Extraordinary",
      currentPage: "index",
      currentCategory: category,
      currentSearch: search,
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.getHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Homes List",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  });
};

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.isLoggedIn, 
    user: req.session.user,
  });
};

exports.getFavouriteList = async (req, res, next) => {
  const userId = req.session.user._id;
  const user = await User.findById(userId).populate('favourites');
  res.render("store/favourite-list", {
    favouriteHomes: user.favourites,
    pageTitle: "My Favourites",
    currentPage: "favourites",
    isLoggedIn: req.isLoggedIn, 
    user: req.session.user,
  });
};

exports.postAddToFavourite = async (req, res, next) => {
  const homeId = req.body.id;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (!user.favourites.includes(homeId)) {
    user.favourites.push(homeId);
    await user.save();
  }
  res.redirect("/favourites");
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  const homeId = req.params.homeId;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (user.favourites.includes(homeId)) {
    user.favourites = user.favourites.filter(fav => fav != homeId);
    await user.save();
  }
  res.redirect("/favourites");
};

exports.getHomeDetails = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    
    if (!home) {
      return res.redirect("/homes");
    }

    let isFavourite = false;
    if (req.isLoggedIn && req.session.user) {
      const user = await User.findById(req.session.user._id);
      isFavourite = user.favourites.includes(homeId);
    }

    res.render("store/home-detail", {
      home: home,
      pageTitle: "AuraStay | " + home.houseName,
      currentPage: "Home",
      isFavourite: isFavourite,
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postBooking = (req, res, next) => {
  // Simple redirect to bookings for now to make the button "workable"
  res.redirect("/bookings");
};
