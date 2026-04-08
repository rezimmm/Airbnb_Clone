// External Module
const express = require("express");
const hostRouter = express.Router();

// ✅ ADD THIS (MULTER + CLOUDINARY)
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

// Local Module
const hostController = require("../controllers/hostController");

// ✅ CLOUDINARY STORAGE
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "aurastay",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// ROUTES
hostRouter.get("/add-home", hostController.getAddHome);

// ✅ APPLY MULTER HERE
hostRouter.post("/add-home", upload.single("photo"), hostController.postAddHome);

hostRouter.get("/host-home-list", hostController.getHostHomes);

hostRouter.get("/edit-home/:homeId", hostController.getEditHome);

// ✅ APPLY MULTER HERE ALSO
hostRouter.post("/edit-home", upload.single("photo"), hostController.postEditHome);

hostRouter.post("/delete-home/:homeId", hostController.postDeleteHome);

module.exports = hostRouter;