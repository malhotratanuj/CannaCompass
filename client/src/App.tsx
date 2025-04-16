import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MoodSelection from "@/pages/MoodSelection";
import EffectsPreferences from "@/pages/EffectsPreferences";
import StrainRecommendations from "@/pages/StrainRecommendations";
import StrainDetail from "@/pages/StrainDetail";
import StoreFinder from "@/pages/StoreFinder";
import AuthPage from "@/pages/auth-page";
import { useState, useEffect } from "react";
import { RecommendationRequest, Strain } from "@shared/schema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrivacyConsent from "@/components/PrivacyConsent";
import WelcomeModal from "@/components/WelcomeModal";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { CelebrationProvider } from "@/contexts/CelebrationContext";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

  // Create a new QueryClient instance
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CelebrationProvider>
          <TutorialProvider>
            <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
              <Header />
              
              <main className="flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Switch>
                    <ProtectedRoute path="/" component={() => <Home onGetStarted={() => setCurrentStep(1)} />} />
                    <ProtectedRoute 
                      path="/mood-selection" 
                      component={() => (
                        <MoodSelection 
                          currentStep={currentStep}
                          onStepChange={handleStepChange}
                          preferences={userPreferences}
                          updatePreferences={updatePreferences}
                        />
                      )} 
                    />
                    <ProtectedRoute 
                      path="/effects-preferences" 
                      component={() => (
                        <EffectsPreferences 
                          currentStep={currentStep}
                          onStepChange={handleStepChange}
                          preferences={userPreferences}
                          updatePreferences={updatePreferences}
                        />
                      )} 
                    />
                    <ProtectedRoute 
                      path="/recommendations" 
                      component={() => (
                        <StrainRecommendations 
                          currentStep={currentStep}
                          onStepChange={handleStepChange}
                          preferences={userPreferences}
                          recommendedStrains={recommendedStrains}
                          setRecommendedStrains={setRecommendedStrains}
                          selectedStrains={selectedStrains}
                          onStrainSelect={handleStrainSelect}
                        />
                      )} 
                    />
                    <ProtectedRoute 
                      path="/store-finder" 
                      component={() => (
                        <StoreFinder 
                          currentStep={currentStep}
                          onStepChange={handleStepChange}
                          selectedStrains={selectedStrains}
                        />
                      )} 
                    />
                    <Route path="/auth" component={AuthPage} />
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
        </CelebrationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
