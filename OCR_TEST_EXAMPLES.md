# OCR Processing Test Examples

This file contains practical PowerShell examples for testing the OCR processing feature.

## Prerequisites

- Node.js backend running on `http://localhost:3001`
- Bill files (JPG, PNG, or PDF) ready for processing
- Bills must already exist in the database

## Test 1: Check Current OCR Status

```powershell
# Get all OCR results
$results = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/ocr-results"

Write-Host "📊 OCR Results Status"
Write-Host "Total Results: $($results.total)"
Write-Host "Success: $($results.stats.success ?? 0)"
Write-Host "Failed: $($results.stats.failed ?? 0)"
Write-Host "Pending: $($results.stats.pending ?? 0)"
```

## Test 2: Single Bill Processing

```powershell
# Process a single bill file
# Make sure BILL-2405 exists in database first

$billFile = "C:\path\to\your\bill.jpg"  # Change this path
$form = @{ "file_BILL-2405" = (Get-Item $billFile) }

$response = Invoke-RestMethod -Method Post `
    -Uri "http://localhost:3001/api/process-ocr" `
    -Form $form

Write-Host "Processing Response:"
Write-Host "Success: $($response.success)"
Write-Host "Failed: $($response.failed)"
$response.results | ConvertTo-Json
```

## Test 3: Batch Processing Multiple Bills

```powershell
# Process multiple bills at once

$bills = @(
    @{ billId = "BILL-2405"; filePath = "C:\bills\bill1.jpg" },
    @{ billId = "BILL-2406"; filePath = "C:\bills\bill2.pdf" },
    @{ billId = "BILL-2407"; filePath = "C:\bills\bill3.jpg" }
)

$form = @{}
foreach ($bill in $bills) {
    if (Test-Path $bill.filePath) {
        $form["file_$($bill.billId)"] = Get-Item -LiteralPath $bill.filePath
        Write-Host "Added: $($bill.billId) - $($bill.filePath)"
    } else {
        Write-Host "⚠️  File not found: $($bill.filePath)"
    }
}

if ($form.Count -gt 0) {
    $response = Invoke-RestMethod -Method Post `
        -Uri "http://localhost:3001/api/process-ocr" `
        -Form $form

    Write-Host "`n✅ Processing Complete"
    Write-Host "Total Processed: $($response.processed)"
    Write-Host "Success: $($response.success)"
    Write-Host "Failed: $($response.failed)"
    Write-Host "Skipped: $($response.skipped)"
    
    # Show details
    $response.results | ForEach-Object {
        Write-Host "`n📄 Bill: $($_.billId) - Status: $($_.status)"
        if ($_.data) {
            Write-Host "  Vendor: $($_.data.vendor)"
            Write-Host "  Amount: $($_.data.amount)"
            Write-Host "  Date: $($_.data.date)"
        }
    }
} else {
    Write-Host "❌ No valid files found for processing"
}
```

## Test 4: Retrieve Specific Bill's OCR Result

```powershell
# Get OCR result for a specific bill

$billId = "BILL-2405"
$result = Invoke-RestMethod -Method Get `
    -Uri "http://localhost:3001/api/ocr-results?billId=$billId"

if ($result.results.Count -gt 0) {
    $ocr = $result.results[0]
    
    Write-Host "📄 OCR Result for $billId"
    Write-Host "Status: $($ocr.status)"
    if ($ocr.status -eq "success") {
        Write-Host "Vendor: $($ocr.vendor)"
        Write-Host "Bill Number: $($ocr.billNumber)"
        Write-Host "Date: $($ocr.date)"
        Write-Host "Amount: $($ocr.amount)"
        Write-Host "Tax: $($ocr.tax)"
        Write-Host "Confidence: $($ocr.confidence * 100)%"
        Write-Host "`nRaw Text (first 200 chars):"
        Write-Host $ocr.rawText.Substring(0, [Math]::Min(200, $ocr.rawText.Length))
    } else {
        Write-Host "Error: $($ocr.errorMessage)"
    }
} else {
    Write-Host "❌ No OCR result found for bill: $billId"
}
```

## Test 5: Reprocess a Bill with Better Quality Image

```powershell
# Reprocess OCR for a specific bill (e.g., with higher resolution image)

$billId = "BILL-2405"
$betterImage = "C:\path\to\better\bill.jpg"

