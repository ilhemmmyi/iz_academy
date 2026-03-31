import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/email.queue';

export const ContactMessageService = {
  async submit(data: { name: string; email: string; subject: string; message: string }) {
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        subject: data.subject.trim(),
        message: data.message.trim(),
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { email: true },
    });

    const adminEmails = admins.map((admin) => admin.email).filter(Boolean);
    if (adminEmails.length > 0) {
      emailQueue.add('contact-notification', {
        to: adminEmails,
        contactMessageId: contactMessage.id,
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        message: contactMessage.message,
      }).catch((err) => console.error('Email queue error:', err));
    }

    return contactMessage;
  },

  getAll() {
    return prisma.contactMessage.findMany({
      include: {
        repliedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  },

  markRead(id: string) {
    return prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  },

  async reply(id: string, adminId: string, replyMessage: string) {
    const contactMessage = await prisma.contactMessage.findUnique({ where: { id } });
    if (!contactMessage) throw new Error('NOT_FOUND');

    const trimmedReply = replyMessage.trim();
    if (!trimmedReply) throw new Error('EMPTY_REPLY');

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        isRead: true,
        replyMessage: trimmedReply,
        repliedAt: new Date(),
        repliedById: adminId,
      },
      include: {
        repliedBy: { select: { id: true, name: true, email: true } },
      },
    });

    emailQueue.add('contact-reply', {
      to: updated.email,
      name: updated.name,
      subject: updated.subject,
      replyMessage: trimmedReply,
    }).catch((err) => console.error('Email queue error:', err));

    return updated;
  },
};