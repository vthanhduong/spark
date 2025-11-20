import { Outlet } from 'react-router-dom'

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-800 text-slate-100">
        <div className='h-screen max-w-full w-full'>
            <Outlet />
        </div>
    </div>
  )
}