import { Resend } from 'resend';
import { config } from '../config';

const resend = new Resend(config.resendApiKey);

const FROM = config.emailFrom; // e.g. "Iz Academy <no-reply@izacademy.com>"

const nl2br = (value: string) => value.replace(/\n/g, '<br />');

/** Escape HTML special characters to prevent injection in email templates */
const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const EmailService = {

  async sendWelcome(email: string, name: string) {
    await resend.emails.send({
      from: FROM,
      to: [email],
      subject: 'Bienvenue sur IzAcademy !',
      html: `<h1>Bienvenue ${esc(name)} !</h1><p>Votre compte a été créé avec succès.</p>`,
    });
  },

  async sendEnrollmentStatus(data: { email: string; name: string; courseName: string; status: string }) {
    const approved = data.status === 'APPROVED';
    await resend.emails.send({
      from: FROM,
      to: [data.email],
      subject: approved ? 'Inscription approuvée !' : 'Inscription refusée',
      html: `<p>Bonjour ${esc(data.name)}, votre demande pour <strong>${esc(data.courseName)}</strong> a été ${approved ? 'approuvée' : 'refusée'}.</p>`,
    });
  },

  async sendCertificate(data: { email: string; name: string; courseName: string; fileUrl: string }) {
    await resend.emails.send({
      from: FROM,
      to: [data.email],
      subject: `Votre certificat pour ${esc(data.courseName)}`,
      html: `<p>Félicitations ${esc(data.name)} ! Votre certificat est disponible : <a href="${esc(data.fileUrl)}">Télécharger</a></p>`,
    });
  },

  async sendContactNotification(data: {
    to: string[];
    name: string;
    email: string;
    subject: string;
    message: string;
    contactMessageId: string;
  }) {
    await resend.emails.send({
      from: FROM,
      to: data.to,
      subject: `Nouveau message de contact : ${esc(data.subject)}`,
      html: `
        <h2>Nouveau message depuis la page contact</h2>
        <p><strong>Nom :</strong> ${esc(data.name)}</p>
        <p><strong>Email :</strong> ${esc(data.email)}</p>
        <p><strong>Sujet :</strong> ${esc(data.subject)}</p>
        <p><strong>Message :</strong><br />${nl2br(esc(data.message))}</p>
        <p><strong>ID :</strong> ${esc(data.contactMessageId)}</p>
      `,
    });
  },

  async sendContactReply(data: { to: string; name: string; subject: string; replyMessage: string }) {
    await resend.emails.send({
      from: FROM,
      to: [data.to],
      subject: `Réponse à votre message : ${esc(data.subject)}`,
      html: `
        <p>Bonjour ${esc(data.name)},</p>
        <p>Merci de nous avoir contactés. Voici notre réponse :</p>
        <p>${nl2br(esc(data.replyMessage))}</p>
        <br />
        <p>Cordialement,<br />L'équipe Iz Academy</p>
      `,
    });
  },
};

