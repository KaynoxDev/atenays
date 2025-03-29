'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

// Load NewOrderForm dynamically with no SSR
const NewOrderForm = dynamic(() => import('./NewOrderForm'), { 
  ssr: false,
  loading: () => <OrderPageSkeleton />
});

// Main page component
export default function NewOrderPage() {
  return <NewOrderForm />;
}

// Skeleton while loading
function OrderPageSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-96 mt-1" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
