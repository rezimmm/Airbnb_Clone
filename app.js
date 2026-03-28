// Core Module
const path = require('path');
require('dotenv').config();

// External Module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Local Module
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");

const app = express();

// ✅ HIDE EXPRESS HEADER
app.disable("x-powered-by");

// ✅ CHECK ENV VARIABLE FIRST (VERY IMPORTANT)
if (!process.env.DB_PATH) {
  console.log("❌ ERROR: DB_PATH is missing in environment variables");
  process.exit(1);
}

// ✅ USE DIRECT ENV VALUE
const DB_PATH = process.env.DB_PATH;

// ✅ SESSION STORE
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

// ✅ TRUST PROXY (IMPORTANT FOR RENDER)
app.set('trust proxy', 1);

// ✅ FORCE HTTPS
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// ✅ SECURITY HEADERS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

// ✅ RATE LIMITING (ANTI-DDOS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.set('view engine', 'ejs');
app.set('views', 'views');

// ✅ RANDOM STRING FUNCTION
const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// ✅ MULTER STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

// ✅ FILE FILTER (IMPROVED)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpg", "image/jpeg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// ✅ MULTER OPTIONS (SIZE LIMIT ADDED)
const multerOptions = {
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
};

// ✅ MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(multer(multerOptions).single('photo'));
app.use(express.static(path.join(rootDir, 'public')));
app.use("/uploads", express.static(path.join(rootDir, 'uploads')));
app.use("/host/uploads", express.static(path.join(rootDir, 'uploads')));
app.use("/homes/uploads", express.static(path.join(rootDir, 'uploads')));

// ✅ SESSION (SECURED)
app.use(session({
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    secure: true,   // 🔥 important for HTTPS
    sameSite: "lax"
  }
}));

// ✅ LOGIN CHECK
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  next();
});

// ✅ ROUTES
app.use(authRouter);
app.use(storeRouter);

// ✅ PROTECTED ROUTES
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