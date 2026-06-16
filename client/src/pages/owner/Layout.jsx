import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/owner/Sidebar'
import NavbarOwner from '../../components/owner/NavbarOwner'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {

    // ✅ Get auth info from context
    const { user, token, isOwner, navigate, setShowLogin } = useAppContext()

    // ✅ Protect route
    useEffect(() => {
        if (!token) {
            setShowLogin(true)
            navigate('/')
        } else if (user && !isOwner) {
            navigate('/')
        }
    }, [user, token, isOwner, navigate, setShowLogin])

    if (token && !user) {
        return <div className='flex items-center justify-center h-screen bg-light'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
        </div>
    }

    return (
        <div className='flex h-screen overflow-hidden'>

            <Sidebar />

            <div className='flex-1 flex flex-col overflow-hidden'>
                <NavbarOwner />

                <div className='flex-1 overflow-y-auto bg-light'>
                    <Outlet />
                </div>
            </div>

        </div>
    )
}

export default Layout