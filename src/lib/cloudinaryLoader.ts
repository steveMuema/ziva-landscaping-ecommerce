import { ImageLoader } from "next/image";

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  if (src.startsWith("https://res.cloudinary.com")) {
    const params = ["f_auto", "c_limit", `w_${width}`, `q_${quality || "auto"}`];
    return `${src}?${params.join(",")}`;
  }
  // Local paths (e.g. /product-images/...) must be returned as-is so they load from public
  if (src.startsWith("/")) {
    return src;
  }
  return `/images/${src}`;
};

export default cloudinaryLoader;