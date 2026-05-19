import { requireAdminUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();

  return (
    <section className="container-page py-10">
      <header>
        <p className="text-xs uppercase tracking-[0.12em] text-[#795746]">Owner Panel</p>
        <h1 className="font-display text-4xl text-[#6e4800]">Admin</h1>
      </header>
      <div className="mt-6">
        <AdminNav />
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
