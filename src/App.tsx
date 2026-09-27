import Header from './components/Header';
import Hero from './components/Hero';
import Intro from './components/Intro';
import SiteIntro from './components/SiteIntro';
import SelectedWork from './components/SelectedWork';
import Services from './components/Services';
import About from './components/About';
import BookingCta from './components/BookingCta';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <SiteIntro />
      <Header />
      <main>
        <Hero />
        <Intro />
        <SelectedWork />
        <Services />
        <About />
        <BookingCta />
      </main>
      <Footer />
    </>
  );
}
