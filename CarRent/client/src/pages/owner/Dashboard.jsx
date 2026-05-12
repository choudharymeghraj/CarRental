import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import Title from '../../components/owner/Title'
import StatusBadge from '../../components/StatusBadge'
import { useAppContext } from '../../context/AppContext'
import { toast } from 'react-hot-toast'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const StatCard = ({ title, value, icon, accent }) => (
    <div className='flex gap-3 items-center justify-between p-5 rounded-xl border border-borderColor bg-white shadow-sm hover:shadow-md transition-shadow'>
        <div>
            <p className='text-xs text-gray-500 font-medium uppercase tracking-wide'>{title}</p>
            <p className={`text-2xl font-bold mt-1 ${accent || 'text-gray-800'}`}>{value}</p>
        </div>
        <div className='flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 flex-shrink-0'>
            <img src={icon} alt="" className='h-5 w-5' />
        </div>
    </div>
)

const Dashboard = () => {

    const { axios, isOwner, currency } = useAppContext()

    const [data, setData] = useState({
        totalCars: 0,
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        recentBookings: [],
        monthlyRevenue: 0,
        totalRevenue: 0,
    })
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/owner/dashboard')
            if (data.success) {
                setData(data.dashboardData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOwner) fetchDashboardData()
    }, [isOwner])

    // Build chart data from recentBookings
    const chartData = [
        { name: 'Total', bookings: data.totalBookings,     fill: '#1E3A8A' },
        { name: 'Pending', bookings: data.pendingBookings, fill: '#F59E0B' },
        { name: 'Confirmed', bookings: data.completedBookings, fill: '#10B981' },
    ]

    const dashboardCards = [
        { title: "Total Cars",      value: data.totalCars,         icon: assets.carIconColored  },
        { title: "Total Bookings",  value: data.totalBookings,     icon: assets.listIconColored },
        { title: "Pending",         value: data.pendingBookings,   icon: assets.cautionIconColored, accent: 'text-amber-600' },
        { title: "Confirmed",       value: data.completedBookings, icon: assets.listIconColored,    accent: 'text-green-600' },
    ]

    if (loading) return (
        <div className='px-4 pt-10 md:px-10 flex-1 space-y-6'>
            <div className='skeleton h-16 w-64 rounded-xl' />
            <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-5'>
                {[...Array(4)].map((_, i) => <div key={i} className='skeleton h-24 rounded-xl' />)}
            </div>
            <div className='skeleton h-64 rounded-xl' />
        </div>
    )

    return (
        <div className='px-4 pt-10 md:px-10 flex-1 pb-10'>

            <Title
                title="Owner Dashboard"
                subTitle="Monitor your fleet performance — cars, bookings, revenue, and recent activity"
            />

            {/* Stat Cards */}
            <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-5 my-8'>
                {dashboardCards.map((card, index) => (
                    <StatCard key={index} {...card} />
                ))}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

                {/* Booking Overview Chart */}
                <div className='lg:col-span-2 p-5 border border-borderColor rounded-xl bg-white shadow-sm'>
                    <h2 className='text-base font-semibold text-gray-800 mb-1'>Booking Overview</h2>
                    <p className='text-xs text-gray-500 mb-5'>Summary of all booking statuses</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue Panel */}
                <div className='flex flex-col gap-4'>
                    <div className='p-5 border border-borderColor rounded-xl bg-white shadow-sm'>
                        <p className='text-xs text-gray-500 font-medium uppercase tracking-wide'>Monthly Revenue</p>
                        <p className='text-3xl font-bold text-primary mt-2'>
                            {currency}{(data.monthlyRevenue || 0).toLocaleString()}
                        </p>
                        <p className='text-xs text-gray-400 mt-1'>From confirmed bookings this month</p>
                    </div>
                    <div className='p-5 border border-borderColor rounded-xl bg-white shadow-sm'>
                        <p className='text-xs text-gray-500 font-medium uppercase tracking-wide'>Total Revenue</p>
                        <p className='text-3xl font-bold text-green-600 mt-2'>
                            {currency}{(data.totalRevenue || 0).toLocaleString()}
                        </p>
                        <p className='text-xs text-gray-400 mt-1'>All-time confirmed earnings</p>
                    </div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className='mt-6 p-5 border border-borderColor rounded-xl bg-white shadow-sm'>
                <h2 className='text-base font-semibold text-gray-800 mb-1'>Recent Bookings</h2>
                <p className='text-xs text-gray-500 mb-5'>Latest 5 customer bookings</p>

                {data.recentBookings.length === 0 ? (
                    <p className='text-center text-gray-400 py-8'>No bookings yet</p>
                ) : (
                    <div className='space-y-3'>
                        {data.recentBookings.map((booking, index) => (
                            <div key={index} className='flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors'>
                                <div className='flex items-center gap-3'>
                                    <img src={booking.car?.image} alt="" className='h-10 w-16 rounded-md object-cover flex-shrink-0' />
                                    <div>
                                        <p className='font-medium text-sm'>{booking.car?.brand} {booking.car?.model}</p>
                                        <p className='text-xs text-gray-400'>{booking.createdAt?.split('T')[0]}</p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-3 text-right'>
                                    <p className='font-semibold text-primary text-sm'>{currency}{booking.price}</p>
                                    <StatusBadge status={booking.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}

export default Dashboard