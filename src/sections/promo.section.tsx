import Link from "next/link";
import Image from "next/image";

const collections = [
  {
    id: 1,
    image: "/landscaping.jpg",
    category: "landscaping",
    alt: "Landscaping",
  },
  {
    id: 2,
    image: "/home-decor.jpg",
    category: "home-decor-and-furnishing",
    alt: "Home Décor & Furnishing",
  },
  {
    id: 3,
    image: "/furniture.jpg",
    category: "furniture-and-fittings",
    alt: "Furniture & Fittings",
  },
  {
    id: 4,
    image: "/garden.jpg",
    category: "garden",
    alt: "Gardening",
  },
];

export default function PromoSection() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[60vh] md:min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background Image or Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{
          backgroundImage: "url('/promo.jpg')",
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 text-center">
        {/* Sale Banner */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 text-white">
            We Specialize In Landscaping, Landscape Supplies, Lawn Care & Lawn Services
          </h1>
          <Link href="/shop">
            <button className="bg-[#C9A13C] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-yellow-400 transition duration-300 text-sm sm:text-base">
              Shop Collection
            </button>
          </Link>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/shop/${collection.category.toLowerCase()}`}
              className="block relative bg-white rounded-lg shadow-lg overflow-hidden group"
            >
              <Image
                src={collection.image}
                alt={collection.alt}
                className="w-full h-32 sm:h-40 md:h-48 lg:h-70 object-cover transition-transform duration-300 group-hover:scale-105"
                width={255}
                height={128} // Base height
               />
              <div className="absolute inset-0 bg-black bg-opacity-0 flex items-end p-4 opacity-60">
                <div className="w-full text-center text-white">
                  <p className="font-bold text-sm sm:text-base md:text-lg">{collection.alt}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Activate Wind Note (Placeholder) */}
        {/* <div className="mt-4 sm:mt-6 md:mt-8 text-gray-400 text-xs sm:text-sm">
          Activate Wind - Go to Settings to customize
        </div> */}
      </div>
    </section>
  );
}