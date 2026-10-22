require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlvwjuaup',
  api_key: process.env.CLOUDINARY_API_KEY || '428643137769947',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Jwnz91fkpyAbPIXInAXjyVacxr8',
  secure: true,
});

module.exports = cloudinary;
