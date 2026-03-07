import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GameZone from "@/components/GameZone";
import RecentWinners from "@/components/RecentWinners";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <GameZone />
      <RecentWinners />
      <StatsSection />
      <Footer />
    </div>
  );
};

export default Index;
