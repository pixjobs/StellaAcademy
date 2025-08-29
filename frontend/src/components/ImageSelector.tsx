// src/components/ImageSelector.tsx
'use client';

// Define the shape of the image data we expect
type Img = {
  title?: string;
  href?: string;
};

// Define the component's props
type ImageSelectorProps = {
  images: Img[];
  selected: number | null;
  onSelect: (imageNumber: number) => void;
};

export default function ImageSelector({ images, selected, onSelect }: ImageSelectorProps) {
  // If there are no images, render nothing.
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
      {/* We only show a max of 12 images for a clean UI */}
      {images.slice(0, 12).map((im, i) => {
        const imageNumber = i + 1;
        const isSelected = selected === imageNumber;

        return (
          <button
            key={imageNumber}
            type="button"
            onClick={() => onSelect(imageNumber)}
            title={`Select image #${imageNumber}`}
            // This class is the target for the parent's GSAP stagger animation
            className={`image-thumb relative group rounded-md overflow-hidden border transition-all duration-200 ${
              isSelected ? 'border-mint' : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            {/* Using a standard img tag is fine for this use case */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={im.href || ''}
              alt={im.title || `Image ${imageNumber}`}
              className="w-full h-16 object-cover"
            />
            <span
              className={`absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-pixel transition-colors ${
                isSelected ? 'bg-mint text-slate-900' : 'bg-black/60 text-white'
              }`}
            >
              #{imageNumber}
            </span>
          </button>
        );
      })}
    </div>
  );
}