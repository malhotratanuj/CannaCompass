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
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient"; // Import the centralized queryClient
import ResetPasswordPage from "@/pages/reset-password"; // Added import
import { ThemeProvider } from "@/contexts/ThemeContext"; // Import ThemeProvider
import ErrorBoundary from "@/components/ErrorBoundary"; //Import ErrorBoundary
import BottomNavigation from "@/components/BottomNavigation"; //Import BottomNavigation
import Favorites from "@/pages/Favorites"; //Import Favorites
import { FavoritesProvider } from "@/contexts/FavoritesContext"; //Import FavoritesProvider


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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <FavoritesProvider>
            <TutorialProvider>
              <CelebrationProvider>
                <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                  {!location.includes('/auth') && <Header />}
                  <main className="flex-grow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <ErrorBoundary>
                        <Switch>
                          <ProtectedRoute path="/" component={() => <Home onGetStarted={() => setCurrentStep(1)} />} />
                          <ProtectedRoute path="/favorites" component={Favorites} />
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
                          <ProtectedRoute 
                            path="/strains/:id" 
                            component={StrainDetail} 
                          />
                          <Route path="/auth" component={AuthPage} />
                          <Route path="/reset-password" component={ResetPasswordPage} /> {/* Added route */}
                          <Route component={NotFound} />
                        </Switch>
                      </ErrorBoundary>
                    </div>
                  </main>
                  {!location.includes('/auth') && <Footer />}
                  {!location.includes('/auth') && <BottomNavigation />}
                  {showPrivacyConsent && (
                    <PrivacyConsent 
                      onAccept={() => setShowPrivacyConsent(false)}
                      onCustomize={() => setShowPrivacyConsent(false)}
                    />
                  )}
                  {showWelcomeModal && <WelcomeModal onClose={() => setShowWelcomeModal(false)} />}
                  <Toaster />
                </div>
              </CelebrationProvider>
            </TutorialProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;