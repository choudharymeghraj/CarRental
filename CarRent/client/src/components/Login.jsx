import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { assets } from '../assets/assets'

const Login = () => {

    const { setShowLogin, axios, setToken } = useAppContext()
    const navigate = useNavigate()

    const [state, setState] = useState("login")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // ✅ Submit Handler
    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {
            const { data } = await axios.post(`/api/user/${state}`, {
                name,
                email,
                password
            })

            if (data.success) {
                setToken(data.token)
                localStorage.setItem('token', data.token)
                setShowLogin(false)
                toast.success('Login successfully')
                navigate('/')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div
            onClick={() => setShowLogin(false)}
            className="fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center justify-center bg-black/50 text-sm text-gray-600"
        >

            {/* FORM */}
            <form
                onSubmit={onSubmitHandler}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px]
                rounded-lg shadow-xl border border-gray-200 bg-white"
            >

                {/* CLOSE BUTTON */}
                <button
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="absolute top-4 right-4"
                >
                    <img src={assets.close_icon} alt="close" className="w-4 h-4" />
                </button>

                {/* TITLE */}
                <p className="text-2xl font-medium m-auto">
                    <span className="text-primary">User</span> {state === "login" ? "Login" : "Sign Up"}
                </p>

                {/* NAME (ONLY SIGNUP) */}
                {state === "register" && (
                    <div className="w-full">
                        <label>Name</label>
                        <input
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            type="text"
                            required
                            className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                        />
                    </div>
                )}

                {/* EMAIL */}
                <div className="w-full">
                    <label>Email</label>
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        type="email"
                        required
                        className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                    />
                </div>

                {/* PASSWORD */}
                <div className="w-full">
                    <label>Password</label>
                    <input
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        type="password"
                        required
                        className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                    />
                </div>

                {/* SWITCH LOGIN / SIGNUP */}
                <p>
                    {state === "login" ? "Create an account?" : "Already have an account?"}
                    <span
                        onClick={() => setState(state === "login" ? "register" : "login")}
                        className="text-primary cursor-pointer ml-1"
                    >
                        {state === "login" ? "Click here" : "Login"}
                    </span>
                </p>

                {/* BUTTON */}
                <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer"
                >
                    {state === "login" ? "Login" : "Sign Up"}
                </button>
            </form>
        </div>
    )
}

export default Login