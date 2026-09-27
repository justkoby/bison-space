import { services, servicesSection, links } from '../content/site';

export default function Services() {
  return (
    <section className="services" id="services">
      <p className="eyebrow eyebrow--ink">{servicesSection.eyebrow}</p>
      <h2 className="section-title section-title--ink">{servicesSection.headline}</h2>

      <div className="services__grid">
        {services.map((service) => (
          <article className="service" key={service.index}>
            <span className="service__index">{service.index}</span>
            <h3 className="service__title">{service.title}</h3>
            <p className="service__body">{service.body}</p>
            <a
              className="link-arrow link-arrow--ink"
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              {servicesSection.enquireLabel} <span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>

      <p className="services__note">{servicesSection.note}</p>
    </section>
  );
}
