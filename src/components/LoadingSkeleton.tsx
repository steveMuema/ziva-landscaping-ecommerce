export default function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-gray-800 animate-pulse rounded-lg h-32 sm:h-40 md:h-48"></div>
      ))}
    </div>
  );
}