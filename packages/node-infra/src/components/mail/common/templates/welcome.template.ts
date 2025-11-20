export const WELCOME_TEMPLATE = `<!doctype html>
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

      .link-fallback {
        margin-top: 24px;
        padding: 16px;
        background: #f9f9f9;
        border-radius: 6px;
        font-size: 14px;
        color: #737373;
      }

      .link-fallback a {
        color: #10b981;
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
        <h1>Welcome to {{appName}}</h1>
      </div>

      <div class="content">
        <p class="greeting">Hi {{username}},</p>

        <p>
          Thank you for joining {{appName}}. We're excited to have you on board and can't wait for
          you to explore everything we have to offer.
        </p>

        <p>To get started, please verify your email address by clicking the button below:</p>

        <div class="button-container">
          <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
        </div>

        <div class="link-fallback">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <a href="{{verificationUrl}}">{{verificationUrl}}</a>
        </div>
      </div>

      <div class="footer">
        <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
