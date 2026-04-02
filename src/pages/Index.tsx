import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GameZone from "@/components/GameZone";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      <HeroSection />
      <GameZone />
      <StatsSection />
      <Footer />
    </div>
  );
};

export default Index;
