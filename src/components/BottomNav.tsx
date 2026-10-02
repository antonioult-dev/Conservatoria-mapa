import React from 'react';
import { Compass, Map, Route as RouteIcon, Heart, LayoutGrid, ShieldAlert, Users } from 'lucide-react';
import { useApp } from '../services/store';

export type TabType = 'inicio' | 'mapa' | 'roteiros' | 'guias' | 'favoritos' | 'painel';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenEmergency: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenEmergency,
}) => {
  const { favorites } = useApp();

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'inicio', label: 'Início', icon: Compass },
    { id: 'mapa', label: 'Mapa', icon: Map },
    { id: 'roteiros', label: 'Roteiros', icon: RouteIcon },
    { id: 'guias', label: 'Guias', icon: Users },
    { id: 'favoritos', label: 'Salvos', icon: Heart },
    { id: 'painel', label: 'Conta', icon: LayoutGrid },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#f7f5f0]/95 backdrop-blur-md border-t border-stone-200/80 px-1 py-1.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-transform active:scale-90 relative ${
                isActive ? 'text-[#0d3822] font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4.5 h-4.5 transition-colors ${
                    isActive ? 'text-[#0d3822] stroke-[2.4]' : 'text-stone-500 stroke-[1.8]'
                  }`}
                />
                {tab.id === 'favoritos' && favorites.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#0d3822] text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-[#0d3822] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Dedicated Emergency Quick Trigger */}
        <button
          onClick={onOpenEmergency}
          aria-label="Central de Emergência 190"
          className="flex flex-col items-center justify-center px-1.5 py-0.5 text-red-600 hover:text-red-700 active:scale-90 transition group"
        >
          <div className="w-4.5 h-4.5 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition">
            <ShieldAlert className="w-3 h-3 text-red-600 animate-pulse" />
          </div>
          <span className="text-[9px] font-black mt-0.5 text-red-600">SOS</span>
        </button>
      </div>
    </nav>
  );
};
