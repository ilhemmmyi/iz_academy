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
  tls: {
    rejectUnauthorized: false, // allow self-signed / intermediate CA chains (Brevo, corporate proxies)
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

  async sendPasswordResetEmail(data: { to: string; name: string; token: string; frontendUrl: string }) {
    const link = `${data.frontendUrl}/reset-password?token=${data.token}`;
    await send({
      to: data.to,
      subject: 'Réinitialisation de votre mot de passe — IZ Academy',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
          <div style="background:#4f46e5;padding:32px;text-align:center;border-radius:8px 8px 0 0">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700">IZ Academy</h1>
          </div>
          <div style="padding:40px 32px">
            <h2 style="color:#111827;margin:0 0 16px">Réinitialisation du mot de passe</h2>
            <p style="color:#374151;margin:0 0 8px">Bonjour <strong>${esc(data.name)}</strong>,</p>
            <p style="color:#374151;margin:0 0 32px">
              Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte.<br />
              Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
            </p>
            <div style="text-align:center;margin:0 0 32px">
              <a href="${link}" style="background:#4f46e5;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:0 0 24px">
              <p style="color:#92400e;margin:0;font-size:14px">
                ⚠️ Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe ne sera pas modifié.
              </p>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
            <p style="color:#9ca3af;font-size:12px;margin:0">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
              <span style="color:#6b7280;word-break:break-all">${esc(link)}</span>
            </p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 8px 8px">
            <p style="color:#9ca3af;font-size:12px;margin:0">© 2026 IZ Academy. Tous droits réservés.</p>
          </div>
        </div>
      `,
    });
  },

  async sendVerificationEmail(data: { to: string; name: string; token: string; frontendUrl: string }) {
    const link = `${data.frontendUrl}/verify-email?token=${data.token}`;
    await send({
      to: data.to,
      subject: 'Vérifiez votre adresse email — IZ Academy',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#4f46e5">Bienvenue sur IZ Academy, ${esc(data.name)} !</h2>
          <p>Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte :</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}" style="background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Vérifier mon email
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">Ce lien expirera dans <strong>24 heures</strong>.</p>
          <p style="color:#6b7280;font-size:12px">Si vous n'avez pas créé de compte, ignorez cet email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
          <p style="color:#9ca3af;font-size:11px">Ou copiez ce lien dans votre navigateur :<br />${esc(link)}</p>
        </div>
      `,
    });
  },

  async sendNewCoursePublished(data: {
    email: string;
    name: string;
    courseTitle: string;
    courseDescription: string;
    courseId: string;
    frontendUrl: string;
  }) {
    const courseUrl = `${data.frontendUrl}/course/${esc(data.courseId)}`;
    await send({
      to: data.email,
      subject: `Nouveau cours disponible — ${esc(data.courseTitle)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
          <div style="background:#4f46e5;padding:32px;text-align:center;border-radius:8px 8px 0 0">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700">IZ Academy</h1>
          </div>
          <div style="padding:40px 32px">
            <h2 style="color:#111827;margin:0 0 16px">Nouveau cours disponible !</h2>
            <p style="color:#374151;margin:0 0 8px">Bonjour <strong>${esc(data.name)}</strong>,</p>
            <p style="color:#374151;margin:0 0 24px">
              Un nouveau cours vient d'être mis en ligne sur <strong>IZ Academy</strong> :
            </p>
            <div style="background:#f3f4f6;border-left:4px solid #4f46e5;border-radius:0 8px 8px 0;padding:20px;margin:0 0 32px">
              <h3 style="color:#4f46e5;margin:0 0 8px;font-size:18px">${esc(data.courseTitle)}</h3>
              <p style="color:#6b7280;margin:0;font-size:14px;line-height:1.5">${esc(data.courseDescription)}</p>
            </div>
            <div style="text-align:center;margin:0 0 32px">
              <a href="${courseUrl}" style="background:#4f46e5;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">
                Voir le cours →
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
            <p style="color:#9ca3af;font-size:12px;margin:0">
              Si le bouton ne fonctionne pas, copiez ce lien :<br />
              <span style="color:#6b7280;word-break:break-all">${courseUrl}</span>
            </p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-radius:0 0 8px 8px">
            <p style="color:#9ca3af;font-size:12px;margin:0">© 2026 IZ Academy. Tous droits réservés.</p>
          </div>
        </div>
      `,
    });
  },

  async sendTeacherCreated(data: { email: string; name: string; frontendUrl: string }) {
    await send({
      to: data.email,
      subject: 'Votre compte formateur IZ Academy a été créé',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#4f46e5">Bonjour ${esc(data.name)},</h2>
          <p>Un administrateur vient de créer votre compte formateur sur <strong>IZ Academy</strong>.</p>
          <p>Vous pouvez vous connecter dès maintenant avec votre adresse email et le mot de passe temporaire qui vous a été communiqué.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${esc(data.frontendUrl)}/login" style="background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Se connecter
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">
            Vous devrez changer votre mot de passe temporaire lors de votre première connexion.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
          <p style="color:#9ca3af;font-size:11px">Si vous n'attendiez pas ce message, contactez votre administrateur.</p>
        </div>
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
        <p>Cordialement,<br />L'équipe IZ Academy</p>
      `,
    });
  },

};
