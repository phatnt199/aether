export const VERIFY_EMAIL_TEMPLATE = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
          Arial, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        background-color: #f5f5f5;
        padding: 20px;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e5e5e5;
      }

      .header {
        padding: 48px 32px;
        text-align: center;
        border-bottom: 1px solid #e5e5e5;
      }

      .header h1 {
        font-size: 28px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
        letter-spacing: -0.5px;
      }

      .content {
        padding: 48px 32px;
      }

      .content p {
        margin: 0 0 20px;
        font-size: 16px;
        color: #404040;
      }

      .content p:last-child {
        margin-bottom: 0;
      }

      .greeting {
        font-size: 18px;
        font-weight: 500;
        color: #1a1a1a;
      }

      .code-container {
        margin: 32px 0;
        text-align: center;
      }

      .code-label {
        font-size: 14px;
        color: #737373;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 500;
      }

      .code {
        display: inline-block;
        font-size: 36px;
        font-weight: 700;
        letter-spacing: 8px;
        color: #1a1a1a;
        background: #ffffff;
        padding: 20px 40px;
        border: 2px solid #e5e5e5;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
      }

      .divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin: 32px 0;
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid #e5e5e5;
      }

      .divider span {
        padding: 0 16px;
        font-size: 13px;
        color: #a3a3a3;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .button-container {
        text-align: center;
        margin: 32px 0;
      }

      .button {
        display: inline-block;
        padding: 14px 32px;
        background: #10b981;
        color: #ffffff;
        text-decoration: none;
        font-weight: 500;
        font-size: 16px;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .button:hover {
        background: #059669;
      }

      .expiry-notice {
        margin: 24px 0;
        padding: 12px 16px;
        background: #f9f9f9;
        border-radius: 6px;
        font-size: 14px;
        color: #737373;
        text-align: center;
      }

      .footer {
        padding: 32px;
        text-align: center;
        border-top: 1px solid #e5e5e5;
        background: #fafafa;
      }

      .footer p {
        margin: 0;
        font-size: 13px;
        color: #737373;
      }

      @media only screen and (max-width: 600px) {
        body {
          padding: 0;
        }

        .container {
          border: none;
        }

        .header,
        .content,
        .footer {
          padding-left: 24px;
          padding-right: 24px;
        }

        .code {
          font-size: 28px;
          letter-spacing: 6px;
          padding: 16px 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Verify Your Email</h1>
      </div>

      <div class="content">
        <p class="greeting">Hi {{username}},</p>

        <p>
          To complete your {{appName}} account setup, please verify your email address using the
          verification code below:
        </p>

        <div class="code-container">
          <div class="code-label">Verification Code</div>
          <div class="code">{{verificationCode}}</div>
        </div>

        <div class="expiry-notice">This code will expire in {{expiryMinutes}} minutes</div>

        <div class="divider">
          <span>or</span>
        </div>

        <p style="text-align: center; margin-bottom: 16px">
          Click the button below to verify instantly:
        </p>

        <div class="button-container">
          <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
        </div>
      </div>

      <div class="footer">
        <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
