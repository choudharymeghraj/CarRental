/**
 * AppContext — Auth & global UI state ONLY.
 * Data fetching (cars, bookings, dashboard) lives in TanStack Query hooks.
 */
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY || '$';

    const [token,     setToken]     = useState(() => localStorage.getItem('token'));
    const [user,      setUser]      = useState(null);
    const [isOwner,   setIsOwner]   = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    // ── Configure axios ──────────────────────────────────────────────────────
    useEffect(() => {
        axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
    }, []);

    // ── Fetch user profile ──────────────────────────────────────────────────
    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user/data');
            if (data.success) {
                setUser(data.user);
                setIsOwner(data.user.role === 'owner');
            } else {
                // Token invalid/expired
                logout();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // ── Logout ──────────────────────────────────────────────────────────────
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsOwner(false);
        delete axios.defaults.headers.common['Authorization'];
        toast.success('Logged out successfully');
        navigate('/');
    };

    // ── Sync axios Authorization header when token changes ──────────────────
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = token;
            fetchUser();
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const value = {
        navigate,
        currency,
        axios,

        user,
        setUser,
        token,
        setToken,
        isOwner,
        setIsOwner,

        showLogin,
        setShowLogin,

        fetchUser,
        logout,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// Custom hook
export const useAppContext = () => useContext(AppContext);