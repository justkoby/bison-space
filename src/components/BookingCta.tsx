import type { CSSProperties } from 'react';
import { booking, links } from '../content/site';
import { images } from '../content/images';

export default function BookingCta() {
  const asset = images[booking.imageId];

  return (
    <section className="cta">
      <div className="cta__copy">
        <p className="eyebrow">{booking.eyebrow}</p>
        <h2 className="section-title">{booking.headline}</h2>
        <p className="cta__body">{booking.body}</p>
        <a
          className="btn btn--solid cta__button"
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          {booking.buttonLabel}
        </a>
      </div>

      <figure className="cta__frame">
        <img
          src={asset.src}
          alt={asset.alt}
          loading="lazy"
          decoding="async"
          style={{ '--op': asset.objectPosition } as CSSProperties}
        />
      </figure>
    </section>
  );
}
