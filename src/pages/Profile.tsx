import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Phone, FileText, Calendar, Loader2, Save, Camera } from "lucide-react";
import { useLayoutContext } from "@/components/AppLayout";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useLayoutContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    avatar_url: "",
    created_at: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          created_at: data.created_at || "",
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: user.email || "",
        }));
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {getInitials(profile.full_name || profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {profile.full_name || "Set your name"}
                </h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              {profile.created_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Member since{" "}
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your profile details here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-background/50"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url" className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                Avatar URL
              </Label>
              <Input
                id="avatar_url"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={profile.avatar_url}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, avatar_url: e.target.value }))
                }
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell us a little about yourself..."
                value={profile.bio}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="bg-background/50 min-h-[100px] resize-none"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
