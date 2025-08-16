import React from 'react'
import { menuItemsData } from '../assets/assets'
import { NavLink } from 'react-router-dom'

const MenuItems = ({setSidebarOpen}) => {
  return (
    <div className='px-6 text-gray-700 space-y-2 font-medium'>
      {
        menuItemsData.map(({to, label, Icon})=>(
            <NavLink key={to} to={to} end={to === '/'} onClick={()=> setSidebarOpen(false)} className={({isActive})=> `px-4 py-3 flex items-center gap-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-green-50 text-green-700 font-semibold shadow-sm border-l-4 border-green-500' : 'hover:bg-gray-50 hover:text-gray-900'}`}>
                <Icon className={`w-5 h-5 ${({isActive}) => isActive ? 'text-green-600' : ''}`}/>
                {label}
            </NavLink>
        ))
      }
    </div>
  )
}

export default MenuItems
