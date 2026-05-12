import React from 'react'
import { Link } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react'
import { assets } from '../assets/assets'

const PaymentSuccess = () => {
    return (
        <div className='flex flex-col items-center justify-center min-h-[70vh] px-6 text-center'>
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className='bg-green-100 p-6 rounded-full mb-6'
            >
                <img src={assets.tick_icon} alt="Success" className='w-12 h-12' />
            </motion.div>
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>Payment Successful!</h1>
            <p className='text-gray-500 mb-8 max-w-md'>
                Your booking has been confirmed and payment was received. You can now view your booking details in your dashboard.
            </p>
            <div className='flex gap-4'>
                <Link to='/my-bookings' className='px-8 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:bg-primary-dull transition-all'>
                    View My Bookings
                </Link>
                <Link to='/' className='px-8 py-3 border border-borderColor text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all'>
                    Go Home
                </Link>
            </div>
        </div>
    )
}

export default PaymentSuccess
