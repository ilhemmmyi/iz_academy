import { AdminLayout } from '../../components/AdminLayout';
import { Search, Download, TrendingUp, Euro } from 'lucide-react';
import { useState, useEffect } from 'react';
import { paymentsApi } from '../../../api/payments.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function buildRevenueChart(payments: any[]) {
  const now = new Date();
  const PROJECT_START_MONTH = 2; // March
  const slots = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(now.getFullYear(), PROJECT_START_MONTH + i, 1);
    return { month: MONTHS_FR[d.getMonth()], year: d.getFullYear(), monthIndex: d.getMonth(), revenue: 0 };
  });
  payments.forEach(p => {
    if (p.status !== 'COMPLETED' || !p.createdAt) return;
    const d = new Date(p.createdAt);
    const slot = slots.find(s => s.monthIndex === d.getMonth() && s.year === d.getFullYear());
    if (slot) slot.revenue += p.amount ?? 0;
  });
  return slots.map(s => ({ month: s.month, revenue: s.revenue }));
}

export function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.getAll()
      .then(data => setPayments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter(p =>
    (p.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.course?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + (p.amount || 0), 0);
  const now = new Date();
  const thisMonth = payments
    .filter(p => p.status === 'COMPLETED' && new Date(p.createdAt).getMonth() === now.getMonth() && new Date(p.createdAt).getFullYear() === now.getFullYear())
    .reduce((s, p) => s + (p.amount || 0), 0);

  const revenueChartData = buildRevenueChart(payments);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-1">Gestion des paiements</h1>
            <p className="text-sm text-muted-foreground">Suivi des revenus et transactions</p>
          </div>
          <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2 text-sm font-medium">
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>

        {/* Chart + Stats side by side */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Chart takes 2/3 */}
          <div className="lg:col-span-2 bg-white border border-teal-100 border-l-4 border-l-teal-400 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-semibold">Revenus mensuels (DT)</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueChartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v}DT`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [`${v}DT`, 'Revenus']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="revenue" fill="#0d9488" opacity={0.85} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats take 1/3, stacked vertically */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 bg-white border border-indigo-100 border-l-4 border-l-indigo-400 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Euro className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm text-muted-foreground">Revenus totaux</span>
              </div>
              <div className="text-3xl font-bold text-indigo-700">{totalRevenue.toFixed(0)}DT</div>
              <div className="text-xs text-muted-foreground mt-1">Tous paiements complétés</div>
            </div>

            <div className="flex-1 bg-white border border-teal-100 border-l-4 border-l-teal-400 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-teal-50">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-sm text-muted-foreground">Ce mois-ci</span>
              </div>
              <div className="text-3xl font-bold text-teal-700">{thisMonth.toFixed(0)}DT</div>
              <div className="text-xs text-muted-foreground mt-1">{MONTHS_FR[now.getMonth()]} {now.getFullYear()}</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par étudiant ou cours..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm">Transactions ({filtered.length})</span>
          </div>
          <table className="w-full">
            <thead className="bg-accent/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Étudiant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cours</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">Aucun paiement trouvé.</td></tr>
              ) : filtered.map((payment) => (
                <tr key={payment.id} className="hover:bg-accent/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm">{payment.user?.name}</div>
                    <div className="text-xs text-muted-foreground">{payment.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{payment.course?.title}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md text-sm">{payment.amount}DT</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'COMPLETED'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {payment.status === 'COMPLETED' ? 'Complété' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
}