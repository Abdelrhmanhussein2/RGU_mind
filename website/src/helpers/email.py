import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from helpers.config import SMTP_HOST, SMTP_PORT_NUM, SMTP_USER, SMTP_PASSWORD


def send_otp_email(to_email: str, otp: str, purpose: str = "Registration") -> bool:
    print(f"[EMAIL] Attempting to send OTP to {to_email} via {SMTP_USER}@{SMTP_HOST}:{SMTP_PORT_NUM}")
    print(f"[EMAIL DEBUG] SMTP_USER is {'set' if SMTP_USER else 'NOT SET'}, SMTP_PASSWORD is {'set' if SMTP_PASSWORD else 'NOT SET'}")

    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[EMAIL WARNING] SMTP_USER or SMTP_PASSWORD not configured. Skipping email. OTP={otp}")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = f"ReguMind - {purpose} Verification Code"

        plain_text = f"ReguMind Verification Code\n\nThank you for using ReguMind.\nYour verification code for {purpose.lower()} is: {otp}\n\nThis code will expire in 5 minutes.\nIf you did not request this code, you can safely ignore this email."

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4f46e5;">ReguMind Verification Code</h2>
            <p>Thank you for using ReguMind.</p>
            <p>Your verification code for <strong>{purpose.lower()}</strong> is:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center;
                        font-size: 24px; font-weight: bold; letter-spacing: 5px;
                        border-radius: 8px; margin: 20px 0; color: #4f46e5;">
                {otp}
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
                If you did not request this code, you can safely ignore this email.
            </p>
        </body>
        </html>
        """
        msg.attach(MIMEText(plain_text, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT_NUM, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_email, msg.as_string())
        server.quit()
        print(f"[EMAIL] SUCCESS: Successfully sent OTP email to {to_email}")
        return True

    except Exception as e:
        print(f"[EMAIL ERROR] FAILED to send email to {to_email}: {type(e).__name__}: {e}")
        return False
