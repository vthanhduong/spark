import { Outlet } from 'react-router-dom'

export const MainLayout = () => {
  return (
    <div>
        <header className="backdrop-blur-xs w-full text-white top-0 z-50 from-blue-200 to-orange-200 bg-gradient-to-r">
        </header>
        <div className='mx-auto h-screen border-gray-400 max-w-7xl bg-white'>
            <Outlet />
        </div>
    </div>
  )
}