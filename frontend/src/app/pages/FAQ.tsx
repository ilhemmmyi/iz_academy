import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { FAQ_ITEMS } from '../data/faqItems';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = FAQ_ITEMS;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="mb-4">Questions Fréquentes</h1>
            <p className="text-xl text-muted-foreground">
              Trouvez les réponses à vos questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between hover:bg-accent transition text-left"
                >
                  <h3>{faq.question}</h3>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0 ml-4" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground">{faq.answer}</p>
                    {faq.bullets && (
                      <ul className="mt-3 space-y-2">
                        {faq.bullets.map((b: string, i: number) => (
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

          <div className="mt-16 text-center bg-accent/50 rounded-xl p-8">
            <h2 className="mb-4">Vous ne trouvez pas la réponse ?</h2>
            <p className="text-muted-foreground mb-6">
              Notre équipe est là pour vous aider
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
