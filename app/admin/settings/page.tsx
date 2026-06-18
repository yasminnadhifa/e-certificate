import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const features = [
    "Pengaturan notifikasi dan alert otomatis",
    "Template default untuk sertifikat baru",
    "Kontrol akses dan manajemen izin",
    "Laporan dan analitik penggunaan",
    "Backup dan restore data",
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pengaturan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Konfigurasi dan preferensi administrator.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.024 1.194-.14 1.743" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Dalam Pengembangan</h2>
              <p className="text-xs text-gray-500">Fitur-fitur berikut sedang dikerjakan</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2.5 text-sm text-gray-600">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
