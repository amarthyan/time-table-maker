'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LabsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/subjects');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-body-md">
      <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900">Curriculum Subjects &amp; Labs</h2>
        <p className="text-xs text-slate-500">
          Laboratories and their weekly practical hours are now managed directly under Curriculum Subjects. Redirecting you...
        </p>
      </div>
    </div>
  );
}
