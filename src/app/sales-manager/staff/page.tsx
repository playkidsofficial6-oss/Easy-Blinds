"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { PlusCircle, Search, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { AuthUser, UserRole } from "@/lib/auth";

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

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Owner", value: "owner" },
  { label: "Sales Manager", value: "sales_manager" },
  { label: "Salesman", value: "salesman" },
  { label: "Field Team", value: "field" },
  { label: "Fitter", value: "fitter" },
  { label: "Stitching Workshop", value: "stitching" },
  { label: "General User", value: "user" },
];

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }
  return "An unexpected error occurred. Please try again.";
}

function getPasswordError(password: string, confirmPassword: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must contain at least one letter and one number.";
  if (password !== confirmPassword) return "Password and confirmation password do not match.";
  return null;
}

export default function StaffDirectoryPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("salesman");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const { data } = await api.get<AuthUser[]>("/users");
      setUsers(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

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
        password,
        role,
      };
      
      // Directly call api.post so it does NOT override the current logged-in token
      const { data } = await api.post("/auth/register", payload);
      
      toast.success("Staff member created successfully.");
      setUsers((prev) => [...prev, data.user]);
      setIsDialogOpen(false);
      
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("salesman");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredUsers = users.filter(
    (u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            u.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRoleFilter === "all" || u.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    }
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-white">
            Staff Directory
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your team members and their portal access.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Staff Member</DialogTitle>
              <DialogDescription>
                Register a new team member. They will be able to log in with these credentials immediately.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="E.g. Muhammed Rashid"
                    className="pl-10"
                    minLength={2}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="staff@easyblinds.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Portal role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters with a number"
                    className="pl-10 pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter password"
                    className="pl-10 pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-neutral-900 text-white hover:bg-neutral-800" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Staff"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Tabs value={selectedRoleFilter} onValueChange={setSelectedRoleFilter} className="w-full md:w-auto">
            <TabsList className="bg-neutral-200/50 dark:bg-neutral-800 h-10 w-full overflow-x-auto justify-start no-scrollbar">
              <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 px-4">All</TabsTrigger>
              <TabsTrigger value="sales_manager" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 px-4">Manager</TabsTrigger>
              <TabsTrigger value="salesman" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 px-4">Salesman</TabsTrigger>
              <TabsTrigger value="fitter" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 px-4">Fitter</TabsTrigger>
              <TabsTrigger value="field" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 px-4">Field Team</TabsTrigger>
              <TabsTrigger value="stitching" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 px-4">Stitching</TabsTrigger>
              <TabsTrigger value="owner" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 px-4">Owner</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-neutral-500">
                    Loading staff directory...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-neutral-500">
                    No staff members found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-neutral-500">{user.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                        {user.role.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
