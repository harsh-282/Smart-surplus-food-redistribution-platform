import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Default theme is 'dark' as requested
    const savedTheme = localStorage.getItem('foodshare_theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    // Apply theme to documentElement attribute
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('foodshare_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
