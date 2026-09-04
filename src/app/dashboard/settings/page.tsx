"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  Shield,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Loader2,
  Settings as SettingsIcon,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { changePassword, getUserErrorMessage, updateUser } from "@/lib/users";

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();

  // Profile Form State
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security / Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Populate initial profile values from logged-in user
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);

  // Handle Profile Update (Name & Phone Number)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?._id) {
      toast.error("User session missing. Please log in again.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      toast.error("Full Name cannot be empty.");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }

    setIsSavingProfile(true);

    try {
      await updateUser(user._id, {
        name: trimmedName,
        phoneNumber: trimmedPhone || undefined,
      });

      // Refresh global Auth state so top bar, sidebar, and context reflect the new name/phone immediately
      await refreshProfile();

      toast.success("Profile updated successfully!");
    } catch (error) {
      const message = getUserErrorMessage(error, "Failed to update profile.");
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter your new password.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and Confirm password do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword({
        oldPassword,
        password: newPassword,
        confirmPassword,
      });

      toast.success("Password changed successfully!");

      // Clear password fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = getUserErrorMessage(error, "Failed to change password.");
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // User Initials for Avatar
  const getInitials = (userName?: string) => {
    if (!userName) return "U";
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return userName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-6 md:p-8 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Account Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage your profile information, contact details, and security password.
            </p>
          </div>
        </div>

        {user && (
          <Badge
            variant="outline"
            className="w-fit self-start sm:self-center px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-500" />
            Role: {user.role}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Update your full name and primary phone number.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" /> Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus-visible:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Phone Number Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" /> Phone Number
                    </label>
                    <Input
                      type="tel"
                      placeholder="e.g. +971501234567 or +919876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-medium font-mono text-slate-900 dark:text-white focus-visible:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400">Include country code for WhatsApp & SMS updates.</p>
                  </div>

                  {/* Email Field (Read Only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                    </label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                    />
                  </div>

                  {/* Role Field (Read Only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400" /> System Role
                    </label>
                    <Input
                      type="text"
                      value={user?.role || ""}
                      disabled
                      className="bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 px-5 text-xs sm:text-sm h-10"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>


          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Ensure your account is using a strong password.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white pr-10 focus-visible:ring-amber-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-500" /> New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Min 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white pr-10 focus-visible:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white pr-10 focus-visible:ring-emerald-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Mismatch Warning */}
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    New passwords do not match.
                  </div>
                )}

                <div className="pt-3 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-semibold shadow-md px-5 text-xs sm:text-sm h-10"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>


        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden">
            <CardHeader className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 text-center relative">
              <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 p-1 shadow-xl">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-black text-2xl sm:text-3xl text-white">
                  {getInitials(user?.name)}
                </div>
              </div>
              <h2 className="mt-3 font-bold text-lg text-white truncate">{user?.name || "User"}</h2>
              <p className="text-xs text-slate-300 truncate">{user?.email}</p>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-blue-500" /> Account Type
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{user?.role}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> Phone
                </span>
                <span className="font-mono text-slate-900 dark:text-slate-200 font-medium truncate max-w-40">
                  {user?.phoneNumber || "Not provided"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Account Status
                </span>
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>



      </div>
    </div>
  );
}
