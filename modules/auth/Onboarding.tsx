"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth, type User } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useDetectCurrentLocation } from "@/hooks/use-detect-current-location";
import { getPostAuthRoute } from "@/lib/auth-redirect";
import { api } from "@/lib/api";

const Onboarding = () => {
  const { user, isAuthenticated, isAuthReady, updateProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { run: detectLocation, isPending: detectingLocation } = useDetectCurrentLocation();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.onboardingCompleted) {
      router.replace(getPostAuthRoute(user));
      return;
    }

    setEmail(user?.email || "");
    setName(user?.name || "");
    setLocationAddress(user?.locationAddress || "");
    setLocationCity(user?.locationCity || "");
    setLocationState(user?.locationState || "");
    setLocationCountry(user?.locationCountry || "");
    setLatitude(user?.latitude ?? undefined);
    setLongitude(user?.longitude ?? undefined);
  }, [isAuthReady, isAuthenticated, router, user]);

  const handleDetectLocation = async () => {
    const outcome = await detectLocation();

    if (outcome.status === "success") {
      const { lat, lng, displayName, structured } = outcome.data;
      setLatitude(lat);
      setLongitude(lng);
      setLocationAddress(displayName);
      setLocationCity(structured.city ?? "");
      setLocationState(structured.state ?? "");
      setLocationCountry(structured.country ?? "");
      toast({ title: "Location detected", description: "You can edit the fields if needed." });
      return;
    }

    if (outcome.status === "partial") {
      setLatitude(outcome.lat);
      setLongitude(outcome.lng);
      toast({
        title: "Location fetched partially",
        description: "Coordinates captured. Enter city/state/country manually if needed.",
      });
      return;
    }

    if (outcome.status === "unsupported") {
      toast({
        title: "Location unavailable",
        description: "Geolocation is not supported on this device. Please enter location manually.",
        variant: "destructive",
      });
      return;
    }

    if (outcome.status === "denied") {
      toast({
        title: "Location permission denied",
        description: "Please enter your location manually.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Could not get location",
      description: outcome.message || "Try again or enter your address manually.",
      variant: "destructive",
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !email.trim() ||
      !name.trim() ||
      !locationAddress.trim() ||
      !locationCity.trim() ||
      !locationState.trim() ||
      !locationCountry.trim()
    ) {
      toast({
        title: "Missing fields",
        description: "Please complete email, name, address, city, state, and country.",
        variant: "destructive",
      });
      return;
    }

    setSavingProfile(true);
    const result = await updateProfile({
      email: email.trim(),
      name: name.trim(),
      locationAddress: locationAddress.trim(),
      locationCity: locationCity.trim(),
      locationState: locationState.trim(),
      locationCountry: locationCountry.trim(),
      latitude,
      longitude,
    });
    setSavingProfile(false);

    if (!result.success) {
      toast({ title: "Profile update failed", description: result.error, variant: "destructive" });
      return;
    }

    const nextUser: User | null = user
      ? { ...user, onboardingCompleted: true }
      : null;
    if (nextUser?.role === "vendor") {
      try {
        await api.vendors.updateProfile({ about: "Partner onboarding complete" });
      } catch {
        /* KYC details can be completed under Profile */
      }
    }

    router.replace(getPostAuthRoute(nextUser));
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Complete Your Profile</h1>
            <p className="text-sm text-muted-foreground">Add email, name, and your full location. All fields are required.</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>
              Use current location to fill address fields, or enter them manually. All fields are required.
            </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="onboarding-email">Email</Label>
                  <Input
                    id="onboarding-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboarding-name">Name</Label>
                  <Input
                    id="onboarding-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="flex gap-3 flex-wrap items-center">
                  <Button type="button" variant="outline" onClick={handleDetectLocation} disabled={detectingLocation}>
                    <LocateFixed className="w-4 h-4 mr-2" />
                    {detectingLocation ? "Detecting..." : "Use Current Location"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    If permission is denied, enter location fields manually below.
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboarding-address">Address</Label>
                  <Input
                    id="onboarding-address"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Street / area / locality"
                    required
                    autoComplete="street-address"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-city">City</Label>
                    <Input
                      id="onboarding-city"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      required
                      autoComplete="address-level2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-state">State</Label>
                    <Input
                      id="onboarding-state"
                      value={locationState}
                      onChange={(e) => setLocationState(e.target.value)}
                      required
                      autoComplete="address-level1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-country">Country</Label>
                    <Input
                      id="onboarding-country"
                      value={locationCountry}
                      onChange={(e) => setLocationCountry(e.target.value)}
                      required
                      autoComplete="country-name"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Finish Setup"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
