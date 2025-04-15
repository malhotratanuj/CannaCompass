import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MoodSelection from "@/pages/MoodSelection";
import EffectsPreferences from "@/pages/EffectsPreferences";
import StrainRecommendations from "@/pages/StrainRecommendations";
import StoreFinder from "@/pages/StoreFinder";
import { useState, useEffect } from "react";
import { RecommendationRequest, Strain } from "@shared/schema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrivacyConsent from "@/components/PrivacyConsent";
import WelcomeModal from "@/components/WelcomeModal";
import { TutorialProvider } from "@/contexts/TutorialContext";

function App() {
  const [location] = useLocation();
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [userPreferences, setUserPreferences] = useState<RecommendationRequest>({
    mood: "",
    experienceLevel: "beginner",
    effects: [],
    flavors: [],
    consumptionMethod: []
  });
  const [recommendedStrains, setRecommendedStrains] = useState<Strain[]>([]);
  const [selectedStrains, setSelectedStrains] = useState<Strain[]>([]);
  
  // For debugging purposes
  useEffect(() => {
    console.log('Current location:', location);
  }, [location]);
  
  // Show welcome modal on first visit
  useEffect(() => {
    if (location === '/' && !localStorage.getItem('tutorialShown')) {
      setShowWelcomeModal(true);
      localStorage.setItem('tutorialShown', 'true');
    }
  }, [location]);

  // Update step based on current route
  useEffect(() => {
    if (location === '/mood-selection') {
      setCurrentStep(1);
    } else if (location === '/effects-preferences') {
      setCurrentStep(2);
    } else if (location === '/recommendations') {
      setCurrentStep(3);
    } else if (location === '/store-finder') {
      setCurrentStep(4);
    }
  }, [location]);

  const updatePreferences = (preferences: Partial<RecommendationRequest>) => {
    console.log('Updating preferences:', preferences);
    setUserPreferences(prev => ({ ...prev, ...preferences }));
  };

  const handleStepChange = (step: number) => {
    console.log('Changing step to:', step);
    setCurrentStep(step);
  };

  const handleStrainSelect = (strain: Strain) => {
    console.log('Selecting strain:', strain.name);
    if (selectedStrains.find(s => s.id === strain.id)) {
      setSelectedStrains(selectedStrains.filter(s => s.id !== strain.id));
    } else {
      setSelectedStrains([...selectedStrains, strain]);
    }
  };

  return (
    <TutorialProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <Header />
        
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Switch>
              <Route path="/">
                <Home onGetStarted={() => setCurrentStep(1)} />
              </Route>
              <Route path="/mood-selection">
                <MoodSelection 
                  currentStep={currentStep}
                  onStepChange={handleStepChange}
                  preferences={userPreferences}
                  updatePreferences={updatePreferences}
                />
              </Route>
              <Route path="/effects-preferences">
                <EffectsPreferences 
                  currentStep={currentStep}
                  onStepChange={handleStepChange}
                  preferences={userPreferences}
                  updatePreferences={updatePreferences}
                />
              </Route>
              <Route path="/recommendations">
                <StrainRecommendations 
                  currentStep={currentStep}
                  onStepChange={handleStepChange}
                  preferences={userPreferences}
                  recommendedStrains={recommendedStrains}
                  setRecommendedStrains={setRecommendedStrains}
                  selectedStrains={selectedStrains}
                  onStrainSelect={handleStrainSelect}
                />
              </Route>
              <Route path="/store-finder">
                <StoreFinder 
                  currentStep={currentStep}
                  onStepChange={handleStepChange}
                  selectedStrains={selectedStrains}
                />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
        
        <Footer />
        <Toaster />
        
        {showPrivacyConsent && (
          <PrivacyConsent 
            onAccept={() => setShowPrivacyConsent(false)}
            onCustomize={() => setShowPrivacyConsent(false)}
          />
        )}

        <WelcomeModal 
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
        />
      </div>
    </TutorialProvider>
  );
}

export default App;
