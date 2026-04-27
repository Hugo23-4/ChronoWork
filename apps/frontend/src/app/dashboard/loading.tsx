export default function Loading() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-3">
        <div className="skeleton h-9 w-1/3" style={{ borderRadius: 12 }} />
        <div className="skeleton h-4 w-1/2" style={{ borderRadius: 8 }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-32" style={{ borderRadius: 24 }} />
        ))}
      </div>
      <div className="space-y-3 mt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16" style={{ borderRadius: 18 }} />
        ))}
      </div>
    </div>
  );
}
