import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const { cartCount } = useCart();
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: 'Home', icon: '🏠', end: true },
    { to: '/products', label: 'Shop', icon: '🍫' },
    { to: '/customize', label: 'Custom', icon: '✏️' },
    { to: '/cart', label: 'Cart', icon: '🛒', badge: cartCount },
    { to: user ? '/profile' : '/login', label: user ? 'Account' : 'Login', icon: '👤' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-choco-900/95 backdrop-blur-md border-t border-choco-800 text-cream px-2 py-1.5 shadow-2xl pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 min-w-[56px] min-h-[44px] rounded-xl transition-all ${
                isActive ? 'text-gold-400 font-semibold scale-105' : 'text-choco-300 hover:text-cream opacity-80'
              }`
            }
          >
            <div className="relative text-xl leading-none mb-0.5">
              {item.icon}
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-gold-500 text-choco-900 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;
