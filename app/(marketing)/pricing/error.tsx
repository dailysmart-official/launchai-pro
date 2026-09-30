"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  void reset;
  return (
    <div className="text-center py-16">
      <h2 className="text-xl font-semibold">Failed to load pricing</h2>
      <button onClick={() => reset()} className="mt-4 text-sm underline">Try again</button>
    </div>
  );
}
