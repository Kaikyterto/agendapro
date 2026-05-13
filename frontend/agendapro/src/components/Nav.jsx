import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";

const Nav = ({ logo, showCart, cartCount = 0, onCartClick }) => {
  const navigate = useNavigate();

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-[#07090d] border-b border-white/10">
      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-lg hover:bg-white/10 transition"
      >
        <ArrowLeft size={20} className="text-white" />
      </button>

      {/* LOGO */}
      <div className="flex items-center justify-center">
        {logo ? (
          <img src={logo} alt="logo" className="h-8 object-contain" />
        ) : (
          <span className="text-white font-bold text-lg">AgendApp</span>
        )}
      </div>

      {/* CART (CONTROLADO PELA PAGE) */}
      <div className="w-10 flex justify-end">
        {showCart && (
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-lg hover:bg-white/10 transition"
          >
            <ShoppingCart size={20} className="text-white" />

            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] flex items-center justify-center bg-red-500 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default Nav;
