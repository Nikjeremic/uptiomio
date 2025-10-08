# Uptiomio Payment Service - Production Deployment

## Verpex CPanel Deployment Instructions

### 1. Upload Files
Upload the following files to your Verpex hosting:

**Required Files:**
- `server.js` (main server file)
- `package.json` (dependencies)
- `package-lock.json` (lock file)
- `.env` (environment variables)
- `build/` folder (entire React build folder)
- `uploads/` folder (create empty folder if it doesn't exist)

**Optional Files:**
- `seed.js` (for seeding data)
- `verifyUser.js` (for user verification)

### 2. Environment Variables
Make sure these environment variables are set in your Verpex CPanel:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://uptime_User97_Masteradmin:SrD6z6JD2I198Ubv@uptimecluster.oghidga.mongodb.net/?retryWrites=true&w=majority&appName=UptimeCluster
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EMAIL_VERIFICATION_ENABLED=false
BACKEND_BASE_URL=https://payments.uptimio.com
FRONTEND_BASE_URL=https://payments.uptimio.com
REACT_APP_API_BASE_URL=https://payments.uptimio.com/api
```

### 3. Install Dependencies
In CPanel terminal, run:
```bash
npm install --production
```

### 4. Start Application
In CPanel terminal, run:
```bash
npm run start:prod
```

Or with PM2 (recommended):
```bash
npm install -g pm2
npm run pm2:start
```

### 5. Domain Configuration
Make sure your domain `payments.uptimio.com` points to your Verpex hosting.

### 6. SSL Certificate
Ensure SSL certificate is installed for HTTPS.

## File Structure on Server
```
/
├── server.js
├── package.json
├── package-lock.json
├── .env
├── build/
│   ├── index.html
│   ├── static/
│   │   ├── css/
│   │   └── js/
├── uploads/
└── node_modules/
```

## Testing
After deployment, test these endpoints:
- https://payments.uptimio.com/api/health
- https://payments.uptimio.com/ (main app)

## Troubleshooting
- Check server logs: `npm run pm2:logs`
- Restart app: `npm run pm2:restart`
- Check if all files are uploaded correctly
- Verify environment variables are set
- Check MongoDB connection
