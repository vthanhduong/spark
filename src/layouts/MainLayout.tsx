import { Outlet } from 'react-router-dom'

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-800 text-slate-100">
        <div className='mx-auto h-screen max-w-6xl w-full px-4 sm:px-6 lg:px-8'>
            <Outlet />
        </div>
    </div>
  )
}