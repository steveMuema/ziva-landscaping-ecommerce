module.exports = {
  images: {
    domains: [process.env.CLOUDINARY_CLOUD_NAME ? `res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}` : "res.cloudinary.com"],
  },
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
};