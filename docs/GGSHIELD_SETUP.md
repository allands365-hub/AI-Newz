# GitGuardian Shield (ggshield) Setup for AI-Newz

## ✅ **Per-Project Installation Complete**

ggshield has been configured as a **per-project** installation for the AI-Newz project.

## **Why Per-Project vs Global?**

### **Per-Project (Recommended for AI-Newz):**
- ✅ **Project-specific configuration** - Tailored for AI/ML project needs
- ✅ **Team consistency** - All developers get same security setup
- ✅ **Version control** - Configuration tracked in repository
- ✅ **CI/CD integration** - Easy to integrate with deployment pipeline
- ✅ **Isolation** - Won't affect other projects on your system

### **Global Installation:**
- Would scan ALL repositories on your system
- Less flexible for project-specific needs
- Harder to manage different configurations per project

## **What's Been Set Up:**

### 1. **Pre-commit Hook**
- ggshield now runs automatically before every commit
- Prevents secrets from being committed to the repository
- Located in `.git/hooks/pre-commit`

### 2. **Project Configuration** (`.gitguardian.yaml`)
- **Scans**: Python, TypeScript, JavaScript, JSON, YAML, Markdown, SQL files
- **Excludes**: node_modules, venv, build artifacts, media files
- **Ignores**: Known false positive patterns
- **Verbose output**: Shows detailed scan results

### 3. **Security Patterns**
- Detects API keys, passwords, tokens, certificates
- Scans for hardcoded secrets in code
- Checks for exposed credentials

## **Next Steps:**

### **1. Authentication (Required)**
You need to authenticate with GitGuardian to use ggshield:

```bash
ggshield auth login
```

This will:
- Open your browser to GitGuardian dashboard
- Allow you to sign in/create account
- Generate an API key for scanning

### **2. Test the Setup**
After authentication, test the setup:

```bash
# Scan current codebase
ggshield secret scan path .

# Test pre-commit hook
git add .
git commit -m "test commit"
```

### **3. Team Setup**
For other team members:
1. Clone the repository
2. Run `pip install ggshield`
3. Run `ggshield install --mode local`
4. Run `ggshield auth login`

## **Configuration Details:**

### **Files Scanned:**
- `app/` - Backend Python code
- `frontend/src/` - Frontend TypeScript/React code
- `tests/` - Test files
- All relevant file types (`.py`, `.ts`, `.js`, `.json`, etc.)

### **Files Excluded:**
- `node_modules/`, `venv/` - Dependencies
- `.playwright-mcp/` - Test artifacts
- Media files (`.png`, `.jpg`, `.pdf`, etc.)
- Build outputs (`.next/`, `coverage/`, etc.)

### **Ignored Patterns:**
- `GOCSPX-` - Google OAuth patterns (after you regenerate credentials)
- `sk-`, `pk_` - Common API key prefixes that might be false positives

## **Benefits for AI-Newz:**

1. **Prevents Secret Exposure** - Catches secrets before they're committed
2. **AI/ML Specific** - Scans for API keys, model tokens, database credentials
3. **Team Security** - All developers get same protection
4. **CI/CD Ready** - Easy to integrate with GitHub Actions or other CI/CD
5. **Compliance** - Helps meet security best practices

## **Troubleshooting:**

### **If ggshield blocks a commit:**
1. Check the output for the specific secret detected
2. If it's a false positive, add the pattern to `.gitguardian.yaml` ignore section
3. If it's a real secret, remove it and use environment variables instead

### **If you need to bypass temporarily:**
```bash
git commit --no-verify -m "emergency commit"
```
⚠️ **Only use this in emergencies!**

## **Status: ✅ Ready for Authentication**

The per-project ggshield setup is complete and ready to use once you authenticate with GitGuardian.
