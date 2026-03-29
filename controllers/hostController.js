const Home = require("../models/home");
const fs = require("fs"); // ✅ ADD THIS

exports.getAddHome = (req, res) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to airbnb",
    currentPage: "addHome",
    editing: false,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditHome = (req, res) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";

  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found for editing.");
      return res.redirect("/host/host-home-list");
    }

    console.log(homeId, editing, home);
    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      editing: editing,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getHostHomes = (req, res) => {
  Home.find().then((registeredHomes) => {
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.postAddHome = async (req, res) => {
  try {
    const { houseName, price, location, rating, description } = req.body;

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(422).send("❌ No image provided");
    }

    const photo = req.file.path;

    const home = new Home({
      houseName,
      price,
      location,
      rating,
      photo,
      description,
    });

    await home.save();

    console.log("✅ Home Saved successfully");

    res.redirect("/host/host-home-list");

  } catch (err) {
    console.log("❌ FULL ERROR:", err);
    console.log("❌ ERROR MESSAGE:", err.message);
    console.log("❌ ERROR STACK:", err.stack);

    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
};

exports.postEditHome = async (req, res) => {
  try {
    const { id, houseName, price, location, rating, description } = req.body;

    const home = await Home.findById(id);

    if (!home) {
      console.log("Home not found");
      return res.redirect("/host/host-home-list");
    }

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

    if (req.file) {

      // ✅ DELETE ONLY IF LOCAL FILE
      if (home.photo && !home.photo.startsWith("http") && fs.existsSync(home.photo)) {
        fs.unlink(home.photo, (err) => {
          if (err) {
            console.log("Error while deleting file ", err);
          }
        });
      }

      home.photo = req.file.path; // ✅ Cloudinary URL
    }

    await home.save();

    console.log("✅ Home updated successfully");
    res.redirect("/host/host-home-list");

  } catch (err) {
    console.log("❌ ERROR while editing:", err);
    res.status(500).send(err.message);
  }
};

exports.postDeleteHome = (req, res) => {
  const homeId = req.params.homeId;

  Home.findById(homeId)
    .then((home) => {
      if (!home) return res.redirect("/host/host-home-list");

      // ✅ DELETE ONLY LOCAL FILE
      if (home.photo && !home.photo.startsWith("http") && fs.existsSync(home.photo)) {
        fs.unlink(home.photo, (err) => {
          if (err) console.log(err);
        });
      }

      return Home.findByIdAndDelete(homeId);
    })
    .then(() => {
      res.redirect("/host/host-home-list");
    })
    .catch((err) => {
      console.log("Error while deleting ", err);
    });
};