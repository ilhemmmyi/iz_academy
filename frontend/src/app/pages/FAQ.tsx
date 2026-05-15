import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Comment fonctionne l\'inscription à un cours ?',
      answer:
        'Après avoir créé votre compte, parcourez notre catalogue de cours et cliquez sur "S\'inscrire" pour le cours qui vous intéresse. Une fois inscrit, vous aurez un accès immédiat à tout le contenu du cours.',
    },
    {
      question: 'Les certificats sont-ils reconnus ?',
      answer:
        'Oui, nos certificats sont reconnus par de nombreuses entreprises et institutions. Ils attestent de vos compétences acquises et peuvent être partagés sur LinkedIn ou ajoutés à votre CV.',
    },
    {
      question: 'Puis-je suivre plusieurs cours en même temps ?',
      answer:
        'Absolument ! Vous pouvez vous inscrire à autant de cours que vous le souhaitez et les suivre à votre propre rythme. Notre plateforme vous permet de gérer facilement tous vos cours en cours.',
    },
    {
      question: 'Comment puis-je contacter mon formateur ?',
      answer:
        'Vous pouvez contacter votre formateur via la messagerie intégrée accessible depuis votre tableau de bord. Vous pouvez également poser des questions directement sous les vidéos de cours.',
    },
    {
      question: 'Que se passe-t-il si je rate le quiz final ?',
      answer:
        'Pas de panique ! Vous pouvez repasser le quiz autant de fois que nécessaire. Nous vous recommandons de revoir les leçons où vous avez des difficultés avant de réessayer.',
    },
    {
      question: 'Comment obtenir mon certificat ?',
      answer: 'Pour obtenir votre certificat, remplissez les conditions suivantes :',
      bullets: [
        'Complétez toutes les leçons du cours (100%)',
        'Réussissez les quiz avec un score minimum de 70%',
        'Soumettez et faites valider tous les projets pratiques',
        'Le certificat sera automatiquement généré une fois tous les critères validés',
      ],
    },
    {
      question: 'Les cours sont-ils accessibles à vie ?',
      answer:
        'Oui, une fois inscrit à un cours, vous y avez accès à vie. Vous pouvez revenir consulter le contenu à tout moment, même après avoir obtenu votre certificat.',
    },
    {
      question: 'Proposez-vous des remboursements ?',
      answer:
        'Nous offrons une garantie satisfait ou remboursé de 30 jours. Si vous n\'êtes pas satisfait du cours, contactez notre support pour obtenir un remboursement complet.',
    },
  ];

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
                    {(faq as any).bullets && (
                      <ul className="mt-3 space-y-2">
                        {(faq as any).bullets.map((b: string, i: number) => (
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
