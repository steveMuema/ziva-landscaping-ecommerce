import { ImageLoader } from "next/image";

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  // Check if the src is a Cloudinary URL or a static path
  if (src.startsWith("https://res.cloudinary.com")) {
    const params = ["f_auto", "c_limit", `w_${width}`, `q_${quality || "auto"}`];
    return `${src}?${params.join(",")}`; // Append transformation params to existing URL
  }
  // For static images in public folder, use default Next.js behavior
  return `/images/${src}`; // Adjust based on your static image structure
};

export default cloudinaryLoader;