"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Mail, Phone, FileText, Shield } from "lucide-react";
import type { UserRole } from "@/contexts/auth-context";
import { normalizePhone } from "@/helpers";

const AgentProfile = () => {
  const { user, profile, updateProfileLocal, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setBio(profile.bio ?? "");
  }, [user?.name, user?.phone, profile.bio]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const payload: { name: string; phone?: string } = { name: trimmed };
    if (normalizedPhone && normalizedPhone !== (user?.phone ?? "")) {
      payload.phone = normalizedPhone;
    }

    setIsSaving(true);
    const res = await updateProfile(payload);
    setIsSaving(false);

    if (!res.success) {
      toast({
        title: "Couldn't save profile",
        description: res.error || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    updateProfileLocal({ bio: bio.trim() || undefined });
    toast({
      title: "Profile updated",
      description: "Your agent profile has been saved.",
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">Agent Profile</h2>
        <p className="text-sm text-muted-foreground">Update your profile for tenants and listings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-border">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {user.name.split(" ").map((n) => n[0]).join("") || "AG"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground truncate">{user.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <span className="inline-block mt-1 text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">
                Agent
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name" className="flex items-center gap-2 text-foreground">
                <UserCircle className="w-4 h-4" /> Full Name
              </Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-email" className="flex items-center gap-2 text-foreground">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input
                id="agent-email"
                value={user.email ?? ""}
                disabled
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {user.email === "sahinppmdon7@gmail.com" && (
              <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <Label className="flex items-center gap-2 text-primary font-semibold">
                  <Shield className="w-4 h-4" /> Super Admin Role Override
                </Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={user.role}
                  onChange={async (e) => {
                    const val = e.target.value as UserRole;
                    const res = await updateProfile({ role: val });
                    if (res.success) {
                      toast({ title: "Role updated", description: `You are now a ${val}. Re-routing...` });
                      window.location.href = `/${val}/dashboard`;
                    } else {
                      toast({ title: "Failed", description: res.error || "Unknown error", variant: "destructive" });
                    }
                  }}
                >
                  <option value="tenant">Tenant</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-muted-foreground">Instantly switches your role context on the backend and updates your session.</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="agent-phone" className="flex items-center gap-2 text-foreground">
                <Phone className="w-4 h-4" /> Phone
              </Label>
              <Input
                id="agent-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-bio" className="flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4" /> Bio
              </Label>
              <Textarea
                id="agent-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell tenants about yourself, experience, and areas you cover..."
                rows={4}
                className="bg-background resize-none"
              />
              <p className="text-xs text-muted-foreground">Bio is saved on this device only.</p>
            </div>
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default AgentProfile;
