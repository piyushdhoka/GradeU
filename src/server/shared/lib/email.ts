import nodemailer from 'nodemailer';
import { logger } from './logger.js';

/**
 * Sends an email using the configured SMTP settings.
 * @param to recipient email address
 * @param subject email subject
 * @param text plain text content
 * @param html optional html content
 */
export async function sendEmail(to: string, subject: string, text: string, html?: string) {
    logger.info(`Attempting to send email to: ${to} with subject: ${subject}`);
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;

    if (!user || !pass) {
        logger.warn('SMTP credentials not configured. Email will be logged but not sent.');
        logger.info(`EMAIL to ${to}: Subject: ${subject}. Content: ${text.substring(0, 100)}...`);
        return { success: false, message: 'SMTP not configured' };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass,
            },
        });

        const mailOptions = {
            from: `"GradeU" <${user}>`,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error(`Failed to send email to ${to}`, error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}
