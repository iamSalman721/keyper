# 🔐 Keyper - Self-Hosted Credential Management

<div align="center">

<img src="./public/logo.png" alt="Keyper Logo" width="300" />

**✨ Your Credentials. Your Security. Your Rules. ✨**

[![Version](https://img.shields.io/npm/v/@pinkpixel/keyper?style=for-the-badge&color=06B6D4)](https://www.npmjs.com/package/@pinkpixel/keyper)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge)](https://web.dev/progressive-web-apps/)

*A modern, secure, self-hosted credential management application for storing and organizing your digital credentials with complete privacy and control.*

[🚀 Quick Start](#-quick-start) • [📦 Installation](#-installation) • [🗄️ Setup](#️-database-setup) • [📱 PWA](#-progressive-web-app) • [🔧 Troubleshooting](#-troubleshooting)

</div>

---

## 🌟 Features

### 🔒 **Secure Credential Storage**

* 🔑 **API Keys** - Store and organize your API credentials
* 🔐 **Login Credentials** - Username/password combinations
* 🤫 **Secrets** - Sensitive configuration values
* 🎫 **Tokens** - Authentication and access tokens
* 📜 **Certificates** - SSL certificates and keys

### 🏷️ **Smart Organization**

* 📂 **Categories** - Group credentials by service or type
* 🔖 **Tags** - Flexible labeling system
* ⚡ **Priority Levels** - Low, Medium, High, Critical
* 📅 **Expiration Tracking** - Never miss renewal dates
* 🔍 **Real-time Search** - Find credentials instantly

### 🛡️ **Enterprise-Grade Security**

* 🔒 **Row Level Security (RLS)** - Database-level isolation
* 🔐 **End-to-End Encryption** - Client-side encryption, zero-knowledge architecture
* 👤 **Multi-User Support** - Support for multiple users on the same instance
* 🌐 **Secure Connections** - HTTPS/TLS encryption
* 🏠 **Self-Hosted** - Complete control over your data

### 🔐 **Advanced Encryption Features**

* **Zero-Knowledge Architecture** - All encryption happens client-side
* **AES-256-GCM Encryption** - Industry-standard authenticated encryption
* **Argon2id Key Derivation** - Memory-hard, ASIC-resistant (with PBKDF2 fallback)
* **Auto-Lock Protection** - 15-minute inactivity timeout with activity detection
* **Master Passphrase Protection** - Single passphrase unlocks your encrypted vault
* **Database-Only Storage** - No localStorage usage except for database config
* **Professional Security Audit** - EXCELLENT security rating

### 📱 **Modern Experience**

* 🌙 **Dark Theme** - Easy on the eyes
* 📱 **Responsive Design** - Works on all devices
* ⚡ **Progressive Web App** - Install like a native app
* 🚀 **Fast Performance** - Built with Vite and React 19
* 🎨 **Beautiful UI** - Modern glassmorphism design

---

## 🚀 Quick Start

Get Keyper running on your own infrastructure in under 5 minutes!

### Prerequisites

* **Node.js 18+** installed on your system
* **Supabase account** (free tier works perfectly!)
* **Modern web browser** (Chrome, Firefox, Safari, Edge)

### ⚡ 1-Minute Installation

```bash
# Install Keyper globally
npm install -g @pinkpixel/keyper

# Start the server (default port 4173)
keyper

# Or start with custom port
keyper --port 3000

# Open in your browser
# 🌐 http://localhost:4173 (or your custom port)
```

**That's it!** 🎉 Follow the in-app setup wizard to configure your Supabase database.

### 🌐 Try the Demo

**Want to try Keyper before installing?** Visit our hosted demo:

**🔗** [**keyper.pinkpixel.dev**](https://keyper.pinkpixel.dev)

Just enter your own Supabase credentials and start managing your encrypted credentials instantly! Your data stays completely private since all encryption happens in your browser.

**Demo Usage:**

* ✅ **Completely Secure** - Zero-knowledge architecture means your data never leaves your browser
* ✅ **Real Functionality** - Full Keyper experience with your own Supabase instance
* ✅ **No Registration** - Just bring your Supabase URL and anon key
* ⚠️ **Demo Limitations** - Recommended for testing and light usage only
* 🏠 **Self-Host for Production** - Install locally for best performance and full control

*Note: The demo uses the same secure architecture as self-hosted Keyper. Your Supabase credentials are stored only in your browser's localStorage and never transmitted to our servers.*

---

## 📦 Installation

### Method 1: Global NPM Installation (Recommended)

```bash
npm install -g @pinkpixel/keyper
```

**Available Commands:**

* `keyper` - Start Keyper server
* `keyper --port 3000` - Start on custom port
* `keyper --help` - Show help and usage
* `credential-manager` - Alternative command
* `keyper-dashboard` - Another alternative

### Method 2: NPX (No Installation Required)

```bash
npx @pinkpixel/keyper
```

### Method 3: Local Development

```bash
git clone https://github.com/pinkpixel-dev/keyper.git
cd keyper
npm install
npm run build
npm start
```

---

## 🗄️ Database Setup

### Step 1: Create Your Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Configure your project:

   * **Name**: `keyper-db` (or your preference)
   * **Database Password**: Generate a strong password
   * **Region**: Choose closest to your location

4. Wait 1-2 minutes for setup completion

### Step 2: Get Your Credentials

1. In Supabase dashboard: **Settings** → **API**
2. Copy these values:

   * **Project URL**: `https://your-project.supabase.co`
   * **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **Important**: Use the **anon/public** key, NOT the service\_role key!

### Step 3: Configure Keyper

1. Start Keyper: `keyper`
2. Open [http://localhost:4173](http://localhost:4173)
3. **Database Setup**: Configure your Supabase connection

   * Enter your Supabase URL and anon key
   * Copy and run the complete SQL setup script in Supabase SQL Editor
   * Test the connection

4. **Master Passphrase**: Create your encryption passphrase

   * Choose a strong passphrase (8+ characters recommended)
   * This encrypts all your credentials client-side

5. **Start Managing**: Add your first encrypted credential! 🎉

---

## 📱 Progressive Web App

Keyper works as a Progressive Web App for a native app experience!

### 🖥️ Desktop Installation

1. Open Keyper in Chrome/Edge/Firefox
2. Look for the install icon in the address bar
3. Click to install as a desktop app
4. Access from your applications menu

### 📱 Mobile Installation

1. Open Keyper in your mobile browser
2. Tap the browser menu (⋮)
3. Select **"Add to Home Screen"** or **"Install App"**
4. Access from your home screen

### ✨ PWA Benefits

* 📱 Native app experience
* 🚀 Faster loading times
* 🌐 Offline functionality
* 🔄 Background updates
* 📲 Push notifications (coming soon)

---

## 🔧 Troubleshooting

### Common Issues

**❌ "Connection failed: Database connection failed"**

* Verify Supabase URL format: `https://your-project.supabase.co`
* Use **anon/public** key, not service\_role
* Check that your Supabase project is active

**❌ "relation 'credentials' does not exist"**

* Run the complete SQL setup script in Supabase SQL Editor
* Ensure the script completed without errors

**❌ Dashboard shows "No credentials found"**

* Click **"Refresh App"** button
* Clear browser cache and reload
* For PWA: Uninstall and reinstall the app

**❌ Can't enter new credentials after clearing configuration**

* Refresh the page after clearing configuration
* Ensure you're typing in the correct URL format: `https://your-project.supabase.co`
* Try clearing browser cache if form inputs appear stuck

**❌ Categories dropdown is empty when using custom username**

* This issue has been resolved in the latest version
* Categories should now appear for all usernames (both default and custom)
* If still experiencing issues, try refreshing the page after setting your username

**❌ App doesn't show setup wizard after clearing database**

* Clear browser cache and cookies for the site
* For Chrome/Edge: Settings → Privacy → Clear browsing data → Cookies and cached files
* For Firefox: Settings → Privacy → Clear Data → Cookies and Site Data + Cached Web Content
* Refresh the page to see the initial setup screen

**❌ Stuck in configuration loops or can't access settings**

* Keyper includes advanced diagnostic capabilities for troubleshooting
* If you're unable to reach the settings page or are stuck in authentication loops
* Enhanced error recovery system can help resolve configuration conflicts
* Database health checks available to verify table integrity

**❌ Multi-user vault conflicts**

* Use the diagnostic tools to check vault state isolation
* Clear specific user configurations without affecting others
* Verify database table health after user switching
* Professional recovery procedures available for complex scenarios

### Getting Help

1. Check the [Self-Hosting Guide](SELF-HOSTING.md)
2. Review browser console for errors (F12 → Console)
3. Verify Supabase project logs
4. Use built-in diagnostic tools for configuration issues
5. **Advanced diagnostic help is available for administrators; contact support.**
6. **Enterprise Support**: Advanced troubleshooting procedures available for authorized administrators
7. Report issues on [GitHub](https://github.com/pinkpixel-dev/keyper/issues)

---

---

## 🛡️ Security  Privacy

### Your Data, Your Control

* ✅ **Self-Hosted** - Run on your own infrastructure
* ✅ **Private Database** - Your Supabase instance
* ✅ **No Tracking** - Zero telemetry or analytics
* ✅ **Open Source** - Fully auditable code

### Security Features

* 🔒 **Row Level Security** - Database-level access control
* 🔐 **Encryption** - Data encrypted at rest and in transit
* 👤 **User Isolation** - Each user sees only their data
* 🛡️ **Secure Authentication** - Supabase Auth integration

### Multi-User Notes

* **User Switching**: When switching between different user accounts, refresh the page after logging out to ensure proper vault isolation
* **Optimal Experience**: This ensures clean cryptographic state and prevents any potential vault conflicts between users

---

## 🚀 Tech Stack

* **Frontend**: React 19.1 + TypeScript
* **Build Tool**: Vite 7.0
* **Styling**: Tailwind CSS + shadcn/ui
* **Backend**: Supabase (PostgreSQL + Auth)
* **State Management**: TanStack Query
* **Forms**: React Hook Form + Zod
* **PWA**: Vite PWA Plugin + Workbox

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## Made with 💖

**Created by Pink Pixel** ✨  
*Dream it, Pixel it*

* 🌐 **Website**: [pinkpixel.dev](https://pinkpixel.dev)
* 📧 **Email**: [admin@pinkpixel.dev](mailto:admin@pinkpixel.dev)
* 💬 **Discord**: @sizzlebop
* ☕ **Support**: [Buy me a coffee](https://www.buymeacoffee.com/pinkpixel)

---

<div align="center">

**⭐ Star this repo if Keyper helps secure your digital life! ⭐**

</div>

