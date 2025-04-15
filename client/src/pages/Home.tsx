import { FC } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import TutorialTooltip from '@/components/TutorialTooltip';
import { useTutorial } from '@/contexts/TutorialContext';

interface HomeProps {
  onGetStarted: () => void;
}

const Home: FC<HomeProps> = ({ onGetStarted }) => {
  const [_, setLocation] = useLocation();
  const { startTutorial } = useTutorial();

  const handleGetStarted = () => {
    onGetStarted();
    setLocation('/mood-selection');
  };

  return (
    <div className="w-full">
      <div id="home-intro" className="max-w-4xl mx-auto text-center py-10 md:py-20">
        <TutorialTooltip targetId="home-intro" position="top">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What you seed is what you get! <br />
            <span className="text-primary-600">Explore the best strains and seeds</span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Find your perfect cannabis match based on your mood and preferences. Discover detailed strain information and locate nearby dispensaries that have what you're looking for.
          </p>
          
          <Button 
            onClick={handleGetStarted}
            className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white animate-pulse-green"
          >
            Find My Perfect Strain
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </TutorialTooltip>
        
        <div className="mt-16 relative">
          <img 
            src="https://assets.seedfinder.eu/build/assets/homepage-header-gnzrxAuZ.png" 
            alt="Cannabis strains illustration" 
            className="w-full h-auto max-h-[400px] rounded-xl object-cover"
          />
        </div>
      </div>
      
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <span className="text-primary-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tell Us What You're Looking For</h3>
              <p className="text-gray-600">Select your desired mood, experience level, and preferences to get personalized strain recommendations.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <span className="text-primary-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Curated Recommendations</h3>
              <p className="text-gray-600">Explore detailed strain information, including effects, flavors, THC/CBD content, and user reviews.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <span className="text-primary-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Nearby Dispensaries</h3>
              <p className="text-gray-600">Locate dispensaries in your area that carry your selected strains and compare prices.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Strains</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover some of the most popular cannabis strains that users love for different moods and experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured strain cards would go here */}
            {/* This would be populated dynamically from the strain data */}
            {/* For now, just placeholder content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium">Strain Image</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">Blue Dream</h3>
                <p className="text-sm text-gray-600 mb-2">Hybrid | 17-24% THC</p>
                <p className="text-sm">Perfect for creative and happy moods</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium">Strain Image</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">Northern Lights</h3>
                <p className="text-sm text-gray-600 mb-2">Indica | 16-21% THC</p>
                <p className="text-sm">Ideal for relaxation and sleep</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium">Strain Image</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">Sour Diesel</h3>
                <p className="text-sm text-gray-600 mb-2">Sativa | 19-25% THC</p>
                <p className="text-sm">Great for energy and focus</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Button 
              onClick={handleGetStarted}
              variant="outline"
              className="px-5 py-2"
            >
              Explore All Strains
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
