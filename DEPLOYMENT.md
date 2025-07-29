# 🚀 Deployment Guide - GitHub Pages

## Quick Setup (5 minutes)

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Name it: `lending-management-system`
4. Make it **Public** (required for free GitHub Pages)
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### 2. Upload Your Code
**Option A: Using GitHub Desktop (Recommended)**
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Clone your repository
3. Copy all files from your local folder to the repository folder
4. Commit and push

**Option B: Using Git Commands**
```bash
# In your project folder
git init
git add .
git commit -m "Initial commit - Lending Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lending-management-system.git
git push -u origin main
```

**Option C: Drag & Drop (Easiest)**
1. Go to your repository on GitHub
2. Click "uploading an existing file"
3. Drag all your files (index.html, styles.css, script.js, README.md)
4. Click "Commit changes"

### 3. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch
6. Click "Save"

### 4. Your Site is Live! 🎉
Your lending system will be available at:
`https://YOUR_USERNAME.github.io/lending-management-system`

## 🔧 Custom Domain (Optional)
If you have a domain name:
1. Add your domain to the `CNAME` file
2. Go to repository Settings → Pages
3. Add your custom domain
4. Update your DNS settings with your domain provider

## 📱 Access Your Application
- **URL**: `https://YOUR_USERNAME.github.io/lending-management-system`
- **Login**: admin / admin123
- **Works on**: Desktop, tablet, mobile

## 🔒 Security Notes
- Data is stored in browser's local storage
- Each user's data is separate
- No server-side storage (perfect for GitHub Pages)

## 🚀 Alternative: Netlify (More Features)
1. Go to [Netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Choose your repository
5. Deploy automatically

## 📞 Support
- GitHub Pages: [Pages Documentation](https://pages.github.com/)
- Netlify: [Netlify Docs](https://docs.netlify.com/)

---
**Your lending management system is now ready for the world! 🌍** 