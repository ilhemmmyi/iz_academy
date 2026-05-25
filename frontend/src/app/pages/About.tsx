import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ChevronDown, ChevronUp, Target, Users, Award, BookOpen } from 'lucide-react';
import { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: "Comment fonctionne l'inscription à un cours ?",
    answer:
      "Après avoir créé votre compte, parcourez notre catalogue de cours et cliquez sur \"S'inscrire\" pour le cours qui vous intéresse. Une fois inscrit, vous aurez un accès immédiat à tout le contenu du cours.",
  },
  {
    question: 'Les certificats sont-ils reconnus ?',
    answer:
      'Oui, nos certificats sont reconnus par de nombreuses entreprises et institutions. Ils attestent de vos compétences acquises et peuvent être partagés sur LinkedIn ou ajoutés à votre CV.',
  },
  {
    question: 'Puis-je suivre plusieurs cours en même temps ?',
    answer:
      'Absolument ! Vous pouvez vous inscrire à autant de cours que vous le souhaitez et les suivre à votre propre rythme.',
  },
  {
    question: 'Comment puis-je contacter mon formateur ?',
    answer:
      'Vous pouvez contacter votre formateur via la messagerie intégrée accessible depuis votre tableau de bord ou poser des questions directement sous les vidéos de cours.',
  },
  {
    question: 'Que se passe-t-il si je rate le quiz final ?',
    answer:
      "Pas de panique ! Vous pouvez repasser le quiz autant de fois que nécessaire. Nous vous recommandons de revoir les leçons où vous avez des difficultés avant de réessayer.",
  },
  {
    question: 'Comment obtenir mon certificat ?',
    answer:
      'Complétez toutes les leçons du cours, réussissez les quiz, soumettez et faites valider votre projet pratique. Le certificat sera généré automatiquement une fois tous les critères validés.',
  },
];

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
            À propos d'Iz Solution
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Iz Solution est une plateforme d'apprentissage en ligne conçue pour aider chaque
            apprenant à développer ses compétences à son propre rythme, avec des formateurs
            experts et des certifications reconnues.
          </p>
        </div>
      </section>

      {/* Présentation */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl mb-4">Notre mission</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Rendre l'apprentissage professionnel accessible, efficace et certifié pour tous.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white border border-border rounded-xl shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Mission claire</h3>
              <p className="text-muted-foreground text-sm">
                Former les professionnels de demain avec des contenus de qualité
              </p>
            </div>

            <div className="text-center p-6 bg-white border border-border rounded-xl shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Formateurs experts</h3>
              <p className="text-muted-foreground text-sm">
                Des professionnels du secteur qui partagent leur expérience terrain
              </p>
            </div>

            <div className="text-center p-6 bg-white border border-border rounded-xl shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Apprentissage flexible</h3>
              <p className="text-muted-foreground text-sm">
                Apprenez à votre rythme, où que vous soyez, depuis n'importe quel appareil
              </p>
            </div>

            <div className="text-center p-6 bg-white border border-border rounded-xl shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Certifications</h3>
              <p className="text-muted-foreground text-sm">
                Obtenez un certificat reconnu après avoir complété chaque formation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-accent/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Questions fréquentes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trouvez les réponses à vos questions sur Iz Solution
            </p>
          </div>

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
