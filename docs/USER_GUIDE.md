# 📖 Keyper User Guide - Encrypted Credential Management

**Keyper Self-Hosted** provides secure, encrypted credential storage with a user-friendly interface. This guide will help you get started with managing your encrypted credentials safely.

*Made with ❤️ by Pink Pixel ✨*

---

## 🚀 Getting Started

### First-Time Setup

When you first open Keyper, you'll see the **Migration Wizard** that guides you through setting up encryption:

1. **Welcome Screen**: Shows your current credential statistics
2. **Create Master Passphrase**: Set up your encryption passphrase
3. **Confirm Passphrase**: Verify your passphrase was entered correctly
4. **Migration Review**: Review credentials that will be encrypted
5. **Migration Progress**: Watch as your credentials are encrypted
6. **Setup Complete**: Your vault is now ready!

### Choosing a Strong Passphrase

Your master passphrase is the key to all your encrypted data. Choose wisely:

✅ **Good Examples:**
- `MySecure!Keyper2025#Vault`
- `Coffee&Donuts@Midnight42!`
- `Purple$Elephant#Dancing99`

❌ **Avoid These:**
- `password123`
- `keyper`
- `123456789`
- Your name or birthday

**Passphrase Tips:**
- Use 15+ characters for best security
- Mix uppercase, lowercase, numbers, and symbols
- Avoid keyboard patterns (qwerty, 123456)
- Make it memorable but unique
- Never share it with anyone

---

## 🔐 Using the Vault

### Unlocking Your Vault

1. **Enter Passphrase**: Type your master passphrase
2. **Strength Meter**: Real-time feedback on passphrase strength
3. **Unlock**: Click "Unlock Vault" to access your credentials

**Auto-Lock Features:**
- 🕐 **15-minute timeout** (default) - vault locks automatically
- 🔄 **Activity extension** - using Keyper extends the timeout
- 🔒 **Manual lock** - click the lock button anytime

### Vault Status Indicator

The vault status appears in the top-right corner:

- 🟢 **Unlocked**: Green shield with countdown timer
- 🔴 **Locked**: Red lock icon
- ⏰ **Auto-lock timer**: Shows time until automatic lock

---

## 📝 Managing Encrypted Credentials

### Creating New Credentials

1. **Click "Add Credential"** from the dashboard
2. **Choose Security Level**:
   - 🔐 **Encrypted** (recommended): Data encrypted before storage
   - ⚠️ **Plaintext**: Data stored without encryption
3. **Fill in Details**:
   - **Title**: Descriptive name (e.g., "GitHub API Key")
   - **Type**: API Key, Login, Secret, Token, or Certificate
   - **Username**: Account username (if applicable)
   - **Secret Data**: The sensitive information to encrypt
4. **Add Metadata**:
   - **URL**: Associated website or service
   - **Category**: Organize your credentials
   - **Tags**: Additional labels for searching
   - **Notes**: Additional context or instructions
   - **Expiration**: Optional expiry date

### Viewing Encrypted Credentials

**Credential Cards** show:
- 📋 **Title and Type**: Quick identification
- 🏷️ **Category and Tags**: Organization labels
- 🔐 **Encryption Status**: Green shield (encrypted) or orange warning (plaintext)
- ⏰ **Last Updated**: When credential was modified

**Security Indicators:**
- 🛡️ **Green Shield**: Encrypted with Argon2id or PBKDF2
- ⚠️ **Orange Warning**: Stored as plaintext
- 🔒 **Lock Icon**: Vault must be unlocked to view

### Revealing Secret Data

1. **Click on a credential** to open details
2. **Unlock vault** if locked (red lock icon appears)
3. **Click the eye icon** 👁️ to reveal secret data
4. **Auto-hide timer** starts (30 seconds default)
5. **Copy button** 📋 appears for easy copying

**Security Features:**
- **Auto-hide**: Secrets automatically hide after 30 seconds
- **Copy protection**: Clipboard cleared after copying
- **Activity tracking**: All access logged for security

---

## 🔄 Migration & Compatibility

### Migrating Existing Data

If you have plaintext credentials, Keyper can encrypt them:

1. **Migration Wizard**: Appears automatically when needed
2. **Review Credentials**: See what will be encrypted
3. **Start Migration**: Click "Start Migration" to begin
4. **Progress Tracking**: Watch real-time progress
5. **Completion**: All credentials now encrypted

**Migration Features:**
- ✅ **Safe Process**: Original data backed up during migration
- 🔄 **Batch Processing**: Multiple credentials encrypted together
- 📊 **Progress Tracking**: Real-time status updates
- ❌ **Rollback**: Emergency rollback if needed (reduces security)

### Mixed Environments

Keyper supports both encrypted and plaintext credentials:

- 🔐 **Encrypted**: Secure, requires vault unlock
- ⚠️ **Plaintext**: Less secure, always accessible
- 📊 **Statistics**: Dashboard shows encryption percentage
- 🎯 **Recommendations**: Suggests encrypting plaintext data

---

## 🛡️ Security Best Practices

### Daily Usage

**DO:**
- ✅ Lock your vault when stepping away
- ✅ Use strong, unique passphrases
- ✅ Keep your browser updated
- ✅ Monitor failed login attempts
- ✅ Regularly review stored credentials

