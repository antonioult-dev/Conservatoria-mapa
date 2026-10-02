import React, { useEffect, useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Clock, 
  Globe, 
  Instagram, 
  Share2, 
  Heart, 
  Navigation, 
  Volume2, 
  Play, 
  Square, 
  Star, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  MessageCircle,
  ExternalLink,
  Mail
} from 'lucide-react';
import { useApp, calculateDistance, formatDistance, getReviewSummary } from '../services/store';
import { Place } from '../types';
import { toggleSerestaAudio } from '../services/audioService';
import { hasVerifiedCoordinates } from '../utils/location';
import { PlaceImage } from './PlaceImage';
import { getSafeHttpUrl } from '../utils/safeUrl';

interface PlaceDetailModalProps {
  place: Place | null;
  onClose: () => void;
  onStartRoute: (place: Place) => void;
  onRequestLogin?: () => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  onClose,
  onStartRoute,
  onRequestLogin,
}) => {
  const {
    userLocation,
    currentUser,
    isFavorite,
    toggleFavorite,
    reviews,
    addReview,
    addReport,
  } = useApp();

  const [activePhoto, setActivePhoto] = useState<string>(place?.imageUrl || '');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<
    'endereco_errado' | 'negocio_inexistente' | 'informacao_incorreta' | 'conteudo_inadequado' | 'outro'
  >('informacao_incorreta');
  const [reportDetails, setReportDetails] = useState('');
  const [reportContact, setReportContact] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setActivePhoto(place?.imageUrl || '');
  }, [place?.id, place?.imageUrl]);

  if (!place) return null;

  const hasCoordinates = hasVerifiedCoordinates(place);
  const websiteUrl = getSafeHttpUrl(place.website);
  const distance = userLocation && hasCoordinates
    ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
    : null;

  const placeReviews = reviews.filter((r) => r.placeId === place.id && !r.hidden);
  const reviewSummary = getReviewSummary(reviews, place.id);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${place.name} — Conservatória Turismo`,
          text: `Conheça ${place.name} em Conservatória, a Capital da Seresta!`,
          url: window.location.href,
        });
      } catch (err) {
        // User dismissed share
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setToastMessage('Link copiado para a área de transferência!');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleToggleAudio = () => {
    const playing = toggleSerestaAudio((state) => setIsPlayingAudio(state));
    setIsPlayingAudio(playing);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;
    try { await addReview(place.id, userRating, userComment, authorName); }
    catch (error) { setToastMessage(error instanceof Error ? error.message : 'Não foi possível salvar a avaliação.'); return; }
    setReviewSubmitted(true);
    setUserComment('');
    setTimeout(() => {
      setShowReviewForm(false);
      setReviewSubmitted(false);
    }, 2000);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const reasonLabels = {
      endereco_errado: 'Endereço errado',
      negocio_inexistente: 'Negócio inexistente',
      informacao_incorreta: 'Informação incorreta',
      conteudo_inadequado: 'Conteúdo inadequado',
      outro: 'Outro motivo',
    };

    try { await addReport({
      placeId: place.id,
      placeName: place.name,
      reason: reportReason,
      reasonLabel: reasonLabels[reportReason],
      details: reportDetails,
      userContact: reportContact,
    }); } catch (error) { setToastMessage(error instanceof Error ? error.message : 'Não foi possível enviar a denúncia.'); return; }

    setReportSuccess(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSuccess(false);
      setReportDetails('');
    }, 2000);
  };

  const openGoogleMaps = () => {
    if (!hasCoordinates) {
      setToastMessage('Este local ainda não tem coordenadas verificadas.');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    const originParam = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}${originParam}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-stone-200 text-stone-900 relative">
        {/* Sticky Header with Close & Favorite Buttons */}
        <div className="relative h-64 sm:h-72 w-full bg-stone-100">
          <PlaceImage src={activePhoto || place.imageUrl} alt={place.name} className="w-full h-full object-cover" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Floating actions */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <button
              onClick={onClose}
              aria-label="Fechar detalhes"
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                aria-label="Compartilhar"
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => currentUser ? void toggleFavorite(place.id) : onRequestLogin?.()}
                aria-label="Favoritar"
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite(place.id) ? 'fill-red-500 text-red-500' : 'text-white'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Title and Badges overlayed on photo bottom */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {place.verified ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 backdrop-blur-sm text-white">
                  ✓ Cadastro revisado
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 backdrop-blur-sm text-white">
                  ⏳ Localização sob verificação
                </span>
              )}
              {place.patrimonyYear && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-stone-950 uppercase tracking-wider">
                  Patrimônio {place.patrimonyYear}
                </span>
              )}
              {place.priceRange && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white">
                  Faixa: {place.priceRange}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold font-serif-header leading-tight">
              {place.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-200 mt-1">
              <span>{place.categoryLabel || place.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {reviewSummary.rating === null ? 'Sem avaliações' : `${reviewSummary.rating.toFixed(1)} (${reviewSummary.count} avaliações)`}
              </span>
            </div>
          </div>
        </div>

        {/* Gallery thumbnails if available */}
        {place.gallery && place.gallery.length > 1 && (
          <div className="flex gap-2 p-3 bg-stone-50 border-b border-stone-200 overflow-x-auto no-scrollbar">
            {place.gallery.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${place.name} foto ${i + 1}`}
                onClick={() => setActivePhoto(img)}
                className={`w-16 h-14 rounded-xl object-cover cursor-pointer border-2 transition ${
                  activePhoto === img ? 'border-[#0d3822] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        )}

        {/* Toast notification banner */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-50 p-2.5 rounded-2xl bg-stone-900/90 text-white text-xs backdrop-blur-md shadow-xl border border-stone-700 text-center animate-in fade-in">
            {toastMessage}
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-5">
          {/* Quick Distance & Como Chegar CTA */}
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0d3822] text-white flex items-center justify-center flex-shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-950">
                  {distance !== null ? formatDistance(distance) : hasCoordinates ? 'Distância requer GPS.' : 'Localização não verificada.'}
                </div>
                <div className="text-[11px] text-emerald-700">
                  {distance !== null ? 'Distância em linha reta até o ponto' : hasCoordinates ? 'Distância indisponível sem GPS' : 'Coordenadas não verificadas'}
                </div>
              </div>
            </div>

            {hasCoordinates ? (
              <button
                onClick={openGoogleMaps}
                className="px-3.5 py-2.5 rounded-xl bg-[#0d3822] hover:bg-[#124b2e] text-white text-xs font-bold shadow-sm active:scale-95 transition flex items-center gap-1.5 flex-shrink-0"
              >
                <span>COMO CHEGAR</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-600 text-[11px] font-bold">
                Localização não cadastrada.
              </span>
            )}
          </div>

          {!place.verified && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Cadastro em revisão. O app só usa localização quando há coordenadas e uma fonte verificadas.</span>
            </div>
          )}

          {/* Audio Seresta Player */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#b48324] text-white flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-950 truncate">
                  {place.audioNarrationTitle || 'Narrativa Histórica & Seresta'}
                </div>
                <div className="text-[10px] text-amber-800">
                  Sonoridade autêntica com violão de seresta
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleAudio}
              className="px-3 py-1.5 rounded-xl bg-[#b48324] hover:bg-[#9a6f1d] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition flex-shrink-0"
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Ouvir</span>
                </>
              )}
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Sobre o Local
            </h3>
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
              {place.description || 'Informação não cadastrada.'}
            </p>
          </div>

          {/* Location & Schedule Info */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#0d3822] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-800">Endereço: </span>
                <span className="text-stone-600">{place.address || 'Informação não cadastrada.'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#0d3822] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-800">Funcionamento: </span>
                <span className="text-stone-600">{place.hours || 'Informação não cadastrada.'}</span>
              </div>
            </div>
          </div>

          {/* Contact Action Buttons (Only when available) */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {place.whatsapp && (
                <a
                  href={`https://wa.me/55${place.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Encontrei seu estabelecimento no Conservatória Turismo.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}

              {place.phone && (
                <a
                  href={`tel:${place.phone.replace(/\D/g, '')}`}
                  className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Ligar</span>
                </a>
              )}

              {place.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(place.email) && (
                <a
                  href={`mailto:${place.email}`}
                  className="py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>E-mail</span>
                </a>
              )}

              {place.instagram && (
                <a
                  href={`https://instagram.com/${place.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}

              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-200 active:scale-95 transition"
                >
                  <Globe className="w-4 h-4 text-[#0d3822]" />
                  <span>Website</span>
                </a>
              )}
            </div>

            {/* Fallback when no contacts are available */}
            {!place.whatsapp && !place.phone && !(place.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(place.email)) && !place.instagram && !websiteUrl && (
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-500 text-center">
                Contatos: Informação não cadastrada.
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="pt-3 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Avaliações ({placeReviews.length})
                </h3>
              </div>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-xs font-bold text-[#0d3822] hover:underline"
              >
                {showReviewForm ? 'Cancelar' : '+ Avaliar Local'}
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Sua nota:
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Seu nome (opcional):
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Comentário da sua experiência:
                  </label>
                  <textarea
                    rows={2}
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Conte como foi sua visita a este ponto turístico..."
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                {reviewSubmitted ? (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Avaliação enviada com sucesso! Obrigado.</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-xl bg-[#0d3822] text-white text-xs font-bold hover:bg-[#124b2e] transition"
                  >
                    Publicar Avaliação
                  </button>
                )}
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-2">
              {placeReviews.map((rev) => (
                <div key={rev.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800">{rev.userName}</span>
                    <div className="flex items-center text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Denunciar Informação Button */}
          <div className="pt-2 text-center">
            <button
              onClick={() => setShowReportModal(true)}
              className="text-stone-400 hover:text-red-600 text-xs flex items-center justify-center gap-1 mx-auto transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Denunciar informação incorreta</span>
            </button>
          </div>
        </div>

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-stone-900">
                  Denunciar Informação
                </h4>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-500">
                Ajude-nos a manter o Guia de Conservatória sempre atualizado e confiável.
              </p>

              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Motivo da denúncia:
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  >
                    <option value="endereco_errado">Endereço errado</option>
                    <option value="negocio_inexistente">Negócio inexistente</option>
                    <option value="informacao_incorreta">Informação incorreta</option>
                    <option value="conteudo_inadequado">Conteúdo inadequado</option>
                    <option value="outro">Outro motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Detalhes do erro:
                  </label>
                  <textarea
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Descreva o que precisa ser corrigido..."
                    required
                    className="w-full text-xs p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Seu contato (opcional):
                  </label>
                  <input
                    type="text"
                    value={reportContact}
                    onChange={(e) => setReportContact(e.target.value)}
                    placeholder="E-mail ou WhatsApp"
                    className="w-full text-xs p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0d3822]"
                  />
                </div>

                {reportSuccess ? (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
                    Denúncia enviada aos administradores!
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition"
                  >
                    Enviar Denúncia
                  </button>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
