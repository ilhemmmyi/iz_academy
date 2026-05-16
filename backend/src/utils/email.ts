import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // STARTTLS on port 587
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

// Vérifie la connexion SMTP au démarrage
transporter.verify((err) => {
  if (err) {
    console.error('[EmailService] SMTP connection FAILED:', err.message);
  } else {
    console.log('[EmailService] SMTP connection OK — ready to send emails');
  }
});

const FROM = config.emailFrom;

/** Escape HTML to prevent injection in email templates */
const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const nl2br = (value: string) => value.replace(/\n/g, '<br />');

async function send(options: { to: string | string[]; subject: string; html: string }) {
  await transporter.sendMail({
    from: FROM,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
  });
}

export const EmailService = {

  async sendWelcome(email: string, name: string) {
    await send({
      to: email,
      subject: 'Bienvenue sur IzAcademy !',
      html: `<h1>Bienvenue ${esc(name)} !</h1><p>Votre compte a été créé avec succès.</p>`,
    });
  },

  async sendEnrollmentStatus(data: { email: string; name: string; courseName: string; status: string }) {
    const approved = data.status === 'APPROVED';
    await send({
      to: data.email,
      subject: approved ? 'Inscription approuvée !' : 'Inscription refusée',
      html: `<p>Bonjour ${esc(data.name)}, votre demande pour <strong>${esc(data.courseName)}</strong> a été ${approved ? 'approuvée' : 'refusée'}.</p>`,
    });
  },

  async sendCertificate(data: { email: string; name: string; courseName: string; fileUrl: string }) {
    await send({
      to: data.email,
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
    await send({
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

  async sendContactReply(data: {
    to: string;
    name: string;
    subject: string;
    replyMessage: string;
    originalMessage?: string;
  }) {
    await send({
      to: data.to,
      subject: `Re: ${esc(data.subject)}`,
      html: `
        <p>Bonjour ${esc(data.name)},</p>
        <p>Voici la réponse de notre équipe&nbsp;:</p>
        <p>${nl2br(esc(data.replyMessage))}</p>
        <br />
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
        <p style="color:#6b7280;font-size:13px">
          <strong>Message original&nbsp;:</strong><br />
          <em>Sujet&nbsp;:</em> ${esc(data.subject)}<br />
          <em>Message&nbsp;:</em> ${nl2br(esc(data.originalMessage ?? ''))}
        </p>
        <br />
        <p>Cordialement,<br />L'équipe Iz Academy</p>
      `,
    });
  },

};
