/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AppProvider, useApp } from './services/store';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { InteractiveMap } from './components/InteractiveMap';
import { RoutesScreen } from './components/RoutesScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { EmergencyModal } from './components/EmergencyModal';
import { UserModal } from './components/UserModal';
import { MerchantHub } from './components/MerchantHub';
import { AdminPanel } from './components/AdminPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GeminiChatModal } from './components/GeminiChatModal';
import { GuidesScreen } from './components/GuidesScreen';
import { GmailContactModal } from './components/GmailContactModal';
import { LegalModal } from './components/LegalModal';
import { Place, TouristRoute } from './types';

function MainLayout() {
  const { selectedPlace, setSelectedPlace, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy'>('terms');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'normal' | 'merchant' | 'admin'>('normal');

  const handleOpenLegal = (tab: 'terms' | 'privacy' = 'terms') => {
    setLegalTab(tab);
    setIsLegalOpen(true);
  };

  const handleOpenChat = (prompt?: string) => {
    setChatInitialPrompt(prompt);
    setIsChatOpen(true);
  };

  // Place detail modal
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);

  // Tab titles
  const getTabTitle = () => {
    if (viewMode === 'admin') return 'Painel Admin';
    if (viewMode === 'merchant') return 'Área do Comerciante';
    switch (activeTab) {
      case 'inicio':
        return 'Início';
      case 'mapa':
        return 'Mapa Interativo';
      case 'roteiros':
        return 'Roteiros';
      case 'guias':
        return 'Guias de Turismo';
      case 'favoritos':
        return 'Favoritos';
      case 'painel':
        return currentUser ? 'Minha Conta' : 'Área Comercial';
      default:
        return 'Conservatória';
    }
  };

  const handleStartRoute = (route: TouristRoute, initialPlace?: Place) => {
    if (initialPlace) {
      setSelectedPlace(initialPlace);
    }
    setActiveTab('mapa');
  };

  const handleStartNavigationToPlace = (place: Place) => {
    setSelectedPlace(place);
    setDetailPlace(null);
    setActiveTab('mapa');
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-900 flex flex-col font-sans selection:bg-[#0d3822] selection:text-white">
      {/* Offline Status Warning */}
      <OfflineIndicator />

      {/* Main App Header matching design */}
      <Header
        title={getTabTitle()}
        subtitle="CONSERVATÓRIA, RJ"
        showBack={viewMode !== 'normal'}
        onBack={() => setViewMode('normal')}
        onOpenSearch={() => setActiveTab('mapa')}
        onOpenProfile={() => setIsUserModalOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenChat={() => handleOpenChat()}
        onOpenGmailContact={() => setIsGmailModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        {viewMode === 'admin' ? (
          <AdminPanel
            onBackToApp={() => setViewMode('normal')}
            onOpenDetails={(place) => setDetailPlace(place)}
          />
        ) : viewMode === 'merchant' ? (
          <MerchantHub
            onBackToHome={() => setViewMode('normal')}
            onOpenDetails={(place) => setDetailPlace(place)}
          />
        ) : (
          <>
            {activeTab === 'inicio' && (
              <HomeScreen
                onSelectPlace={(place) => {
                  setSelectedPlace(place);
                  setActiveTab('mapa');
                }}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenMerchant={() => setViewMode('merchant')}
                onOpenDetails={(place) => setDetailPlace(place)}
                onSelectRoute={(route) => handleStartRoute(route)}
                onOpenEmergency={() => setIsEmergencyOpen(true)}
                onOpenChat={handleOpenChat}
                onOpenGmailContact={() => setIsGmailModalOpen(true)}
                onOpenLegal={handleOpenLegal}
              />
            )}

            {activeTab === 'mapa' && (
              <InteractiveMap
                onOpenDetails={(place) => setDetailPlace(place)}
                onOpenSearch={() => {}}
              />
            )}

            {activeTab === 'roteiros' && (
              <RoutesScreen
                onStartRoute={handleStartRoute}
                onOpenDetails={(place) => setDetailPlace(place)}
                onNavigateToGuides={() => setActiveTab('guias')}
              />
            )}

            {activeTab === 'guias' && (
              <GuidesScreen
                onOpenChatWithPrompt={handleOpenChat}
              />
            )}

            {activeTab === 'favoritos' && (
              <FavoritesScreen
                onSelectPlace={(place) => {
                  setSelectedPlace(place);
                  setActiveTab('mapa');
                }}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenDetails={(place) => setDetailPlace(place)}
              />
            )}

            {activeTab === 'painel' && (
              <MerchantHub
                onBackToHome={() => setActiveTab('inicio')}
                onOpenDetails={(place) => setDetailPlace(place)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      {viewMode === 'normal' && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          onOpenEmergency={() => setIsEmergencyOpen(true)}
        />
      )}

      {/* Place Detail Modal */}
      {detailPlace && (
        <PlaceDetailModal
          place={detailPlace}
          onClose={() => setDetailPlace(null)}
          onStartRoute={handleStartNavigationToPlace}
        />
      )}

      {/* 🚨 Central de Emergência Modal (190, 180, 192, 193) */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* User Login & Role Selection Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onOpenAdmin={() => setViewMode('admin')}
        onOpenMerchant={() => setViewMode('merchant')}
        onOpenLegal={handleOpenLegal}
      />

      {/* Floating AI Guide Button */}
      {viewMode === 'normal' && (
        <button
          onClick={() => handleOpenChat()}
          className="fixed bottom-20 right-4 z-40 bg-[#0d3822] hover:bg-[#124b2e] text-amber-300 p-3.5 rounded-full shadow-xl border border-amber-400/40 flex items-center gap-2 transition active:scale-95 group cursor-pointer"
          title="Guia Seresteiro com Inteligência Artificial"
        >
          <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
          <span className="text-xs font-bold text-white pr-1 hidden sm:inline">
            Guia IA
          </span>
        </button>
      )}

      {/* Gemini Chatbot Modal */}
      <GeminiChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialPrompt(undefined);
        }}
        initialPrompt={chatInitialPrompt}
      />

      {/* Gmail Contact & Suggestions Modal */}
      <GmailContactModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
      />

      {/* Terms of Use & Privacy Policy Modal */}
      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
