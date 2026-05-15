import { ProtectedRoute } from "@/components/auth/protected-route";

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["field"]}>
      {children}
    </ProtectedRoute>
  );
}
