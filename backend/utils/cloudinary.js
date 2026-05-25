const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });
  return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
};

const deleteImage = async (url) => {
  if (!url || !url.includes('cloudinary')) return;
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    await cloudinary.uploader.destroy(`${folder}/${filename}`);
  } catch (e) {}
};

module.exports = { createUploader, deleteImage };
