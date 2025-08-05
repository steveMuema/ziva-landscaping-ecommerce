import Footer from '@/components/Footer';
import Navigationbar from '../components/navbar'; 
import PromoSection from '../sections/promo.section';
import AboutUsSection from '@/sections/aboutus.section';

export default function Home() {
  return (
    <>
      <Navigationbar />
      <PromoSection />
      <AboutUsSection />
      <Footer/>
    </>
  );
}