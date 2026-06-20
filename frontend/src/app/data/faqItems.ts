export interface FaqItem {
  question: string;
  answer: string;
  bullets?: string[];
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Comment fonctionne l'inscription à un cours ?",
    answer:
      "Après avoir créé votre compte, parcourez notre catalogue et envoyez une demande d'inscription pour le cours qui vous intéresse. Cette demande est examinée par notre équipe : une fois approuvée, vous obtenez un accès immédiat à tout le contenu du cours.",
  },
  {
    question: 'Comment se passe le paiement ?',
    answer:
      "Le paiement ne se fait pas en ligne par carte bancaire sur la plateforme. Il s'effectue en personne ou par virement bancaire auprès de notre équipe, qui confirme ensuite le règlement sur votre compte. Votre accès au cours est activé une fois le paiement enregistré.",
  },
  {
    question: 'Puis-je suivre plusieurs cours en même temps ?',
    answer:
      "Oui. Vous pouvez envoyer une demande d'inscription pour autant de cours que vous le souhaitez et les suivre à votre propre rythme une fois chaque demande approuvée.",
  },
  {
    question: 'Comment puis-je contacter mon formateur ?',
    answer:
      "Vous pouvez contacter votre formateur via la messagerie intégrée accessible depuis votre tableau de bord, ou poser vos questions directement en commentaire sous les leçons concernées.",
  },
  {
    question: 'Que se passe-t-il si je rate le quiz final ?',
    answer:
      "Pas de panique ! Vous pouvez repasser le quiz autant de fois que nécessaire. Un score minimum de 80% est requis pour le valider et débloquer la suite du cours.",
  },
  {
    question: 'Comment obtenir mon certificat de fin de formation ?',
    answer: 'Le certificat est généré automatiquement dès que ces conditions sont remplies :',
    bullets: [
      'Toutes les leçons du cours sont complétées',
      'Le quiz de chaque leçon concernée est réussi',
      'Le projet pratique est soumis et validé par votre formateur',
    ],
  },
  {
    question: 'Mon accès à un cours peut-il expirer ?',
    answer:
      "Selon les modalités convenues avec l'administration, l'accès à un cours peut être limité dans le temps. La date d'expiration, si elle existe, est visible depuis votre tableau de bord. Contactez-nous pour toute demande de prolongation.",
  },
  {
    question: 'Proposez-vous un remboursement ?',
    answer:
      "Il n'y a pas de remboursement automatique sur la plateforme. Pour toute demande, contactez notre équipe via la page Contact : chaque situation est étudiée au cas par cas.",
  },
];
