import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, studentName, studentEmail } = body;

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Bug description is required' }, { status: 400 });
    }

    const subject = `🚨 New Bug Report from ${studentName || 'Anonymous'}`;
    const html = `
      <h2>New Bug Report</h2>
      <p><strong>Student:</strong> ${studentName || 'Anonymous'}</p>
      <p><strong>Email:</strong> ${studentEmail || 'N/A'}</p>
      <hr />
      <p><strong>Description:</strong></p>
      <div style="padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
        ${description.replace(/\n/g, '<br />')}
      </div>
      <hr />
      <p><small>Sent from GradeU Support Module at ${new Date().toLocaleString()}</small></p>
    `;

    // Send email to admin (using GMAIL_USER as receiver as well)
    const emailResult = await sendEmail(
      process.env.GMAIL_USER || 'smartgaurd123@gmail.com',
      subject,
      html
    );

    if (!emailResult.success) {
      console.error('Failed to send bug report email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send bug report via email. Please try again later.' },
        { status: 500 }
      );
    }

    console.log('Bug Report sent via email:', {
      studentName,
      studentEmail,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Bug report submitted successfully via email',
    });
  } catch (error) {
    console.error('Bug report API error:', error);
    return NextResponse.json({ error: 'Failed to submit bug report' }, { status: 500 });
  }
}
