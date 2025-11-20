export const PASSWORD_RESET_TEMPLATE = `<!doctype html>
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

      .button-container {
        text-align: center;
        margin: 32px 0;
      }

      .button {
        display: inline-block;
        padding: 14px 32px;
        background: #1a1a1a;
        color: #ffffff;
        text-decoration: none;
        font-weight: 500;
        font-size: 16px;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .button:hover {
        background: #404040;
      }

      .warning {
        margin: 24px 0;
        padding: 16px 20px;
        background: #fef2f2;
        border-left: 4px solid #ef4444;
        border-radius: 6px;
      }

      .warning-title {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #991b1b;
        margin-bottom: 8px;
        font-size: 15px;
      }

      .warning-icon {
        margin-right: 8px;
        font-size: 18px;
      }

      .warning p {
        margin: 0;
        font-size: 14px;
        color: #7f1d1d;
      }

      .expiry-notice {
        margin: 20px 0;
        padding: 12px 16px;
        background: #f9f9f9;
        border-radius: 6px;
        font-size: 14px;
        color: #737373;
        text-align: center;
      }

      .link-fallback {
        margin-top: 24px;
        padding: 16px;
        background: #f9f9f9;
        border-radius: 6px;
        font-size: 14px;
        color: #737373;
      }

      .link-fallback a {
        color: #1a1a1a;
        text-decoration: none;
        word-break: break-all;
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
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>

      <div class="content">
        <p class="greeting">Hi {{username}},</p>

        <p>
          We received a request to reset the password for your {{appName}} account. If you made
          this request, click the button below to create a new password.
        </p>

        <div class="button-container">
          <a href="{{resetUrl}}" class="button">Reset Password</a>
        </div>

        <div class="expiry-notice">This link will expire in {{expiryHours}} hours</div>

        <div class="warning">
          <div class="warning-title">
            <span class="warning-icon">⚠</span>
            Security Notice
          </div>
          <p>
            If you didn't request this password reset, please ignore this email. Your password will
            remain unchanged and your account is safe.
          </p>
        </div>

        <div class="link-fallback">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <a href="{{resetUrl}}">{{resetUrl}}</a>
        </div>
      </div>

      <div class="footer">
        <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
