import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface PlaceImageProps {
  src?: string;
  alt: string;
  className: string;
}

export function PlaceImage({ src, alt, className }: PlaceImageProps) {
  const [hasError, setHasError] = useState(!src);

  useEffect(() => setHasError(!src), [src]);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-stone-100 text-stone-400`} role="img" aria-label={`${alt}: imagem não cadastrada`}>
        <MapPin className="h-5 w-5" aria-hidden="true" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setHasError(true)} />;
}
