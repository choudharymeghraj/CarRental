import React, { useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import CarCard from '../components/CarCard'
import CarCardSkeleton from '../components/skeletons/CarCardSkeleton'
import { useCars } from '../hooks/useCars'

const Cars = () => {
  const [input, setInput] = useState('')
  const { data: cars = [], isLoading } = useCars()

  const filtered = cars.filter(car =>
    `${car.brand} ${car.model} ${car.category} ${car.location} ${car.fuel_type}`
      .toLowerCase()
      .includes(input.toLowerCase())
  )

  return (
    <div>
      <div className='flex flex-col items-center py-20 bg-light max-md:px-4'>
        <Title
          title='Available Cars'
          subTitle='Browse our selection of premium vehicles available for your next adventure'
        />

        <div className='flex items-center bg-white px-4 mt-6 max-w-140 w-full h-12 rounded-full shadow'>
          <img src={assets.search_icon} alt="" className='w-4.5 h-4.5 mr-2' />
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder='Search by make, model, or features'
            className='w-full h-full outline-none text-gray-500'
          />
          <img src={assets.filter_icon} alt="" className='w-4.5 h-4.5 ml-2' />
        </div>
      </div>

      <div className='px-6 md:px-16 lg:px-24 xl:px-32 mt-10'>
        {isLoading ? (
          <>
            <p className='text-gray-400 xl:px-20 max-w-7xl mx-auto text-sm'>Loading cars...</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 xl:px-20 max-w-7xl mx-auto'>
              {[...Array(6)].map((_, i) => <CarCardSkeleton key={i} />)}
            </div>
          </>
        ) : (
          <>
            <p className='text-gray-500 xl:px-20 max-w-7xl mx-auto'>
              Showing <span className='font-semibold text-primary'>{filtered.length}</span> car{filtered.length !== 1 ? 's' : ''}
              {input && ` for "${input}"`}
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 xl:px-20 max-w-7xl mx-auto'>
              {filtered.length > 0
                ? filtered.map((car) => <CarCard key={car._id} car={car} />)
                : <p className='col-span-full text-center text-gray-400 py-16'>No cars match your search.</p>
              }
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Cars