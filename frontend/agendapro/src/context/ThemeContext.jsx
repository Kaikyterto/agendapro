import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);

  const loadTheme = async () => {
    const res = await fetch(
      "http://localhost:5000/public/company/seu-slug-aqui"
    );

    const data = await res.json();

    setTheme(data);

    const primary = data.colors.primary;
    const secondary = data.colors.secondary;

    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--accent", secondary);
  };

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
