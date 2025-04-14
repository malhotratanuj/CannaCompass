import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MoodSelection from "@/pages/MoodSelection";
import EffectsPreferences from "@/pages/EffectsPreferences";
import StrainRecommendations from "@/pages/StrainRecommendations";
import StoreFinder from "@/pages/StoreFinder";
import { useState } from "react";
import { RecommendationRequest, Strain } from "@shared/schema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrivacyConsent from "@/components/PrivacyConsent";

function App() {
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
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

  const updatePreferences = (preferences: Partial<RecommendationRequest>) => {
    setUserPreferences(prev => ({ ...prev, ...preferences }));
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleStrainSelect = (strain: Strain) => {
    if (selectedStrains.find(s => s.id === strain.id)) {
      setSelectedStrains(selectedStrains.filter(s => s.id !== strain.id));
    } else {
      setSelectedStrains([...selectedStrains, strain]);
    }
  };

  return (
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
    </div>
  );
}

export default App;
