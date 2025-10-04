# CodeCollab Render Deployment Script for Windows

Write-Host "🚀 Preparing CodeCollab for Render Deployment" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check if remote origin exists
try {
    git remote get-url origin | Out-Null
    Write-Host "✅ Git repository detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: No remote origin set. Please add your GitHub repository:" -ForegroundColor Red
    Write-Host "   git remote add origin https://github.com/yourusername/codecollab.git" -ForegroundColor Yellow
    exit 1
}

# Add all deployment files
Write-Host "📁 Adding deployment files..." -ForegroundColor Yellow
git add .
git add render.yaml
git add docker-compose.render.yml
git add backend/Dockerfile.prod
git add backend/app.py
git add frontend/frontend/Dockerfile.prod
git add frontend/frontend/nginx.conf
git add RENDER-DEPLOYMENT-GUIDE.md

# Commit changes
Write-Host "💾 Committing deployment configuration..." -ForegroundColor Yellow
$commitMessage = @"
Add Render deployment configuration

- Add render.yaml blueprint
- Add production Dockerfiles
- Add nginx configuration for frontend
- Add deployment documentation
- Configure environment variables for Render
- Set up proper port handling for cloud deployment
"@

git commit -m $commitMessage

# Push to repository
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
try {
    git push origin main
} catch {
    try {
        git push origin master
    } catch {
        Write-Host "❌ Failed to push. Please check your git configuration." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Repository updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Click 'New' → 'Blueprint'" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Select your CodeCollab repository" -ForegroundColor White
Write-Host "5. Render will read render.yaml and deploy both services" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed instructions, see: RENDER-DEPLOYMENT-GUIDE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌍 Your app will be available at:" -ForegroundColor Cyan
Write-Host "   Frontend: https://codecollab-frontend.onrender.com" -ForegroundColor Green
Write-Host "   Backend:  https://codecollab-backend.onrender.com" -ForegroundColor Green