import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="mb-4">Contactez-nous</h1>
            <p className="text-xl text-muted-foreground">
              Notre équipe est à votre disposition pour répondre à vos questions
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2">Email</h3>
              <p className="text-muted-foreground">contact@izacademy.com</p>
            </div>

            <div className="bg-white border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2">Téléphone</h3>
              <p className="text-muted-foreground">+33 1 23 45 67 89</p>
            </div>

            <div className="bg-white border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2">Adresse</h3>
              <p className="text-muted-foreground">123 Avenue des Champs-Élysées, Paris</p>
            </div>
          </div>

          <div className="space-y-6 max-w-xl mx-auto">
            <div className="bg-accent/50 rounded-xl p-8">
              <h3 className="mb-4">Horaires d'ouverture</h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Lundi - Vendredi</span>
                  <span className="font-medium text-foreground">9h - 18h</span>
                </div>
                <div className="flex justify-between">
                  <span>Samedi</span>
                  <span className="font-medium text-foreground">10h - 16h</span>
                </div>
                <div className="flex justify-between">
                  <span>Dimanche</span>
                  <span className="font-medium text-foreground">Fermé</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border rounded-xl p-8">
              <h3 className="mb-4">Réponse rapide</h3>
              <p className="text-muted-foreground mb-4">
                Nous nous engageons à répondre à toutes les demandes dans un délai de 24 heures ouvrées.
              </p>
              <p className="text-muted-foreground">
                Pour les questions urgentes, n'hésitez pas à nous appeler directement.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
