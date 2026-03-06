'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Results</h1>
      <p>Search query: {query || 'No query provided'}</p>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
