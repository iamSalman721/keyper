# 🤝 Contributing to Keyper

> **Thank you for your interest in contributing to Keyper!** 
> 
> Made with ❤️ by Pink Pixel - Dream it, Pixel it ✨

We welcome contributions from the community and are excited to see what you'll bring to this self-hosted credential management project!

## 📋 Table of Contents

- [🚀 Getting Started](#-getting-started)
- [🛠️ Development Setup](#️-development-setup)
- [📝 How to Contribute](#-how-to-contribute)
- [🐛 Reporting Bugs](#-reporting-bugs)
- [💡 Suggesting Features](#-suggesting-features)
- [📖 Documentation](#-documentation)
- [🔍 Code Review Process](#-code-review-process)
- [📏 Style Guidelines](#-style-guidelines)
- [🧪 Testing](#-testing)
- [📄 License](#-license)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** installed
- **Git** for version control
- **Supabase account** for testing (free tier works)
- **Modern code editor** (VS Code recommended)

### First Time Setup
1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/keyper.git
   cd keyper
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/pinkpixel-dev/keyper.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

---

## 🛠️ Development Setup

### Project Structure
```
keyper/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Supabase integration
│   ├── lib/                # Utility functions
│   └── pages/              # Page components
├── bin/                    # CLI binary
├── public/                 # Static assets
├── supabase/              # Database configuration
└── docs/                  # Documentation
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm start           # Start CLI server
```

### Environment Setup
1. Create `.env.local` file (optional for development):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```
2. Set up your Supabase test database using `supabase-setup.sql`

---

## 📝 How to Contribute

### 1. Choose an Issue
- Browse [open issues](https://github.com/pinkpixel-dev/keyper/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Your Changes
- Write clean, readable code
- Follow our [style guidelines](#-style-guidelines)
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes
```bash
npm run lint        # Check code style
npm run build       # Ensure it builds
npm start          # Test the CLI
```

### 5. Commit Your Changes
```bash
git add .
git commit -m "feat: add new credential export feature"
```

**Commit Message Format:**
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 6. Push and Create PR
```bash
git push origin feature/your-feature-name
```
Then create a Pull Request on GitHub with:
- Clear title and description
- Reference any related issues
- Screenshots for UI changes
- Testing instructions

---

## 🐛 Reporting Bugs

### Before Reporting
1. **Search existing issues** to avoid duplicates
2. **Test with latest version** to ensure bug still exists
3. **Check the troubleshooting guide** in README.md

### Bug Report Template
```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 10, macOS 12]
- Browser: [e.g. Chrome 96, Firefox 95]
- Keyper Version: [e.g. 0.1.0]
- Node.js Version: [e.g. 18.17.0]

**Additional Context**
Any other context about the problem.
```

---

## 💡 Suggesting Features

We love new ideas! Before suggesting a feature:

1. **Check existing issues** for similar requests
2. **Consider the scope** - does it fit Keyper's mission?
3. **Think about implementation** - how would it work?

### Feature Request Template
```markdown
**Feature Description**
A clear description of what you want to happen.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How would you like it to work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Screenshots, mockups, or examples.
```

---

## 📖 Documentation

### Types of Documentation
- **README.md** - Main project documentation
- **SELF-HOSTING.md** - Self-hosting guide
- **Code Comments** - Inline documentation
- **JSDoc** - Function/component documentation

### Documentation Guidelines
- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep it up-to-date with code changes
- Use emojis and formatting for readability

---

## 🔍 Code Review Process

### What We Look For
- ✅ **Functionality** - Does it work as intended?
- ✅ **Code Quality** - Is it clean and maintainable?
- ✅ **Performance** - Does it impact app performance?
- ✅ **Security** - Are there any security concerns?
- ✅ **Tests** - Are there adequate tests?
- ✅ **Documentation** - Is it properly documented?

### Review Timeline
- **Initial Review**: Within 2-3 days
- **Follow-up**: Within 1-2 days after changes
- **Merge**: After approval from maintainers

---

## 📏 Style Guidelines

### Code Style
- **ESLint** configuration enforces most rules
- **TypeScript** for type safety
- **Prettier** for code formatting (if configured)

### React/TypeScript Guidelines
```typescript
// Use functional components with hooks
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<string>('');
  
  return (
    <div className="my-component">
      {/* Component content */}
    </div>
  );
};

// Export at bottom of file
export default MyComponent;
```

### CSS/Styling
- Use **Tailwind CSS** classes
- Follow **mobile-first** responsive design
- Use **semantic class names** when custom CSS is needed
- Maintain **dark theme** compatibility

### File Naming
- **Components**: `PascalCase.tsx`
- **Hooks**: `use-kebab-case.ts`
- **Utils**: `kebab-case.ts`
- **Pages**: `PascalCase.tsx`

---

## 🧪 Testing

### Testing Strategy
- **Unit Tests** - Individual functions/components
- **Integration Tests** - Component interactions
- **E2E Tests** - Full user workflows (future)

### Running Tests
```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```

### Writing Tests
- Test user interactions, not implementation details
- Use descriptive test names
- Mock external dependencies (Supabase)
- Test error states and edge cases

---

## 📄 License

By contributing to Keyper, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

---

## 🎉 Recognition

Contributors will be:
- **Listed** in our contributors section
- **Mentioned** in release notes for significant contributions
- **Invited** to our contributor Discord channel
- **Thanked** publicly on social media

---

## 💬 Questions?

- 📧 **Email**: [admin@pinkpixel.dev](mailto:admin@pinkpixel.dev)
- 💬 **Discord**: @sizzlebop
- 🐛 **Issues**: [GitHub Issues](https://github.com/pinkpixel-dev/keyper/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/pinkpixel-dev/keyper/discussions)

---

**Thank you for contributing to Keyper!** 🚀

**Made with ❤️ by Pink Pixel** ✨  
*Dream it, Pixel it*
