import { ProtectedRoute } from "@/components/auth/protected-route";

export default function FitterLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "sales_manager", "fitter"]}>
      {children}
    </ProtectedRoute>
  );
}
