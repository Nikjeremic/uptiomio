# Verpex Email Setup Instructions

## 1. Email Configuration

The system is configured to use your Verpex Roundcube email:

**Email Settings:**
- **From:** invoices@uptimio.com
- **SMTP Host:** s1047.use1.mysecurecloudhost.com
- **SMTP Port:** 465 (SSL/TLS)
- **Username:** invoices@uptimio.com
- **Password:** Your email account password

## 2. Update .env file

Replace `your-email-password-here` in .env file with your actual email password:

```
SMTP_PASS=your-actual-email-password
```

## 3. Test Email

After setup, create an invoice and it will automatically send an email to the client from invoices@uptimio.com

## 4. Troubleshooting

- Check server logs for email errors
- Verify email password is correct
- Make sure invoices@uptimio.com email exists in your Verpex account
- Check if SMTP is enabled for your email account

## 5. Email Features

- ✅ Sends invoice notifications to clients
- ✅ Professional HTML email templates
- ✅ Includes company logo and signature
- ✅ Direct link to view invoice
