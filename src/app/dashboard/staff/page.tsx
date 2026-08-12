"use client";

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { format, parseISO } from "date-fns";
import {
  PlusCircle,
  Search,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Radio,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { UserRole } from "@/lib/auth";
import { getUsers, type UserRecord, extractLatLng, getUserErrorMessage } from "@/lib/users";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Owner", value: UserRole.Owner },
  { label: "Sales Manager", value: UserRole.SalesManager },
  { label: "Salesman", value: UserRole.Salesman },
  { label: "Field Team", value: UserRole.Field },
  { label: "Fitter", value: UserRole.Fitter },
  { label: "Stitching Workshop", value: UserRole.Stitching },
  { label: "General User", value: UserRole.User },
];

function getErrorMessage(error: unknown) {
  return getUserErrorMessage(error, "An unexpected error occurred. Please try again.");
}

function getPasswordError(password: string, confirmPassword: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must contain at least one letter and one number.";
  if (password !== confirmPassword) return "Password and confirmation password do not match.";
  return null;
}

function getInitials(name?: string): string {
  if (!name) return "MP";
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoleBadgeStyle(role: UserRole) {
  switch (role) {
    case UserRole.Owner:
      return "bg-amber-50 text-amber-800 border-amber-200/80";
    case UserRole.SalesManager:
      return "bg-purple-50 text-purple-800 border-purple-200/80";
    case UserRole.Salesman:
      return "bg-blue-50 text-blue-800 border-blue-200/80";
    case UserRole.Fitter:
      return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
    case UserRole.Field:
      return "bg-indigo-50 text-indigo-800 border-indigo-200/80";
    case UserRole.Stitching:
      return "bg-rose-50 text-rose-800 border-rose-200/80";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200/80";
  }
}

function formatCheckinTime(user: UserRecord): string {
  const timestamp = user.location?.updatedAt || user.updatedAt;
  if (!timestamp) return "No activity logged";
  try {
    const dateObj = typeof timestamp === "string" ? parseISO(timestamp) : new Date(timestamp);
    return format(dateObj, "MMM d, HH:mm:ss");
  } catch {
    return "No activity logged";
  }
}

export default function StaffDirectoryPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [selectedCheckinFilter, setSelectedCheckinFilter] = useState<"all" | "checked_in" | "checked_out">("all");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.Salesman);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreateStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const passwordError = getPasswordError(password, confirmPassword);

    if (cleanName.length < 2) {
      toast.error("Please enter the user's full name.");
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: cleanName,
        email: cleanEmail,
        phoneNumber: phoneNumber.trim() || undefined,
        password,
        role,
      };

      const { data } = await api.post("/auth/register", payload);

      toast.success("Staff member created successfully.");
      if (data?.user) {
        setUsers((prev) => [data.user, ...prev]);
      } else {
        fetchUsers();
      }
      setIsDialogOpen(false);

      // Reset form
      setName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setConfirmPassword("");
      setRole(UserRole.Salesman);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const isCheckedIn = u.checkedIn !== false;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRoleFilter === "all" || u.role === selectedRoleFilter;
    const matchesCheckin =
      selectedCheckinFilter === "all" ||
      (selectedCheckinFilter === "checked_in" && isCheckedIn) ||
      (selectedCheckinFilter === "checked_out" && !isCheckedIn);

    return matchesSearch && matchesRole && matchesCheckin;
  });

  const totalStaff = users.length;
  const checkedInCount = users.filter((u) => u.checkedIn !== false).length;
  const checkedOutCount = totalStaff - checkedInCount;
  const fieldStaffCount = users.filter(
    (u) => u.role === UserRole.Salesman || u.role === UserRole.Fitter || u.role === UserRole.Field
  ).length;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            <span>Live Workforce Directory</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900">
            Staff <span className="font-medium">Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time staff overview, active check-in statuses, and team access directory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers()}
            disabled={isLoading}
            className="h-10 text-xs font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 shadow-sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-112.5">
              <DialogHeader>
                <DialogTitle>Create Staff Member</DialogTitle>
                <DialogDescription>
                  Register a new team member. They can log in with these credentials immediately.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateStaff} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="E.g. Hamdan Al-Maktoum"
                      className="pl-10 text-xs"
                      minLength={2}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="staff@measurepro.com"
                      className="pl-10 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="+971 50 123 4567"
                      className="pl-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Portal Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger id="role" className="w-full text-xs">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters with a number"
                      className="pl-10 pr-10 text-xs"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter password"
                      className="pl-10 pr-10 text-xs"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Staff"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalStaff}</div>
            <div className="text-xs font-medium text-slate-500">Total Staff Members</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
              <span>{checkedInCount}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            </div>
            <div className="text-xs font-medium text-slate-500">Checked In (Active)</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-700">{checkedOutCount}</div>
            <div className="text-xs font-medium text-slate-500">Checked Out / Off Duty</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-900">{fieldStaffCount}</div>
            <div className="text-xs font-medium text-slate-500">Sales & Field Technicians</div>
          </div>
        </div>
      </div>

      {/* Main Content Table Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {/* Filter Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <Tabs value={selectedRoleFilter} onValueChange={setSelectedRoleFilter} className="w-full lg:w-auto">
            <TabsList className="bg-slate-200/60 h-10 w-full overflow-x-auto justify-start no-scrollbar p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-xs font-semibold">All Roles</TabsTrigger>
              <TabsTrigger value={UserRole.SalesManager} className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-xs font-semibold">Manager</TabsTrigger>
              <TabsTrigger value={UserRole.Salesman} className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-xs font-semibold">Salesman</TabsTrigger>
              <TabsTrigger value={UserRole.Fitter} className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-xs font-semibold">Fitter</TabsTrigger>
              <TabsTrigger value={UserRole.Field} className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-xs font-semibold">Field Team</TabsTrigger>
              <TabsTrigger value={UserRole.Stitching} className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-xs font-semibold">Stitching</TabsTrigger>
              <TabsTrigger value={UserRole.Owner} className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-xs font-semibold">Owner</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Checkin Status Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setSelectedCheckinFilter("all")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                  selectedCheckinFilter === "all" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
                )}
              >
                All Statuses
              </button>
              <button
                onClick={() => setSelectedCheckinFilter("checked_in")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5",
                  selectedCheckinFilter === "checked_in" ? "bg-white shadow-sm text-emerald-700" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Checked In
              </button>
              <button
                onClick={() => setSelectedCheckinFilter("checked_out")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5",
                  selectedCheckinFilter === "checked_out" ? "bg-white shadow-sm text-slate-700" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Checked Out
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-white border-slate-200 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/60 hover:bg-slate-100/60 border-b border-slate-200/80">
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Staff Member</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Phone Number</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Role</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Check-In Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Last Activity</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">GPS Location</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Date Joined</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-slate-400 text-xs uppercase tracking-widest font-semibold">
                    Loading staff directory & presence...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-slate-500 text-sm">
                    No staff members match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isCheckedIn = user.checkedIn !== false;
                  const coords = extractLatLng(user.location);

                  return (
                    <TableRow key={user._id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      {/* Name & Email */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200/80 shrink-0">
                            <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-bold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm">{user.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Phone Number */}
                      <TableCell className="py-3.5">
                        {user.phoneNumber ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{user.phoneNumber}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No phone</span>
                        )}
                      </TableCell>

                      {/* Role */}
                      <TableCell className="py-3.5">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize", getRoleBadgeStyle(user.role))}>
                          {user.role}
                        </span>
                      </TableCell>

                      {/* Check-In Status */}
                      <TableCell className="py-3.5">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/80">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Checked Out
                          </span>
                        )}
                      </TableCell>

                      {/* Last Checkin Activity */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatCheckinTime(user)}</span>
                        </div>
                      </TableCell>

                      {/* GPS Location */}
                      <TableCell className="py-3.5">
                        {coords ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-700 bg-blue-50/80 border border-blue-200/60 px-2 py-0.5 rounded-md">
                            <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                            No GPS Signal
                          </span>
                        )}
                      </TableCell>

                      {/* Date Joined */}
                      <TableCell className="py-3.5 text-xs text-slate-500 font-medium">
                        {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
