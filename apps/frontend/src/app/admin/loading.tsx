export default function Loading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
      <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3" />
      <div className="grid grid-cols-1 gap-4 mt-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-zinc-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
