import { Link } from 'react-router';
import { GraduationCap, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8" />
              <span className="font-semibold text-xl">Iz Academy</span>
            </div>
            <p className="text-primary-foreground/80">
              Votre plateforme d'apprentissage en ligne pour développer vos compétences.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/#courses" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                  Cours
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                  Mentions légales
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                  Politique de confidentialité
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                  CGU
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Suivez-nous</h3>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/80">
          <p>&copy; 2026 Iz Academy. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
