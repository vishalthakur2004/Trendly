import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    Home, 
    Search, 
    PlusSquare, 
    Heart, 
    User,
    Film
} from 'lucide-react';
import Avatar from './Avatar';

const MobileBottomNav = () => {
    const location = useLocation();
    const currentUser = useSelector((state) => state.user.value);

    const navItems = [
        {
            icon: Home,
            path: '/',
            label: 'Home',
            isActive: location.pathname === '/'
        },
        {
            icon: Search,
            path: '/discover',
            label: 'Search',
            isActive: location.pathname === '/discover'
        },
        {
            icon: PlusSquare,
            path: '/create-post',
            label: 'Create',
            isActive: location.pathname === '/create-post'
        },
        {
            icon: Film,
            path: '/reels',
            label: 'Reels',
            isActive: location.pathname === '/reels'
        },
        {
            icon: Heart,
            path: '/notifications',
            label: 'Activity',
            isActive: location.pathname === '/notifications'
        },
        {
            icon: User,
            path: '/profile',
            label: 'Profile',
            isActive: location.pathname === '/profile' || location.pathname.startsWith('/profile'),
            isProfile: true
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 md:hidden">
            <div className="flex items-center justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors duration-200"
                        >
                            <div className={`flex items-center justify-center w-6 h-6 ${
                                item.isActive ? 'text-black' : 'text-gray-400'
                            }`}>
                                {item.isProfile ? (
                                    <div className={`w-6 h-6 rounded-full ${
                                        item.isActive ? 'ring-2 ring-black ring-offset-1' : ''
                                    }`}>
                                        <Avatar
                                            src={currentUser?.profile_picture}
                                            name={currentUser?.full_name}
                                            size="xs"
                                        />
                                    </div>
                                ) : (
                                    <Icon 
                                        className={`w-6 h-6 ${
                                            item.isActive ? 'fill-black' : ''
                                        }`}
                                        strokeWidth={item.isActive ? 2.5 : 1.5}
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
