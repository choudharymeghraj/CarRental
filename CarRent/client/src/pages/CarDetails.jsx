import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { useCars } from '../hooks/useCars'
import Loader from '../components/Loader'
import toast from 'react-hot-toast'
import { motion } from 'motion/react'

const CarDetails = () => {

  const { id } = useParams()
  const navigate = useNavigate()
  const { axios, token, setShowLogin } = useAppContext()
  const currency = import.meta.env.VITE_CURRENCY || '$'

  // Local date state (removed from Context)
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')

  // Use TanStack Query hook
  const { data: cars, isLoading } = useCars()
  const car = cars?.find(c => c._id === id)

  // Calculate rental days & total price dynamically
  const days = pickupDate && returnDate
    ? Math.max(1, Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86_400_000))
    : null
  const totalPrice = days ? (car?.pricePerDay ?? 0) * days : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setShowLogin(true)
      return toast.error('Please log in first to book a car')
    }
    if (!pickupDate || !returnDate) return toast.error('Please select pickup and return dates')
    if (new Date(returnDate) <= new Date(pickupDate)) return toast.error('Return date must be after pickup date')

    try {
      const { data } = await axios.post('/api/bookings/create', { car: id, pickupDate, returnDate })
      if (data.success) {
        toast.success(data.message)
        navigate('/my-bookings')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message
      toast.error(errorMsg)
    }
  }

  useEffect(() => {
    if (!token) {
      setShowLogin(true)
      navigate('/')
    }
  }, [token, navigate, setShowLogin])

  if (isLoading) return <Loader />
  if (!car) return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] text-gray-500'>
      <p className='text-xl'>Car not found.</p>
      <button onClick={() => navigate('/cars')} className='mt-4 px-6 py-2 bg-primary text-white rounded-lg'>
        Browse Cars
      </button>
    </div>
  )

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-32 mt-16'>

      <button onClick={() => navigate(-1)} className='flex items-center gap-2 mb-6 text-gray-500 hover:text-primary transition-colors cursor-pointer'>
        <img src={assets.arrow_icon} alt="" className='rotate-180 opacity-65' />
        Back to all cars
      </button>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12'>
        {/* Left: Car Image & Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='lg:col-span-2'>

          <motion.img
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={car.image} alt={`${car.brand} ${car.model}`}
            className='w-full h-auto md:max-h-100 object-cover rounded-xl mb-6 shadow-md' />

          <motion.div className='space-y-6'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div>
              <h1 className='text-3xl font-bold'>{car.brand} {car.model}</h1>
              <p className='text-gray-500 text-lg'>{car.category} • {car.year}</p>
            </div>
            <hr className='border-borderColor my-6' />

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              {[
                { icon: assets.users_icon, text: `${car.seating_capacity} Seats` },
                { icon: assets.fuel_icon, text: car.fuel_type },
                { icon: assets.car_icon, text: car.transmission },
                { icon: assets.location_icon, text: car.location },
              ].map(({ icon, text }) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  key={text} className='flex flex-col items-center bg-light p-4 rounded-lg'>
                  <img src={icon} alt="" className='h-5 mb-2' />
                  {text}
                </motion.div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className='text-xl font-medium mb-3'>Description</h2>
              <p className='text-gray-500'>{car.description}</p>
            </div>

            {/* Features */}
            <div>
              <h2 className='text-xl font-medium mb-3'>Features</h2>
              <ul className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                {["360 Camera", "Bluetooth", "GPS", "Heated Seats", "Rear View Camera"].map((item) => (
                  <li key={item} className='flex items-center text-gray-500'>
                    <img src={assets.check_icon} className='h-4 mr-2' alt="" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </motion.div>
        </motion.div>

        {/* Right: Booking Form */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          onSubmit={handleSubmit}
          className='shadow-lg h-max sticky top-18 rounded-xl p-6 space-y-5 text-gray-500 border border-borderColor bg-white'>

          <p className='flex items-center justify-between text-2xl text-gray-800 font-semibold'>
            {currency}{car.pricePerDay}
            <span className='text-base text-gray-400 font-normal'>per day</span>
          </p>

          <hr className='border-borderColor' />

          <div className='flex flex-col gap-2'>
            <label htmlFor="pickup-date" className='font-medium text-sm text-gray-700'>Pickup Date</label>
            <input
              value={pickupDate}
              onChange={(e) => { setPickupDate(e.target.value); if (returnDate && e.target.value >= returnDate) setReturnDate('') }}
              type="date"
              className='border border-borderColor px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30'
              required
              id='pickup-date'
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label htmlFor="return-date" className='font-medium text-sm text-gray-700'>Return Date</label>
            <input
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              type="date"
              className='border border-borderColor px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30'
              required
              id='return-date'
              min={pickupDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Dynamic price summary */}
          {days && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-light rounded-lg p-3 space-y-1 text-sm'>
              <div className='flex justify-between'>
                <span>{currency}{car.pricePerDay} × {days} day{days > 1 ? 's' : ''}</span>
                <span className='font-semibold text-primary'>{currency}{totalPrice}</span>
              </div>
            </motion.div>
          )}

          <button
            type='submit'
            className='w-full bg-accent hover:bg-accent-dull transition-all py-3 font-semibold text-white rounded-xl cursor-pointer shadow-md'>
            Book Now
          </button>

          <p className='text-center text-xs text-gray-400'>No credit card required to reserve</p>

        </motion.form>
      </div>

    </div>
  )
}

export default CarDetails
