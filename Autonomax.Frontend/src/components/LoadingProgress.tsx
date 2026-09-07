import { useState, useEffect } from 'react';

interface LoadingProgressProps {
  message?: string;
  progress?: number;
  compact?: boolean;
}

export function LoadingProgress({
  message = 'Carregando...',
  progress: explicitProgress,
  compact = false
}: LoadingProgressProps) {
  const [autoProgress, setAutoProgress] = useState(15);

  useEffect(() => {
    if (explicitProgress !== undefined) return;

    // Simulação suave e realista de progresso
    const interval = setInterval(() => {
      setAutoProgress(prev => {
        if (prev >= 96) return 96;
        if (prev < 40) return prev + Math.floor(Math.random() * 8) + 5; // Salto inicial rápido
        if (prev < 75) return prev + Math.floor(Math.random() * 5) + 3; // Ritmo médio
        if (prev < 90) return prev + Math.floor(Math.random() * 3) + 1; // Desaceleração
        return prev + 1;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [explicitProgress]);

  const currentProgress = Math.min(
    100,
    Math.max(0, explicitProgress !== undefined ? explicitProgress : autoProgress)
  );

  if (compact) {
    return (
      <div className="bg-gray-900/90 border border-gray-800/80 rounded-xl p-6 flex flex-col items-center justify-center space-y-3 shadow-inner my-2">
        <div className="flex items-center justify-between w-full max-w-xs text-xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
            {message}
          </span>
          <span className="text-emerald-400 font-black text-xs font-mono">
            {currentProgress}%
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full max-w-xs h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-800 relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300 rounded-full transition-all duration-200 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // Versão completa com Anel Circular e Porcentagem Central
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-5 min-h-[45vh]">
      <div className="relative flex items-center justify-center">
        {/* SVG Circular Ring */}
        <svg className="w-28 h-28 transform -rotate-90">
          {/* Fundo do círculo */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            className="stroke-gray-900"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Barra de progresso animada */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            className="stroke-emerald-500 transition-all duration-200 ease-out"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Indicador de Porcentagem no Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white font-mono tracking-tight">
            {currentProgress}
            <span className="text-xs text-emerald-400 font-bold ml-0.5">%</span>
          </span>
        </div>
      </div>

      {/* Mensagem e Barra Inferior */}
      <div className="text-center space-y-2 max-w-xs">
        <p className="text-xs font-black text-gray-300 uppercase tracking-widest animate-pulse">
          {message}
        </p>
        <div className="w-48 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800 mx-auto">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
