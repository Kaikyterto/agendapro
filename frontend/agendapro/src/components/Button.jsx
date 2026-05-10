const Button = ({ children, icon: Icon, className = "", ...props }) => {
  return (
    <button
      className={`px-7 py-4 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 transition hover:scale-105 active:scale-95 ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

export default Button;
