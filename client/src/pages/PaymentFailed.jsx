import React from 'react'
import { Link } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react'
import { assets } from '../assets/assets'

const PaymentFailed = () => {
    return (
        <div className='flex flex-col items-center justify-center min-h-[70vh] px-6 text-center'>
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className='bg-red-100 p-6 rounded-full mb-6'
            >
                <img src={assets.close_icon} alt="Failed" className='w-12 h-12 grayscale' />
            </motion.div>
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>Payment Failed</h1>
            <p className='text-gray-500 mb-8 max-w-md'>
                We couldn't process your payment. Please try again or contact support if the issue persists.
            </p>
            <div className='flex gap-4'>
                <Link to='/my-bookings' className='px-8 py-3 bg-red-500 text-white rounded-xl font-semibold shadow-lg hover:bg-red-600 transition-all'>
                    Try Again
                </Link>
                <Link to='/' className='px-8 py-3 border border-borderColor text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all'>
                    Go Home
                </Link>
            </div>
        </div>
    )
}

export default PaymentFailed
