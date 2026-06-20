import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { FAQ_ITEMS } from '../data/faqItems';

export function About() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-100 to-pink-100" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            Centre d'aide
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tout ce qu'il faut savoir sur le fonctionnement d'IZ Academy : inscription,
            paiement, certificats et accompagnement par nos formateurs.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-border rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-accent/50 transition text-left gap-4"
                >
                  <span className="font-medium">{faq.question}</span>
                  {openFaq === index
                    ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  }
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    {faq.bullets && (
                      <ul className="mt-3 space-y-2">
                        {faq.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Vous ne trouvez pas la réponse à votre question ?
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
