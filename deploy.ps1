# Keyper Deployment Script for Cloudflare Pages
# Made with ❤️ by Pink Pixel
# PowerShell script for Windows deployment

param(
    [string]$Environment = "production",
    [switch]$Preview,
    [switch]$Help
)

# Colors for output
$ColorReset = "`e[0m"
$ColorRed = "`e[31m"
$ColorGreen = "`e[32m"
$ColorYellow = "`e[33m"
$ColorBlue = "`e[34m"
$ColorMagenta = "`e[35m"
$ColorCyan = "`e[36m"

function Write-Banner {
    Write-Host ""
    Write-Host "${ColorCyan}╔══════════════════════════════════════════════════════════════╗${ColorReset}"
    Write-Host "${ColorCyan}║                                                              ║${ColorReset}"
    Write-Host "${ColorCyan}║  ${ColorMagenta}🔐 KEYPER DEPLOYMENT${ColorCyan}                                    ║${ColorReset}"
    Write-Host "${ColorCyan}║  ${ColorYellow}Secure Credential Management${ColorCyan}                            ║${ColorReset}"
    Write-Host "${ColorCyan}║                                                              ║${ColorReset}"
    Write-Host "${ColorCyan}║  ${ColorGreen}Made with ❤️ by Pink Pixel${ColorCyan}                              ║${ColorReset}"
    Write-Host "${ColorCyan}║  ${ColorBlue}Dream it, Pixel it ✨${ColorCyan}                                   ║${ColorReset}"
    Write-Host "${ColorCyan}║                                                              ║${ColorReset}"
    Write-Host "${ColorCyan}╚══════════════════════════════════════════════════════════════╝${ColorReset}"
    Write-Host ""
}

function Show-Help {
    Write-Host "${ColorYellow}Keyper Deployment Script${ColorReset}"
    Write-Host ""
    Write-Host "${ColorGreen}Usage:${ColorReset}"
    Write-Host "  .\deploy.ps1 [options]"
    Write-Host ""
    Write-Host "${ColorGreen}Options:${ColorReset}"
    Write-Host "  -Environment <env>  Target environment (production/preview) [default: production]"
    Write-Host "  -Preview           Deploy to preview environment"
    Write-Host "  -Help              Show this help message"
    Write-Host ""
    Write-Host "${ColorGreen}Examples:${ColorReset}"
    Write-Host "  .\deploy.ps1                    # Deploy to production"
    Write-Host "  .\deploy.ps1 -Preview           # Deploy to preview"
    Write-Host "  .\deploy.ps1 -Environment preview"
    Write-Host ""
}

if ($Help) {
    Write-Banner
    Show-Help
    exit 0
}

if ($Preview) {
    $Environment = "preview"
}

Write-Banner

Write-Host "${ColorBlue}🚀 Starting Keyper deployment...${ColorReset}"
Write-Host "${ColorYellow}Environment: ${Environment}${ColorReset}"
Write-Host ""

# Check if wrangler is installed
Write-Host "${ColorBlue}📦 Checking Wrangler installation...${ColorReset}"
try {
    $wranglerVersion = wrangler --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "${ColorGreen}✅ Wrangler is installed: $wranglerVersion${ColorReset}"
    } else {
        throw "Wrangler not found"
    }
} catch {
    Write-Host "${ColorRed}❌ Wrangler is not installed${ColorReset}"
    Write-Host "${ColorYellow}Installing Wrangler globally...${ColorReset}"
    npm install -g wrangler
    if ($LASTEXITCODE -ne 0) {
        Write-Host "${ColorRed}❌ Failed to install Wrangler${ColorReset}"
        exit 1
    }
}

# Check if user is logged in
Write-Host "${ColorBlue}🔐 Checking Cloudflare authentication...${ColorReset}"
$authCheck = wrangler whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "${ColorYellow}⚠️  Not logged in to Cloudflare${ColorReset}"
    Write-Host "${ColorBlue}🔑 Please log in to Cloudflare...${ColorReset}"
    wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "${ColorRed}❌ Failed to authenticate with Cloudflare${ColorReset}"
        exit 1
    }
} else {
    Write-Host "${ColorGreen}✅ Authenticated with Cloudflare${ColorReset}"
}

# Install dependencies
Write-Host "${ColorBlue}📦 Installing dependencies...${ColorReset}"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "${ColorRed}❌ Failed to install dependencies${ColorReset}"
    exit 1
}

# Build the project
Write-Host "${ColorBlue}🔨 Building Keyper...${ColorReset}"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "${ColorRed}❌ Build failed${ColorReset}"
    exit 1
}

# Deploy to Cloudflare Pages
Write-Host "${ColorBlue}🚀 Deploying to Cloudflare Pages...${ColorReset}"
if ($Environment -eq "preview") {
    wrangler pages deploy dist --project-name keyper-preview
} else {
    wrangler pages deploy dist --project-name keyper
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "${ColorGreen}🎉 Deployment successful!${ColorReset}"
    Write-Host "${ColorCyan}✨ Keyper is now live on Cloudflare Pages!${ColorReset}"
    Write-Host ""
    Write-Host "${ColorYellow}Next steps:${ColorReset}"
    Write-Host "1. Configure environment variables in Cloudflare dashboard"
    Write-Host "2. Set up custom domain (optional)"
    Write-Host "3. Configure Supabase settings"
    Write-Host ""
    Write-Host "${ColorMagenta}Made with ❤️ by Pink Pixel${ColorReset}"
} else {
    Write-Host "${ColorRed}❌ Deployment failed${ColorReset}"
    exit 1
}
