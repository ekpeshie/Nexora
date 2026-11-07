import { useState } from 'react';
import { asset, testimonials } from '../data/content';

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];

  return (
    <section className="testimonials" aria-label="Testimonials">
      <img className="testimonials__pattern" src={asset('testimonial-pattern.svg')} width={1141} height={441} alt="" />
      <div className="testimonials__inner">
        <h2 className="eyebrow">Testimonials</h2>
        <blockquote className="testimonials__quote">“{t.quote}”</blockquote>
        <figure className="testimonials__author">
          <img src={t.logo} width={24} height={24} alt="" />
          <figcaption>
            <span className="testimonials__name">{t.name}</span>
            <span className="testimonials__role">{t.role}</span>
          </figcaption>
        </figure>
        {testimonials.length > 1 && (
          <div className="dots" role="tablist" aria-label="Choose testimonial">
            {testimonials.map((item, i) => (
              <button
                key={item.name + i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Testimonial ${i + 1}`}
                className={`dots__dot${i === index ? ' is-active' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
