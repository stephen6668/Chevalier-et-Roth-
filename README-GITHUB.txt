# Chevalier & Roth — Simple GitHub Pages Website

This version is intentionally plain static HTML/CSS/JavaScript so GitHub Pages does not need to build anything.

## IMPORTANT: do not use GitHub Actions for this version

1. Upload ALL files from this folder directly into the ROOT of your repository.
2. Make sure `index.html` is directly visible in the repository root.
3. GitHub → Settings → Pages.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Branch: `main`
6. Folder: `/ (root)`
7. Save.

There is no `.github/workflows` folder in this package.

## Admin demo login
Email: admin@chevalier-roth.lu
Password: CR-Demo-2026

Important: because GitHub Pages is public static hosting, this password is not secure for a production shop. Admin changes are stored in your current browser only.

## Product images
Upload your JPG/PNG/WebP files to the repository root or create an `images` folder.
Then enter paths such as:
- images/polo-1.jpg
- images/polo-2.jpg

in the Admin product editor.
