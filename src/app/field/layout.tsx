import { ProtectedRoute } from "@/components/auth/protected-route";

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "sales_manager", "salesman", "field"]}>
      {children}
    </ProtectedRoute>
  );
}
