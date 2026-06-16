import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import Title from '../components/Title'
import { useAppContext } from '../context/AppContext'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react'

const MyBookings = () => {

  const { axios, user, token, setShowLogin, navigate, currency } = useAppContext()

  const [bookings, setBookings] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editPickupDate, setEditPickupDate] = useState("")
  const [editReturnDate, setEditReturnDate] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchMyBookings = React.useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/bookings/user')
      if (data.success) {
        setBookings((data.bookings || []).filter(booking => booking.status !== 'cancelled'))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [axios])

  const cancelBooking = async (bookingId) => {
    try {
      const confirm = window.confirm('Are you sure you want to cancel this booking?')
      if (!confirm) return

      const { data } = await axios.post('/api/bookings/cancel', { bookingId })
      if (data.success) {
        toast.success(data.message)
        fetchMyBookings()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleEditClick = (booking) => {
    setEditingId(booking._id)
    setEditPickupDate(booking.pickupDate.split('T')[0])
    setEditReturnDate(booking.returnDate.split('T')[0])
  }

  const handleSaveEdit = async (bookingId) => {
    if (new Date(editPickupDate) >= new Date(editReturnDate)) {
      return toast.error("Return date must be after pickup date")
    }

    try {
      const { data } = await axios.post('/api/bookings/edit', {
        bookingId,
        pickupDate: editPickupDate,
        returnDate: editReturnDate
      })
      if (data.success) {
        toast.success(data.message)
        setEditingId(null)
        fetchMyBookings()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ✅ Razorpay Payment Initiation
  const initPay = async (bookingId) => {
    try {
      const { data } = await axios.post('/api/payment/create-order', { bookingId })

      if (data.success) {
        const options = {
          key: data.key_id,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'CarRental Payment',
          description: 'Payment for your car booking',
          order_id: data.order.id,
          handler: async (response) => {
            try {
              const { data: verifyData } = await axios.post('/api/payment/verify', response)
              if (verifyData.success) {
                toast.success(verifyData.message)
                fetchMyBookings()
                navigate('/payment-success')
              }
            } catch (error) {
              toast.error(error.message)
              navigate('/payment-failed')
            }
          },
          modal: {
            onDismiss: function () {
              toast.error('Payment cancelled')
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: {
            color: '#1E3A8A'
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (!token) {
      setShowLogin(true)
      navigate('/')
    } else if (user) {
      fetchMyBookings()
    }
  }, [user, token, navigate, setShowLogin, fetchMyBookings])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className='px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-48 mt-16 text-sm max-w-7xl'>

      <Title title='My Bookings'
        subTitle='View and manage your car bookings'
        align="left" />

      {loading ? (
        <div className='space-y-5 mt-12'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-40 skeleton rounded-xl' />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-24 text-gray-400'>
          <img src={assets.carIcon} alt="" className='h-16 opacity-30 mb-4' />
          <p className='text-lg'>No active bookings yet.</p>
        </div>
      ) : (
        <div>
          {bookings.map((booking, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              key={booking._id}
              className='grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border border-borderColor rounded-xl mt-5 first:mt-12 bg-white hover:shadow-md transition-shadow'>

              {/* Car Image + Info */}
              <div className='md:col-span-1'>
                <div className='rounded-lg overflow-hidden mb-3'>
                  <img src={booking.car?.image} alt="" className='w-full h-auto aspect-video object-cover' />
                </div>
                <p className='text-lg font-semibold mt-2'>{booking.car?.brand} {booking.car?.model}</p>
                <p className='text-gray-400 text-xs mt-0.5'>{booking.car?.year} • {booking.car?.category} • {booking.car?.location}</p>
              </div>

              {/* Booking Info */}
              <div className='md:col-span-2'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='px-3 py-1.5 bg-light rounded text-gray-600'>Booking #{index + 1}</span>
                  <StatusBadge status={booking.status} />
                </div>

                <div className='flex items-start gap-2 mt-4'>
                  <img src={assets.calendar_icon_colored} alt="" className='w-4 h-4 mt-0.5' />
                  <div className="w-full">
                    <p className='text-gray-400 text-xs mb-1'>Rental Period</p>
                    {editingId === booking._id ? (
                      <div className='flex flex-col gap-2 w-max'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-400 w-10'>From:</span>
                          <input type="date" value={editPickupDate}
                            onChange={(e) => setEditPickupDate(e.target.value)}
                            className='border border-gray-300 p-1.5 rounded outline-none text-gray-700 text-sm'
                            min={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-400 w-10'>To:</span>
                          <input type="date" value={editReturnDate}
                            onChange={(e) => setEditReturnDate(e.target.value)}
                            className='border border-gray-300 p-1.5 rounded outline-none text-gray-700 text-sm'
                            min={editPickupDate || new Date().toISOString().split('T')[0]} />
                        </div>
                      </div>
                    ) : (
                      <p className='font-medium'>
                        {booking.pickupDate.split('T')[0]}
                        <span className='text-gray-400 mx-1'>→</span>
                        {booking.returnDate.split('T')[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex items-start gap-2 mt-3'>
                  <img src={assets.location_icon_colored} alt="" className='w-4 h-4 mt-0.5' />
                  <div>
                    <p className='text-gray-400 text-xs mb-1'>Pick-up Location</p>
                    <p className='font-medium'>{booking.car?.location}</p>
                  </div>
                </div>
              </div>

              {/* Price & Actions */}
              <div className='md:col-span-1 flex flex-col justify-between gap-4'>
                <div className='text-right'>
                  <p className='text-xs text-gray-400'>Total Price</p>
                  <h2 className='text-2xl font-bold text-primary mt-0.5'>{currency}{booking.price}</h2>
                  <p className='text-xs text-gray-400 mt-1'>Booked {booking.createdAt.split('T')[0]}</p>
                </div>

                {booking.status !== 'cancelled' && booking.status !== 'completed' && editingId !== booking._id && (
                  <div className='flex items-center justify-end gap-2 mt-auto'>
                    {booking.status === 'confirmed' && booking.paymentStatus === 'pending' && (
                      <button
                        onClick={() => initPay(booking._id)}
                        className='px-6 py-2 bg-accent text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-accent-dull transition-all shadow-lg animate-pulse cursor-pointer'>
                        Pay Now
                      </button>
                    )}
                    {booking.paymentStatus === 'paid' && (
                      <span className='px-4 py-2 bg-green-100 text-green-600 rounded-lg text-xs font-bold uppercase'>
                        Paid
                      </span>
                    )}
                    {booking.paymentStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleEditClick(booking)}
                          className='px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-medium transition-all cursor-pointer'>
                          Edit
                        </button>
                        <button
                          onClick={() => cancelBooking(booking._id)}
                          className='px-4 py-2 border border-red-300 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-all cursor-pointer'>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}

                {editingId === booking._id && (
                  <div className='flex items-center justify-end gap-2 mt-auto'>
                    <button
                      onClick={() => setEditingId(null)}
                      className='px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-medium transition-all cursor-pointer'>
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(booking._id)}
                      className='px-4 py-2 bg-primary text-white hover:bg-primary-dull rounded-lg text-xs font-medium transition-all cursor-pointer'>
                      Save
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          ))}
        </div>
      )}

    </motion.div>
  )
}

export default MyBookings