**DON'T:**
- ❌ Share your master passphrase
- ❌ Use Keyper on untrusted devices
- ❌ Leave vault unlocked unattended
- ❌ Store your passphrase in other apps
- ❌ Use weak or common passphrases

### Backup & Recovery

**Important**: There is no passphrase recovery!

**Backup Strategy:**
1. **Export encrypted data** regularly
2. **Store backups securely** (encrypted storage)
3. **Test restore process** periodically
4. **Document your passphrase** securely (offline)

**If You Lose Your Passphrase:**
- 🚨 All encrypted data becomes permanently inaccessible
- 🔄 You must start fresh with a new passphrase
- 📋 Re-enter all credentials manually
- 🛡️ This is intentional for maximum security

---

## 📊 Monitoring & Analytics

### Encryption Statistics

The dashboard shows:
- **Total Credentials**: All stored credentials
- **Encrypted**: Number using encryption
- **Plaintext**: Number without encryption
- **Encryption Percentage**: Overall security level

### Security Events

Keyper tracks security events:
- 🔓 **Vault Operations**: Unlock/lock events
- 🔐 **Encryption Activities**: Encrypt/decrypt operations
- ❌ **Failed Attempts**: Suspicious activity
- ⏱️ **Performance Metrics**: Operation timing

### Performance Monitoring

- **Encryption Speed**: Time to encrypt/decrypt
- **Key Derivation**: Argon2id vs PBKDF2 usage
- **Error Rates**: Failed operations
- **Activity Patterns**: Usage statistics

---

## 🔧 Troubleshooting

### Common Issues

**"Vault is Locked" Error:**
- 🔓 **Solution**: Enter your passphrase to unlock
- ⏰ **Cause**: Auto-lock timeout reached
- 🔄 **Prevention**: Extend timeout or disable auto-lock

**"Failed to Decrypt" Error:**
- 🔑 **Solution**: Verify correct passphrase
- 🔄 **Cause**: Wrong passphrase or corrupted data
- 🛠️ **Recovery**: Try backup data if available

**Slow Performance:**
- 🖥️ **Cause**: Argon2id is memory-intensive (this is normal)
- ⚡ **Fallback**: System automatically uses PBKDF2 if needed
- 🔧 **Solution**: Close other browser tabs to free memory

### Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Required Features:**
- Web Crypto API
- WebAssembly (for Argon2id)
- Local Storage
- Service Workers (for PWA)

---

## 🆘 Emergency Procedures

### Suspected Security Breach

1. **Immediate Actions:**
   - 🔒 Lock vault immediately
   - 🔄 Change master passphrase
   - 📋 Review recent activity logs
   - 🔍 Check for unauthorized access

2. **Assessment:**
   - 📊 Review security event logs
   - 🔍 Look for unusual patterns
   - ⏰ Check access times and locations
   - 📱 Verify all your devices

3. **Recovery:**
   - 🔑 Update all stored credentials
   - 🔄 Rotate API keys and passwords
   - 📧 Notify affected services
   - 🛡️ Strengthen security practices

### Data Recovery

**If Data Appears Lost:**
1. 🔍 Check if vault is locked (unlock first)
2. 🔄 Try refreshing the browser
3. 📂 Check browser local storage
4. 💾 Restore from backup if available
5. 📧 Contact support if needed

---

## 💡 Tips & Tricks

### Productivity Tips

- 🏷️ **Use Categories**: Organize credentials by service type
- 🔍 **Tag Everything**: Use tags for easy searching
- 📅 **Set Expiration Dates**: Track when credentials need renewal
- 📝 **Add Notes**: Include setup instructions or context
- 🔄 **Regular Cleanup**: Remove unused credentials

### Security Tips

- 🔐 **Encrypt Everything**: Convert all plaintext credentials
- ⏰ **Adjust Auto-lock**: Set timeout based on your usage
- 📊 **Monitor Statistics**: Keep encryption percentage high
- 🔍 **Review Logs**: Check for suspicious activity
- 💾 **Backup Regularly**: Export encrypted data frequently

### Advanced Features

- 🎨 **Custom Categories**: Create your own organization system
- 🏷️ **Smart Tags**: Use consistent tagging for better search
- 📊 **Bulk Operations**: Select multiple credentials for actions
- 🔄 **Import/Export**: Move data between instances
- 📱 **PWA Mode**: Install as desktop/mobile app

---

## 📞 Getting Help

### Documentation
- 📖 **User Guide**: This document
- 🔐 **Security Guide**: Detailed security information
- 🛠️ **API Documentation**: For developers
- 📋 **Changelog**: Version history and updates

### Support
- 💬 **GitHub Issues**: Report bugs and request features
- 📧 **Email**: admin@pinkpixel.dev
- 🌐 **Website**: pinkpixel.dev
- ☕ **Support**: buymeacoffee.com/pinkpixel

### Community
- 🐙 **GitHub**: github.com/pinkpixel-dev
- 💬 **Discord**: @sizzlebop
- 🐦 **Updates**: Follow for latest news

---

*This guide covers Keyper Self-Hosted v0.1.0*  
*Last updated: August 2025*

**Remember**: Your security is only as strong as your weakest link. Use strong passphrases, keep software updated, and follow security best practices! 🛡️✨
