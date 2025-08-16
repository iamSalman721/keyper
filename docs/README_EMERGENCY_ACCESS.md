# 🚨 Emergency Access Documentation

This directory contains **encrypted operational documentation** for Keyper emergency procedures.

## 🔐 **Files Available**
- `CONFIDENTIAL.md.gpg` - Engineering implementation guide (development)
- `EMERGENCY_ADMIN_GUIDE.md.gpg` - Administrator operational procedures (support)

## 🔑 **Decryption Instructions**

### For Administrators with GPG Keys:
```bash
# Decrypt and view
gpg --decrypt CONFIDENTIAL.md.gpg | less

# Decrypt to file (temporary)
gpg --decrypt CONFIDENTIAL.md.gpg > /tmp/emergency_access.md
```

### Key Recipients:
- Pink Pixel (admin@pinkpixel.dev)
- [Add other authorized administrators here]

## ⚠️ **Security Notes**
- **Never commit plaintext versions** of emergency procedures
- **Keep decryption keys secure** and separate from this repository
- **Rotate encryption keys periodically**
- **Audit access** to encrypted documentation

## 📞 **Emergency Contact**
If you need access but cannot decrypt these files, contact:
- **Email**: admin@pinkpixel.dev
- **Discord**: @sizzlebop

---

**Made with ❤️ by Pink Pixel** ✨  
*Dream it, Pixel it*
