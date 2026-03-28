// Core Module
const path = require('path');
require('dotenv').config();

// External Module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { default: mongoose } = require('mongoose');
const multer = require('multer');

// Local Module
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");

const app = express();

// ✅ CHECK ENV VARIABLE FIRST (VERY IMPORTANT)
if (!process.env.DB_PATH) {
  console.log("❌ ERROR: DB_PATH is missing in environment variables");
  process.exit(1);
}

// ✅ USE DIRECT ENV VALUE (more reliable)
const DB_PATH = process.env.DB_PATH;

// ✅ SESSION STORE (safe now)
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

// ✅ RANDOM STRING FUNCTION (unchanged)
const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// ✅ MULTER STORAGE (unchanged)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const multerOptions = { storage, fileFilter };

// ✅ MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(multer(multerOptions).single('photo'));
app.use(express.static(path.join(rootDir, 'public')));
app.use("/uploads", express.static(path.join(rootDir, 'uploads')));
app.use("/host/uploads", express.static(path.join(rootDir, 'uploads')));
app.use("/homes/uploads", express.static(path.join(rootDir, 'uploads')));

// ✅ SESSION
app.use(session({
  secret: "KnowledgeGate AI with Complete Coding",
  resave: false,
  saveUninitialized: false, // 🔥 better practice
  store
}));

// ✅ LOGIN CHECK
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  next();
});

// ✅ ROUTES
app.use(authRouter);
app.use(storeRouter);

app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});

app.use("/host", hostRouter);

// ✅ 404
app.use(errorsController.pageNotFound);

// ✅ PORT FIX (RENDER READY)
const PORT = process.env.PORT || 3003;

// ✅ DB CONNECTION + SERVER START
mongoose.connect(DB_PATH)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.log('❌ Error while connecting to Mongo:', err);
  });