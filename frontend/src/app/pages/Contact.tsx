import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { contactApi } from '../../api/contact.api';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await contactApi.submit(formData);
      toast.success('Votre message a été envoyé. Un administrateur vous répondra par email.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      toast.error(err.message || 'Impossible d\'envoyer votre message');
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white border border-border rounded-xl p-8">
              <h2 className="mb-6">Envoyez-nous un message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block mb-2">
                    Nom complet
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block mb-2">
                    Sujet
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="Comment puis-je vous aider ?"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Décrivez votre demande..."
                    className="w-full px-4 py-3 border border-border rounded-lg bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
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
      </div>

      <Footer />
    </div>
  );
}
