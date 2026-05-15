import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout allowedRoles={["admin", "owner", "sales_manager", "salesman", "field"]}>{children}</DashboardLayout>;
}
