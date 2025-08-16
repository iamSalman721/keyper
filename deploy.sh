#!/bin/bash

# Keyper Deployment Script for Cloudflare Pages
# Made with ❤️ by Pink Pixel
# Bash script for Linux/macOS deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
PREVIEW=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--preview)
            PREVIEW=true
            ENVIRONMENT="preview"
            shift
            ;;
        -h|--help)
            echo -e "${YELLOW}Keyper Deployment Script${NC}"
            echo ""
            echo -e "${GREEN}Usage:${NC}"
            echo "  ./deploy.sh [options]"
            echo ""
            echo -e "${GREEN}Options:${NC}"
            echo "  -e, --environment <env>  Target environment (production/preview) [default: production]"
            echo "  -p, --preview           Deploy to preview environment"
            echo "  -h, --help              Show this help message"
            echo ""
            echo -e "${GREEN}Examples:${NC}"
            echo "  ./deploy.sh                    # Deploy to production"
            echo "  ./deploy.sh --preview          # Deploy to preview"
            echo "  ./deploy.sh -e preview"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Banner
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  ${MAGENTA}🔐 KEYPER DEPLOYMENT${CYAN}                                    ║${NC}"
echo -e "${CYAN}║  ${YELLOW}Secure Credential Management${CYAN}                            ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  ${GREEN}Made with ❤️ by Pink Pixel${CYAN}                              ║${NC}"
echo -e "${CYAN}║  ${BLUE}Dream it, Pixel it ✨${CYAN}                                   ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}🚀 Starting Keyper deployment...${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check if wrangler is installed
echo -e "${BLUE}📦 Checking Wrangler installation...${NC}"
if command -v wrangler &> /dev/null; then
    WRANGLER_VERSION=$(wrangler --version)
    echo -e "${GREEN}✅ Wrangler is installed: ${WRANGLER_VERSION}${NC}"
else
    echo -e "${RED}❌ Wrangler is not installed${NC}"
    echo -e "${YELLOW}Installing Wrangler globally...${NC}"
    npm install -g wrangler
fi

# Check if user is logged in
echo -e "${BLUE}🔐 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare${NC}"
    echo -e "${BLUE}🔑 Please log in to Cloudflare...${NC}"
    wrangler login
else
    echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Build the project
echo -e "${BLUE}🔨 Building Keyper...${NC}"
npm run build

# Deploy to Cloudflare Pages
echo -e "${BLUE}🚀 Deploying to Cloudflare Pages...${NC}"
if [ "$ENVIRONMENT" = "preview" ]; then
    wrangler pages deploy dist --project-name keyper-preview
else
    wrangler pages deploy dist --project-name keyper
fi

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo -e "${CYAN}✨ Keyper is now live on Cloudflare Pages!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure environment variables in Cloudflare dashboard"
echo "2. Set up custom domain (optional)"
echo "3. Configure Supabase settings"
echo ""
echo -e "${MAGENTA}Made with ❤️ by Pink Pixel${NC}"
