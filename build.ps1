# Build tung service mot lan voi retry tu dong neu that bai
$env:BUILDKIT_MAX_PARALLELISM = "1"
$env:DOCKER_BUILDKIT = "1"

$services = @(
    "auth-service",
    "product-service",
    "order-service",
    "discount-service",
    "payment-service",
    "notification-service",
    "chat-service"
)

$maxRetries = 3

Write-Host "=== Bat dau build tung service (khong song song, tu dong retry) ===" -ForegroundColor Cyan

foreach ($service in $services) {
    $success = $false
    for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
        if ($attempt -eq 1) {
            Write-Host "`n[BUILD] $service ..." -ForegroundColor Yellow
        } else {
            Write-Host "`n[RETRY $attempt/$maxRetries] $service ..." -ForegroundColor Magenta
        }

        docker compose build $service
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] $service build thanh cong!" -ForegroundColor Green
            $success = $true
            break
        }

        if ($attempt -lt $maxRetries) {
            Write-Host "[!] That bai, thu lai sau 5 giay..." -ForegroundColor DarkYellow
            Start-Sleep -Seconds 5
        }
    }

    if (-not $success) {
        Write-Host "[LOI] $service that bai sau $maxRetries lan thu. Dung lai." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== Tat ca service da build xong. Khoi dong he thong... ===" -ForegroundColor Cyan
docker compose up -d

Write-Host "`n=== Xong! Trang thai cac container: ===" -ForegroundColor Green
docker compose ps
