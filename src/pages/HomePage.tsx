import Hero from '../components/Hero';
import Intro from '../components/Intro';
import WhatWeShoot from '../components/WhatWeShoot';
import Packages from '../components/Packages';
import About from '../components/About';
import BookingCta from '../components/BookingCta';

/** The homepage: hero wall, intro, services, packages, about and booking CTA. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <WhatWeShoot />
      <Packages />
      <About />
      <BookingCta />
    </>
  );
}
