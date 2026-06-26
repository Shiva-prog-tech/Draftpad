import nodemailer from 'nodemailer';

function createTransporter() {
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (!user || !pass) {
    throw new Error('EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD must be set in .env.local');
  }

  // Use Gmail service preset — handles host/port/TLS automatically and works with app passwords
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendInviteEmail({
  to,
  inviterName,
  docTitle,
  role,
  acceptUrl,
}: {
  to: string;
  inviterName: string;
  docTitle: string;
  role: string;
  acceptUrl: string;
}) {
  const transporter = createTransporter();
  const fromUser = process.env.EMAIL_SERVER_USER!;
  const roleLabel = role === 'editor' ? 'edit' : 'view';

  await transporter.sendMail({
    // Gmail requires "from" to match the authenticated account
    from: `Draftpad <${fromUser}>`,
    to,
    subject: `${inviterName} invited you to collaborate on "${docTitle}"`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0A0A0B;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0B;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#6366F1;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;font-weight:700;line-height:36px;">D</span>
                  </td>
                  <td style="padding-left:10px;color:#fff;font-size:18px;font-weight:600;vertical-align:middle;letter-spacing:-0.3px;">
                    Draftpad
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#111113;border:1px solid #1F1F23;border-radius:16px;padding:36px 32px;">

              <p style="margin:0 0 8px;color:#A1A1AA;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">
                Document Invitation
              </p>
              <h1 style="margin:0 0 16px;color:#FFFFFF;font-size:22px;font-weight:700;line-height:1.3;">
                You've been invited to collaborate
              </h1>
              <p style="margin:0 0 24px;color:#71717A;font-size:15px;line-height:1.6;">
                <strong style="color:#E4E4E7;">${inviterName}</strong> has invited you to
                <strong style="color:#E4E4E7;">${roleLabel}</strong> the document
                <strong style="color:#E4E4E7;">"${docTitle}"</strong> on Draftpad.
              </p>

              <!-- Role badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:${role === 'editor' ? 'rgba(99,102,241,0.12)' : 'rgba(113,113,122,0.12)'};border:1px solid ${role === 'editor' ? 'rgba(99,102,241,0.3)' : 'rgba(113,113,122,0.3)'};border-radius:6px;padding:4px 12px;">
                    <span style="color:${role === 'editor' ? '#818CF8' : '#A1A1AA'};font-size:13px;font-weight:600;">
                      ${role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}"
                      style="display:inline-block;background:#6366F1;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;padding:14px 32px;letter-spacing:-0.2px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#3F3F46;font-size:12px;text-align:center;line-height:1.5;">
                This invite link expires in 48 hours.<br/>
                If you weren't expecting this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;color:#3F3F46;font-size:12px;">
                Draftpad &middot; Collaborative writing, simplified
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `${inviterName} invited you to ${roleLabel} "${docTitle}" on Draftpad.\n\nAccept the invitation: ${acceptUrl}\n\nThis link expires in 48 hours.`,
  });
}
