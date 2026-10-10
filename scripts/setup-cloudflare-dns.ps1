# Automation script to create zone neuron-x.tech and configure DNS records on Cloudflare
param(
    [Parameter(Mandatory=$false)]
    [string]$ApiToken
)

$accountId = "98a853028f7e69d6d5deb370c46ee98b"
$domain = "neuron-x.tech"

if (-not $ApiToken) {
    # Check environment variable
    $ApiToken = $env:CLOUDFLARE_API_TOKEN
}

if (-not $ApiToken) {
    Write-Host "Please provide your Cloudflare API Token with 'Zone:Edit' permissions." -ForegroundColor Yellow
    Write-Host "You can create one in 30 seconds at: https://dash.cloudflare.com/profile/api-tokens (Use 'Edit zone DNS' template)." -ForegroundColor Cyan
    $ApiToken = Read-Host "Enter Cloudflare API Token"
}

if (-not $ApiToken) {
    Write-Error "No API Token provided. Aborting."
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type" = "application/json"
}

Write-Host "=== Cloudflare Zone & DNS Automation ===" -ForegroundColor Cyan

# 1. Create Zone
Write-Host "`n[1/3] Creating zone $domain in Cloudflare..." -ForegroundColor Yellow
$zoneBody = @{
    account = @{ id = $accountId }
    name = $domain
    type = "full"
} | ConvertTo-Json

try {
    $zoneRes = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones" -Headers $headers -Method POST -Body $zoneBody
    $zoneId = $zoneRes.result.id
    $ns1 = $zoneRes.result.name_servers[0]
    $ns2 = $zoneRes.result.name_servers[1]
    Write-Host "✓ Zone created successfully!" -ForegroundColor Green
    Write-Host "Zone ID: $zoneId"
    Write-Host "`n=== CLOUDFLARE ASSIGNED NAMESERVERS ===" -ForegroundColor Green
    Write-Host "1. $ns1" -ForegroundColor Green
    Write-Host "2. $ns2" -ForegroundColor Green
} catch {
    Write-Host "! Zone creation notice: $($_.Exception.Message)"
    # Check if zone already exists
    $existingZone = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=$domain" -Headers $headers -Method GET
    if ($existingZone.result.Count -gt 0) {
        $zoneId = $existingZone.result[0].id
        $ns1 = $existingZone.result[0].name_servers[0]
        $ns2 = $existingZone.result[0].name_servers[1]
        Write-Host "Found existing zone ID: $zoneId"
        Write-Host "Nameservers: $ns1, $ns2" -ForegroundColor Green
    } else {
        Write-Error "Could not create or locate zone."
        exit 1
    }
}

# 2. Add CNAME @ -> neuron-x.pages.dev
Write-Host "`n[2/3] Adding CNAME @ -> neuron-x.pages.dev..." -ForegroundColor Yellow
$cnameApex = @{
    type = "CNAME"
    name = "@"
    content = "neuron-x.pages.dev"
    proxied = $true
    ttl = 1
} | ConvertTo-Json

try {
    $recordApexRes = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $headers -Method POST -Body $cnameApex
    Write-Host "✓ CNAME @ configured with Cloudflare proxy!" -ForegroundColor Green
} catch {
    Write-Host "Notice: $($_.Exception.Message)"
}

# 3. Add CNAME www -> neuron-x.pages.dev
Write-Host "`n[3/3] Adding CNAME www -> neuron-x.pages.dev..." -ForegroundColor Yellow
$cnameWww = @{
    type = "CNAME"
    name = "www"
    content = "neuron-x.pages.dev"
    proxied = $true
    ttl = 1
} | ConvertTo-Json

try {
    $recordWwwRes = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $headers -Method POST -Body $cnameWww
    Write-Host "✓ CNAME www configured with Cloudflare proxy!" -ForegroundColor Green
} catch {
    Write-Host "Notice: $($_.Exception.Message)"
}

Write-Host "`n✓ All DNS records configured via CLI!" -ForegroundColor Green
Write-Host "Next step: Update nameservers at your registrar to: $ns1 and $ns2" -ForegroundColor Cyan