if (Test-Path $betterImage) {
    $form = @{ file = (Get-Item $betterImage) }
    
    $response = Invoke-RestMethod -Method Post `
        -Uri "http://localhost:3001/api/ocr-results/$billId/reprocess" `
        -Form $form

    Write-Host "✅ Reprocessed OCR for $billId"
    Write-Host "Confidence: $($response.data.confidence * 100)%"
    Write-Host "Vendor: $($response.data.vendor)"
    Write-Host "Amount: $($response.data.amount)"
    Write-Host "Processed At: $($response.processedAt)"
} else {
    Write-Host "❌ File not found: $betterImage"
}
```

## Test 6: Get Statistics

```powershell
# Get OCR processing statistics

$results = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/ocr-results?limit=999"

$successCount = $results.stats.success ?? 0
$failedCount = $results.stats.failed ?? 0
$totalCount = $successCount + $failedCount

Write-Host "📊 OCR Processing Statistics"
Write-Host "================================"
Write-Host "Total Processed: $totalCount"
Write-Host "✅ Success: $successCount"
Write-Host "❌ Failed: $failedCount"
Write-Host "Success Rate: $(if ($totalCount -gt 0) { [math]::Round(($successCount/$totalCount)*100, 2) } else { 0 })%"

if ($results.results.Count -gt 0) {
    $avgConfidence = ($results.results | Where-Object { $_.status -eq "success" } | Measure-Object -Property confidence -Average).Average
    Write-Host "Average Confidence: $(if ($avgConfidence) { [math]::Round($avgConfidence * 100, 2) } else { 0 })%"
}

Write-Host ""
Write-Host "❌ Failed Bills:"
$results.results | Where-Object { $_.status -eq "failed" } | ForEach-Object {
    Write-Host "  - $($_.billId): $($_.reason ?? $_.errorMessage)"
}
```

## Test 7: Create Test Bill and Process

```powershell
# Complete workflow: Create a test bill, then process it with OCR

# Step 1: Create test bill in database
$testBill = @{
    name = "Test Employee"
    email = "test@company.com"
    role = "Employee"
    department = "Operations"
    phone = "9999999999"
    password = "Test@123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/users" `
    -ContentType "application/json" -Body $testBill -ErrorAction SilentlyContinue | Out-Null

# Step 2: Get next bill ID
$bills = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/bills" -ErrorAction SilentlyContinue
$nextId = if ($bills -and $bills.Count -gt 0) { $bills[0].id } else { "BILL-2420" }

Write-Host "Created test bill: $nextId"

# Step 3: Process with OCR (you need to provide the actual file)
$testFile = "C:\path\to\test\bill.jpg"

if (Test-Path $testFile) {
    $form = @{ "file_$nextId" = (Get-Item $testFile) }
    
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/process-ocr" -Form $form
    
    Write-Host "`n✅ Processing Complete"
    Write-Host $response | ConvertTo-Json -Depth 5
} else {
    Write-Host "❌ Test file not found: $testFile"
    Write-Host "Update the path and try again"
}
```

## Test 8: Error Handling Examples

```powershell
# Test error scenarios to understand error handling

# Test 1: No files
try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/process-ocr"
} catch {
    Write-Host "✅ Expected Error (no files):"
    Write-Host $_.Exception.Response.StatusCode
    Write-Host $_.ErrorDetails.Message
}

# Test 2: Invalid bill ID
$form = @{ "file_INVALID-ID" = (Get-Item "C:\test.jpg") }
try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/process-ocr" -Form $form
} catch {
    Write-Host "`n✅ Expected Error (invalid bill):"
    Write-Host $_.ErrorDetails.Message
}

# Test 3: Get non-existent result
try {
    Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/ocr-results?billId=INVALID"
    Write-Host "`n✅ Query for non-existent bill (returns empty):"
} catch {
    Write-Host $_.Exception.Message
}
```

---

## Tips for Best Results

1. **Image Quality**: Use high-resolution images (300+ DPI) for better OCR accuracy
2. **Lighting**: Ensure good lighting and clear text visibility
3. **Angle**: Keep bill straight (not at an angle)
4. **File Format**: JPG/PNG generally faster; PDF most reliable for digital documents
5. **File Size**: Keep under 10MB for faster processing
6. **Text Language**: Currently optimized for English text

## Troubleshooting

### Issue: "No text extracted"
- Solution: Try a higher resolution image or cleaner scan

### Issue: "Bill not found"
- Solution: Ensure the bill ID exists in the bills collection first

### Issue: "Already processed"
- Solution: Use the reprocess endpoint (/reprocess) to update with new file

### Issue: Slow Processing
- Solution: Process fewer files at once, or use smaller images

---

**Last Updated**: March 12, 2026

