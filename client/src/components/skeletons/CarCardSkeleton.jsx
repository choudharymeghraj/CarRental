import React from 'react'

const CarCardSkeleton = () => (
  <div className='rounded-xl overflow-hidden border border-borderColor bg-white'>
    {/* Image placeholder */}
    <div className='skeleton h-48 w-full' />

    <div className='p-4 sm:p-5 space-y-3'>
      {/* Title */}
      <div className='skeleton h-4 w-3/4' />
      <div className='skeleton h-3 w-1/2' />

      {/* Specs grid */}
      <div className='grid grid-cols-2 gap-2 mt-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='skeleton h-3 w-full' />
        ))}
      </div>
    </div>
  </div>
)

export default CarCardSkeleton
