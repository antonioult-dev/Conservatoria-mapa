import React, { useState } from 'react';
import {
  Users,
  Award,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  X,
  UserPlus,
  Send,
  QrCode,
  Copy,
  Check,
  CreditCard,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../services/store';
import { TourGuide, TourSpecialty } from '../types';

interface GuidesScreenProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const GuidesScreen: React.FC<GuidesScreenProps> = ({ onOpenChatWithPrompt }) => {
  const { guides, addGuide, currentUser, loginWithGoogle } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedGuide, setSelectedGuide] = useState<TourGuide | null>(null);

  // Booking Form State inside Guide Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingPeople, setBookingPeople] = useState('2');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSent, setBookingSent] = useState(false);

  // Guide registration and subscription status
  const [isRegisterGuideOpen, setIsRegisterGuideOpen] = useState(false);
  const [regStep, setRegStep] = useState<'form' | 'payment'>('form');
  const [regName, setRegName] = useState('');
  const [regCadastur, setRegCadastur] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSpecialty, setRegSpecialty] = useState<TourSpecialty>('seresta_historica');
  const [regBio, setRegBio] = useState('');
  const [regPrice, setRegPrice] = useState('');
  const [regDuration, setRegDuration] = useState('');
  const [regMeetingPoint, setRegMeetingPoint] = useState('');
  const [regError, setRegError] = useState('');

  const specialties = [
    { id: 'all', label: 'Todos os Guias' },
    { id: 'seresta_historica', label: '🎻 Serestas & História' },
    { id: 'ecoturismo_trilhas', label: '🌿 Ecoturismo & Cachoeiras' },
    { id: 'fazendas_cafe', label: '☕ Fazendas do Café' },
    { id: 'roteiro_fotografico', label: '📸 Noturno & Serenata' },
  ];

  // Filtering
  const filteredGuides = guides.filter((g) => {
    const matchesQuery =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.specialtyLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.itineraryHighlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpecialty = selectedSpecialty === 'all' || g.specialty === selectedSpecialty;

    return matchesQuery && matchesSpecialty;
  });

  const handleOpenWhatsApp = (guide: TourGuide, customMsg?: string) => {
    const cleanNumber = guide.whatsapp.replace(/\D/g, '');
    const text =
      customMsg ||
      `Olá ${guide.name}! Encontrei seu perfil no app Conservatória Turismo e gostaria de informações para agendar uma visita guiada com você.`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuide) return;

    const totalEst = selectedGuide.pricePerPerson * parseInt(bookingPeople || '1');
    const msg = `Olá ${selectedGuide.name}! Gostaria de agendar uma visita guiada em Conservatória:
- Nome: ${bookingName}
- Data pretendida: ${bookingDate || 'A combinar'}
- Pessoas: ${bookingPeople}
- Roteiro: ${selectedGuide.specialtyLabel}
- Valor estimado: R$ ${totalEst},00
${bookingNotes ? `- Observações: ${bookingNotes}` : ''}

Você tem disponibilidade para esse dia?`;

    setBookingSent(true);
    setTimeout(() => {
      handleOpenWhatsApp(selectedGuide, msg);
      setBookingSent(false);
      setIsBookingModalOpen(false);
    }, 1200);
  };

  // Submit an authenticated guide profile and leave it pending until a real gateway is configured.
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regCadastur.trim() || !regBio.trim() || !Number.isFinite(Number(regPrice)) || Number(regPrice) <= 0) {
      setRegError('Informe nome, CADASTUR, apresentação e um preço válido para o passeio.');
      return;
    }
    setRegError('');

    const specialtyLabels: Record<TourSpecialty, string> = {
      seresta_historica: 'Serestas & Centro Histórico',
      ecoturismo_trilhas: 'Ecoturismo, Túnel & Cachoeiras',
      fazendas_cafe: 'Fazendas Coloniais & Vale do Café',
      roteiro_fotografico: 'Tour Musical & Serenata Noturna',
      gastronomia_cultural: 'Cultura & Gastronomia Típica',
    };

    if (!currentUser) {
      const authResult = await loginWithGoogle('COMERCIANTE');
      if (!authResult.success) { setRegError(authResult.error || 'Entre com Google para enviar seu cadastro.'); return; }
    }

    try { await addGuide({
      name: regName,
      cadastur: regCadastur,
      photoUrl: '',
      specialty: regSpecialty,
      specialtyLabel: specialtyLabels[regSpecialty],
      bio: regBio.trim(),
      experienceYears: 0,
      languages: [],
      phone: regPhone,
      whatsapp: regWhatsapp || regPhone,
      email: regEmail,
      pricePerPerson: Number(regPrice),
      duration: regDuration.trim(),
      includedItems: [],
      itineraryHighlights: [],
      meetingPoint: regMeetingPoint.trim(),
      availability: '',
      status: 'PENDING_PAYMENT',
      monthlySubscriptionPrice: 49.9,
    }); } catch (error) { setRegError(error instanceof Error ? error.message : 'Não foi possível salvar o cadastro.'); return; }

    setRegStep('payment');
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
      
      {/* 1. Header Banner with CADASTUR credentials */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0d3822] via-[#124b2e] to-[#0a2818] text-white shadow-lg border border-[#185c37] relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Perfis de guias</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif-header leading-tight">
            Contrate um Guia em Conservatória
          </h2>

          <p className="text-xs text-stone-200 leading-relaxed">
            Consulte perfis publicados e confirme credenciais, serviços, preço e disponibilidade diretamente com cada profissional.
          </p>

          <div className="pt-1 flex items-center justify-between gap-2 border-t border-white/10 text-[11px] text-stone-300">
            <span>✓ Atendimento direto sem intermediários</span>
            <button
              onClick={() => setIsRegisterGuideOpen(true)}
              className="font-bold text-amber-300 hover:underline flex items-center gap-1 text-[11px]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sou Guia</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white shadow-xs border border-stone-200">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por guia, atração ou roteiro..."
            className="w-full bg-transparent text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-stone-400 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Specialty Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {specialties.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition active:scale-95 text-xs ${
                selectedSpecialty === spec.id
                  ? 'bg-[#0d3822] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {spec.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Guides List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs text-stone-500 px-1 font-semibold">
          <span>{filteredGuides.length} guias disponíveis</span>
          <span className="text-[11px] text-emerald-800">Preços diretos</span>
        </div>

        {filteredGuides.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white text-center space-y-2 border border-stone-200">
            <Users className="w-8 h-8 text-stone-300 mx-auto" />
            <div className="text-sm font-bold text-stone-700">Nenhum guia encontrado</div>
            <p className="text-xs text-stone-500">Tente buscar com outros termos ou limpar os filtros.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('all');
              }}
              className="text-xs font-bold text-[#0d3822] underline pt-1"
            >
              Ver todos os guias
            </button>
          </div>
        ) : (
          filteredGuides.map((guide) => (
            <div
              key={guide.id}
              className="p-4 rounded-3xl bg-white border border-stone-200 shadow-sm hover:border-[#0d3822]/40 transition space-y-3"
            >
              {/* Top: Guide Photo, Name, Badge, Rating */}
              <div className="flex items-start gap-3.5">
                {guide.photoUrl ? (
                  <img src={guide.photoUrl} alt={guide.name} className="w-16 h-16 rounded-2xl object-cover shadow-xs border border-stone-200 flex-shrink-0" />
                ) : (
                  <div aria-label="Foto não cadastrada" className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-xl font-bold text-stone-500 flex-shrink-0">{guide.name.slice(0, 1).toUpperCase()}</div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-stone-900 truncate">{guide.name}</h3>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-amber-900 text-[11px] font-black flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{guide.rating.toFixed(1)}</span>
                      <span className="text-[9px] text-stone-400 font-normal">({guide.reviewsCount})</span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-[#0d3822] mt-0.5">
                    {guide.specialtyLabel}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded-md text-stone-600">
                      <Award className="w-2.5 h-2.5 text-emerald-700" />
                      CADASTUR informado
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      Perfil publicado • assinatura de R$ 49,90/mês
                    </span>
                    <span className="text-[11px] text-stone-400">• {guide.experienceYears > 0 ? `${guide.experienceYears} anos de experiência` : 'experiência não informada'}</span>
                  </div>
                </div>
              </div>

              {/* Bio summary */}
              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                {guide.bio}
              </p>

              {/* Highlights Chips */}
              <div className="flex flex-wrap gap-1">
                {guide.itineraryHighlights.slice(0, 3).map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md"
                  >
                    📍 {item}
                  </span>
                ))}
              </div>

              {/* Price, Duration and Action Buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-stone-400 uppercase font-bold">Investimento</div>
                  <div className="text-sm font-black text-stone-900">
                    R$ {guide.pricePerPerson.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <span className="text-[10px] font-normal text-stone-500">/ pessoa{guide.duration ? ` (${guide.duration})` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedGuide(guide)}
                    className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition active:scale-95"
                  >
                    Detalhes
                  </button>

                  <button
                    onClick={() => {
                      setSelectedGuide(guide);
                      setIsBookingModalOpen(true);
                    }}
                    className="py-2 px-3.5 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Contratar</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Guide Detail Modal */}
      {selectedGuide && !isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto border border-stone-200 p-5 space-y-4">
            
            {/* Header / Close */}
            <div className="flex items-start justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-3">
                {selectedGuide.photoUrl ? (
                  <img src={selectedGuide.photoUrl} alt={selectedGuide.name} className="w-14 h-14 rounded-2xl object-cover border border-stone-200" />
                ) : (
                  <div aria-label="Foto não cadastrada" className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-lg font-bold text-stone-500">{selectedGuide.name.slice(0, 1).toUpperCase()}</div>
                )}
                <div>
                  <h3 className="text-base font-bold text-stone-900">{selectedGuide.name}</h3>
                  <div className="text-xs text-[#0d3822] font-semibold">{selectedGuide.specialtyLabel}</div>
                  <div className="text-[10px] text-stone-400 font-mono">CADASTUR informado: {selectedGuide.cadastur}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedGuide(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rating and Badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-900 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{selectedGuide.rating.toFixed(1)} estrelas ({selectedGuide.reviewsCount} avaliações)</span>
              </div>
              <div className="bg-stone-100 px-2.5 py-1 rounded-xl text-stone-700 font-semibold">
                ⏱ Duração: {selectedGuide.duration || 'a combinar'}
              </div>
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-xl font-semibold">
                🗣 Idiomas: {selectedGuide.languages.length ? selectedGuide.languages.join(', ') : 'a confirmar'}
              </div>
            </div>

            {/* Bio */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">
                Sobre o Guia
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {selectedGuide.bio}
              </p>
            </div>

            {/* What's included */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1.5">
                O que está incluído no passeio:
              </h4>
              <div className="space-y-1.5">
                {selectedGuide.includedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
                {!selectedGuide.includedItems.length && <p className="text-xs text-stone-500">Consulte o guia para confirmar o que está incluído.</p>}
              </div>
            </div>

            {/* Itinerary Highlights */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1.5">
                Roteiro e Principais Paradas:
              </h4>
              <div className="space-y-1">
                {selectedGuide.itineraryHighlights.map((stop, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0d3822] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{stop}</span>
                  </div>
                ))}
                {!selectedGuide.itineraryHighlights.length && <p className="text-xs text-stone-500">O roteiro será combinado diretamente com o guia.</p>}
              </div>
            </div>

            {/* Meeting Point & Availability */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div>
                <span className="font-bold">📍 Ponto de encontro:</span> {selectedGuide.meetingPoint || 'A combinar diretamente com o guia.'}
              </div>
              <div>
                <span className="font-bold">🗓 Disponibilidade:</span> {selectedGuide.availability || 'Consulte o guia.'}
              </div>
            </div>

            {/* Price and CTA Buttons */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-stone-400 uppercase font-bold">Valor</div>
                <div className="text-base font-black text-stone-900">
                  R$ {selectedGuide.pricePerPerson.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] text-stone-500 font-normal">/ pessoa</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedGuide.phone.replace(/\D/g, '')}`}
                  className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                  title="Ligar para o guia"
                >
                  <Phone className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="py-3 px-5 rounded-2xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-300" />
                  <span>Solicitar Reserva</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. Direct Booking / WhatsApp Request Modal */}
      {selectedGuide && isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 border border-stone-200 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0d3822] text-amber-300 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Agendar Visita Guiada</h3>
                  <p className="text-[11px] text-stone-500">com {selectedGuide.name}</p>
                </div>
              </div>

              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silveira"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Data Pretendida
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nº de Pessoas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={bookingPeople}
                    onChange={(e) => setBookingPeople(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Observações ou preferências
                </label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Ex: viajamos com idosos, preferimos caminhada em ritmo calmo."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span>Preço por pessoa:</span>
                  <span className="font-bold">R$ {selectedGuide.pricePerPerson},00</span>
                </div>
                <div className="flex items-center justify-between text-sm font-black text-stone-900 pt-1 border-t border-stone-200">
                  <span>Total estimado:</span>
                  <span className="text-[#0d3822]">
                    R$ {selectedGuide.pricePerPerson * parseInt(bookingPeople || '1')},00
                  </span>
                </div>
              </div>

              {bookingSent ? (
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
                  ✓ Abrindo WhatsApp do guia com os detalhes...
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-300" />
                  <span>Enviar Solicitação no WhatsApp</span>
                </button>
              )}
            </form>

          </div>
        </div>
      )}

      {/* 6. Guide Registration Modal (Para Guias Locais se cadastrarem) */}
      {isRegisterGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-2xl p-5 border border-stone-200 overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0d3822] text-amber-300 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Cadastro de Guia de Turismo</h3>
                  <p className="text-[11px] text-stone-500">Conservatória — Valença, RJ</p>
                </div>
              </div>

              <button
                onClick={() => setIsRegisterGuideOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Steps */}
            {regStep === 'form' && (
              <form onSubmit={handleProceedToPayment} className="space-y-3">
                {regError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">{regError}</p>}
                {/* Subscription Notice */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      Assinatura Profissional: R$ 49,90 / mês
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                      Sem pagamento integrado
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    O preço comercial é R$ 49,90 por mês. O app ainda não processa pagamentos por passeios nem a assinatura; valores e condições de cada serviço devem ser confirmados diretamente com o profissional.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: João Batista Guia"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nº CADASTUR *
                    </label>
                    <input
                      type="text"
                      required
                      value={regCadastur}
                      onChange={(e) => setRegCadastur(e.target.value)}
                      placeholder="19.000.000/0001-00"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Especialidade *
                    </label>
                    <select
                      value={regSpecialty}
                      onChange={(e) => setRegSpecialty(e.target.value as TourSpecialty)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822] bg-white font-medium"
                    >
                      <option value="seresta_historica">🎻 Serestas & Centro Histórico</option>
                      <option value="ecoturismo_trilhas">🌿 Ecoturismo & Cachoeiras</option>
                      <option value="fazendas_cafe">☕ Fazendas do Café</option>
                      <option value="roteiro_fotografico">📸 Tour Noturno & Serenata</option>
                      <option value="gastronomia_cultural">🍴 Gastronomia Cultural</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      WhatsApp para Reservas *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regWhatsapp}
                      onChange={(e) => setRegWhatsapp(e.target.value)}
                      placeholder="(DD) 00000-0000"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Preço do Tour por Pessoa (R$) *
                    </label>
                    <input
                      type="number"
                      required
                      value={regPrice}
                      onChange={(e) => setRegPrice(e.target.value)}
                      placeholder="50"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Telefone de Contato
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="(DD) 00000-0000"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      E-mail Profissional
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="guia@email.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Apresentação / Minibiografia *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    placeholder="Conte um pouco da sua trajetória como guia em Conservatória e quais roteiros você realiza..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Ponto de Encontro Padrão
                  </label>
                  <input
                    type="text"
                    value={regMeetingPoint}
                    onChange={(e) => setRegMeetingPoint(e.target.value)}
                    placeholder="Ex: Em frente à Igreja Matriz de Santo Antônio"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Enviar cadastro • Assinatura R$ 49,90/mês</span>
                  <ChevronRight className="w-4 h-4 text-amber-300" />
                </button>
              </form>
            )}

            {/* Step 2: Payment setup */}
            {regStep === 'payment' && (
              <div className="space-y-4 animate-in fade-in">
                {regError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">{regError}</p>}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                  <strong className="block">Assinatura mensal: R$ 49,90</strong>
                  O pagamento ainda não pode ser concluído: falta configurar um provedor real e sua confirmação segura no servidor. Nenhum PIX ou cobrança foi gerado.
                </div>
                <button type="button" onClick={() => setRegStep('form')} className="w-full text-center text-xs text-stone-500 hover:text-stone-800 font-medium py-1">
                  ← Voltar e editar dados do guia
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
