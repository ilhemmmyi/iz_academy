import { AdminLayout } from '../../components/AdminLayout';
import { Save } from 'lucide-react';
import { useState } from 'react';

export function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Iz Academy',
    siteEmail: 'nourslama60@gmail.com',
    supportEmail: 'support@izacademy.com',
    currency: 'DT',
    language: 'fr',
    timezone: 'Europe/Paris',
    emailNotifications: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    alert('Paramètres sauvegardés avec succès !');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1>Paramètres de la plateforme</h1>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>

        <div className="bg-white border border-indigo-100 border-l-4 border-l-indigo-300 rounded-xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="mb-4">Informations générales</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="siteName" className="block mb-2">
                  Nom du site
                </label>
                <input
                  id="siteName"
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="siteEmail" className="block mb-2">
                  Email du site
                </label>
                <input
                  id="siteEmail"
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="supportEmail" className="block mb-2">
                  Email de support
                </label>
                <input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="mb-4">Préférences</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency" className="block mb-2">
                  Devise
                </label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                 <option value="DT">Dinar tunisien (DT)</option>
                 <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar ($)</option>
                </select>
              </div>

              <div>
                <label htmlFor="language" className="block mb-2">
                  Langue
                </label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label htmlFor="timezone" className="block mb-2">
                  Fuseau horaire
                </label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Europe/Paris">Paris (GMT+1)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="mb-4">Options</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-accent/50 rounded-lg cursor-pointer">
                <div>
                  <div className="font-medium mb-1">Notifications par email</div>
                  <div className="text-sm text-muted-foreground">
                    Envoyer des notifications aux utilisateurs
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, emailNotifications: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-accent/50 rounded-lg cursor-pointer">
                <div>
                  <div className="font-medium mb-1">Mode maintenance</div>
                  <div className="text-sm text-muted-foreground">
                    Désactiver temporairement le site
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
