import React, { useEffect, useState } from 'react'
import Title from '../../components/owner/Title'
import StatusBadge from '../../components/StatusBadge'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const ManageBookings = () => {

    const { currency, axios } = useAppContext()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchOwnerBookings = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/bookings/owner')
            data.success ? setBookings(data.bookings) : toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const changeBookingStatus = async (bookingId, status) => {
        try {
            const { data } = await axios.post('/api/bookings/change-status', { bookingId, status })
            if (data.success) {
                toast.success(data.message)
                fetchOwnerBookings()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => { fetchOwnerBookings() }, [])

    return (
        <div className='px-4 pt-10 md:px-10 w-full'>

            <Title title="Manage Bookings" subTitle="Track all customer bookings, approve or cancel requests, and manage booking statuses." />

            <div className='max-w-4xl w-full rounded-xl overflow-hidden border border-borderColor mt-6 bg-white shadow-sm'>

                {loading ? (
                    <div className='p-6 space-y-3'>
                        {[...Array(4)].map((_, i) => <div key={i} className='skeleton h-12 w-full rounded-lg' />)}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className='p-12 text-center text-gray-400'>No bookings yet.</div>
                ) : (
                    <table className='w-full border-collapse text-left text-sm text-gray-600'>
                        <thead className='bg-light border-b border-borderColor'>
                            <tr>
                                <th className="p-3 font-semibold text-gray-700">Car</th>
                                <th className="p-3 font-semibold text-gray-700 max-md:hidden">Date Range</th>
                                <th className="p-3 font-semibold text-gray-700">Total</th>
                                <th className="p-3 font-semibold text-gray-700">Status</th>
                                <th className="p-3 font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking, index) => (
                                <tr key={index} className='border-t border-borderColor hover:bg-gray-50/50 transition-colors'>

                                    <td className='p-3'>
                                        <div className='flex items-center gap-3'>
                                            <img src={booking.car?.image} alt="" className='h-10 w-16 rounded-md object-cover' />
                                            <p className='font-medium max-md:hidden'>{booking.car?.brand} {booking.car?.model}</p>
                                        </div>
                                    </td>

                                    <td className='p-3 max-md:hidden text-gray-500'>
                                        {booking.pickupDate.split('T')[0]}
                                        <span className='mx-1 text-gray-300'>→</span>
                                        {booking.returnDate.split('T')[0]}
                                    </td>

                                    <td className='p-3 font-semibold text-primary'>{currency}{booking.price}</td>

                                    <td className='p-3'>
                                        <StatusBadge status={booking.status} />
                                    </td>

                                    <td className='p-3'>
                                        <select
                                            onChange={e => changeBookingStatus(booking._id, e.target.value)}
                                            value={booking.status}
                                            className='px-2 py-1.5 text-xs font-medium rounded-lg outline-none border border-borderColor bg-white cursor-pointer'>
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    )
}

export default ManageBookings
