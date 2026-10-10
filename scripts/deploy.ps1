# Deployment script for Neuron-X
param(
    [string]$RepoName = "neuron-x",
    [switch]$CreateGithubRepo,
    [switch]$DeployCloudflare
)

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")

Write-Host "=== Neuron-X Deployment Pipeline ===" -ForegroundColor Cyan

# 1. Verify build & tests
Write-Host "`n[1/3] Running Edge Function automated tests..." -ForegroundColor Yellow
node scripts/test-endpoints.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed! Aborting deployment."
    exit 1
}

# 2. GitHub Push
if ($CreateGithubRepo) {
    Write-Host "`n[2/3] Provisioning GitHub repository and pushing..." -ForegroundColor Yellow
    gh repo create $RepoName --public --source=. --push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ GitHub repository created and pushed successfully!" -ForegroundColor Green
    } else {
        Write-Host "! Run 'gh auth login' or provide a Personal Access Token." -ForegroundColor Red
    }
}

# 3. Cloudflare Pages Deployment
if ($DeployCloudflare) {
    Write-Host "`n[3/3] Deploying to Cloudflare Pages..." -ForegroundColor Yellow
    npx wrangler pages deploy public --project-name=neuron-x
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Deployed to Cloudflare Pages!" -ForegroundColor Green
    } else {
        Write-Host "! Provide CLOUDFLARE_API_TOKEN or run 'npx wrangler login' to deploy." -ForegroundColor Red
    }
}

Write-Host "`nPipeline completed." -ForegroundColor Cyan
