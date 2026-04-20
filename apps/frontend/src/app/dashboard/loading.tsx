export default function Loading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
      <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-zinc-700 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3 mt-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-zinc-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
