export default function Loading() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-3">
        <div className="skeleton h-9 w-1/3" style={{ borderRadius: 12 }} />
        <div className="skeleton h-4 w-2/3" style={{ borderRadius: 8 }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28" style={{ borderRadius: 24 }} />
        ))}
      </div>
      <div className="space-y-3 mt-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-14" style={{ borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}
