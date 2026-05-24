import { Link } from 'react-router';
import { GraduationCap, Linkedin, Facebook, Instagram } from 'lucide-react';

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/iz-solution/about/',
    icon: Linkedin,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61573412015451&mibextid=wwXIfr&rdid=BeCesdtzQZWDqgvf&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F18WgS6qHTk%2F%3Fmibextid%3DwwXIfr#',
    icon: Facebook,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/iz_solution?fbclid=IwY2xjawSAS0BleHRuA2FlbQIxMABicmlkETExRElQdExNSVF4V3NCTlIyc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHsxzhdFxdU_r6LP45W1xb71p5VXJ3OoPa0A4mE5YpBgdafdZ3DORFqjlhtuO_aem_fXnepTucCmfrAuCmVPgiQA',
    icon: Instagram,
  },
];

const NAV_LINKS = [
  { to: '/',        label: 'Accueil'  },
  { to: '/courses', label: 'Cours'    },
  { to: '/about',   label: 'À propos' },
  { to: '/contact', label: 'Contact'  },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">

          {/* Brand + Social */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-8 h-8 shrink-0" />
              <span className="font-semibold text-xl">Iz Academy</span>
            </div>

            <p className="text-primary-foreground/75 text-sm leading-relaxed max-w-sm">
              Votre plateforme d'apprentissage en ligne pour développer vos compétences professionnelles.
            </p>

            {/* Social icons */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/50 mb-3">
                Suivez-nous
              </p>
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/50 mb-5">
              Navigation
            </p>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ──────────────────────────────────────────────────── */}
        <div className="border-t border-primary-foreground/15 mt-12 pt-6 text-center">
          <p className="text-primary-foreground/60 text-xs">
            &copy; 2026 Iz Academy. Tous droits réservés.
          </p>
        </div>

      </div>
    </footer>
  );
}
