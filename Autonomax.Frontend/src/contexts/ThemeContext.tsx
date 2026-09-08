import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeColor = 'emerald' | 'blue' | 'violet' | 'cyan' | 'pink' | 'cream';

export interface TemaConfig {
  id: ThemeColor;
  nome: string;
  corHex: string;
  classeBg: string;
}

export const TEMAS: TemaConfig[] = [
  { id: 'emerald', nome: 'Esmeralda', corHex: '#10b981', classeBg: 'bg-emerald-500' },
  { id: 'blue', nome: 'Azul', corHex: '#3b82f6', classeBg: 'bg-blue-500' },
  { id: 'violet', nome: 'Violeta', corHex: '#8b5cf6', classeBg: 'bg-violet-500' },
  { id: 'cyan', nome: 'Ciano', corHex: '#06b6d4', classeBg: 'bg-cyan-500' },
  { id: 'pink', nome: 'Rosa Pink', corHex: '#ec4899', classeBg: 'bg-pink-500' },
  { id: 'cream', nome: 'Creme', corHex: '#fef08a', classeBg: 'bg-yellow-200' },
];

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
  temas: TemaConfig[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'emerald',
  setTheme: () => {},
  temas: TEMAS,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    const salvo = localStorage.getItem('@Autonomax:theme') as ThemeColor;
    if (salvo && TEMAS.some(t => t.id === salvo)) {
      return salvo;
    }
    return 'emerald';
  });

  const setTheme = (novoTema: ThemeColor) => {
    setThemeState(novoTema);
    localStorage.setItem('@Autonomax:theme', novoTema);
    document.documentElement.setAttribute('data-theme', novoTema);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, temas: TEMAS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
