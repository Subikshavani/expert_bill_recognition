# OCR Processing Backend Feature

## Overview

The OCR Processing feature allows you to automatically extract text and structured data from bill images and PDFs. The system processes files, extracts key information (vendor name, bill number, date, amount, tax), and stores results in a dedicated MongoDB collection (`bill_ocr_results`).

## Features

✅ **Batch OCR Processing** - Process multiple bill files at once
✅ **Duplicate Detection** - Automatically prevents re-processing of already OCR'd bills
✅ **File Type Support** - Handles JPG, PNG, and PDF files
✅ **Structured Data Extraction** - Extracts vendor, bill number, date, amount, and tax
✅ **Confidence Tracking** - Records OCR confidence scores
✅ **Error Logging** - Comprehensive error handling and logging
✅ **Result Retrieval** - Query and filter OCR results
✅ **Reprocessing** - Individual bills can be reprocessed with new files

---

## API Endpoints

### 1. **Process OCR for Multiple Bills**

**Endpoint:** `POST /api/process-ocr`

**Purpose:** Process multiple bill files with OCR and store results in MongoDB

**Request Format:**
- **Content-Type:** `multipart/form-data`
- **File Field Names:** Use format `file_<BILL_ID>`
  - Example: `file_BILL-2405`, `file_BILL-2406`, etc.

**Example cURL:**
```bash
curl -X POST http://localhost:3001/api/process-ocr \
  -F "file_BILL-2405=@/path/to/bill1.jpg" \
  -F "file_BILL-2406=@/path/to/bill2.pdf" \
  -F "file_BILL-2407=@/path/to/bill3.png"
```

**PowerShell Example:**
```powershell
$files = @(
    @{ billId = "BILL-2405"; path = "C:\bills\dominos.jpg" },
    @{ billId = "BILL-2406"; path = "C:\bills\hotel.pdf" },
    @{ billId = "BILL-2407"; path = "C:\bills\fuel.png" }
)

$form = @{}
foreach ($file in $files) {
    $form["file_$($file.billId)"] = Get-Item -LiteralPath $file.path
}

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/process-ocr" `
    -Form $form
    
$response | ConvertTo-Json -Depth 5
```

**Success Response:**
```json
{
  "message": "OCR processing completed",
  "processed": 3,
  "success": 3,
  "failed": 0,
  "skipped": 0,
  "results": [
    {
      "billId": "BILL-2405",
      "status": "success",
      "data": {
        "vendor": "Domino's Pizza",
        "billNumber": "DP-77121",
        "date": "2026-03-13",
        "amount": 714,
        "tax": null
      },
      "confidence": 0.95,
      "processedAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "timestamp": "2026-03-12T10:30:05.000Z"
}
```

**Error Response:**
```json
{
  "error": "No files uploaded.",
  "message": "Please upload bill files for OCR processing.",
  "hint": "Use multipart/form-data with field names like 'file_<billId>' or use 'files' field"
}
```

---

### 2. **Get OCR Results**

**Endpoint:** `GET /api/ocr-results`

**Purpose:** Retrieve stored OCR results with filtering options

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `billId` | string | Get result for specific bill | `?billId=BILL-2405` |
| `status` | string | Filter by status | `?status=success` (or `failed`, `pending`) |
| `limit` | number | Max results to return | `?limit=100` (default: 50) |

**Examples:**

Get all OCR results:
```bash
curl http://localhost:3001/api/ocr-results
```

Get results for specific bill:
```bash
curl http://localhost:3001/api/ocr-results?billId=BILL-2405
```

Get all successful OCR results:
```bash
curl http://localhost:3001/api/ocr-results?status=success&limit=100
```

**Response:**
```json
{
  "results": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "billId": "BILL-2405",
      "vendor": "Domino's Pizza",
      "billNumber": "DP-77121",
      "date": "2026-03-13",
      "amount": 714,
      "tax": null,
      "category": "Food",
      "rawText": "Full OCR extracted text...",
      "confidence": 0.95,
      "status": "success",
      "errorMessage": "",
      "processedAt": "2026-03-12T10:30:00.000Z",
      "createdAt": "2026-03-12T10:30:00.000Z",
      "updatedAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "stats": {
    "success": 28,
    "failed": 2,
    "pending": 0
  },
  "total": 28
}
```

---

### 3. **Reprocess OCR for Specific Bill**

**Endpoint:** `POST /api/ocr-results/:billId/reprocess`

**Purpose:** Reprocess OCR for a single bill (e.g., if you have a better quality image)

**Request Format:**
- **Content-Type:** `multipart/form-data`
- **Required Field:** `file` (the bill image or PDF)

**Example cURL:**
```bash
curl -X POST http://localhost:3001/api/ocr-results/BILL-2405/reprocess \
  -F "file=@/path/to/better-quality-bill.jpg"
```

**PowerShell Example:**
```powershell
$file = Get-Item "C:\better-bill.jpg"
$form = @{ file = $file }

Invoke-RestMethod -Method Post `
    -Uri "http://localhost:3001/api/ocr-results/BILL-2405/reprocess" `
    -Form $form | ConvertTo-Json -Depth 5
```

**Response:**
```json
{
  "message": "OCR reprocessed successfully",
  "billId": "BILL-2405",
  "data": {
    "vendor": "Domino's Pizza Pizza",
    "billNumber": "DP-77121",
    "date": "2026-03-13",
    "amount": 714.50,
    "tax": 35.75,
    "category": "Food",
    "confidence": 0.97
  },
  "processedAt": "2026-03-12T10:35:00.000Z"
}
```

---

## MongoDB Collection Schema

### `bill_ocr_results`

Stores all OCR processing results and extracted data.

**Document Structure:**
```javascript
{
  _id: ObjectId,
  billId: string,           // Reference to bills collection
  vendor: string,           // Extracted vendor name
  billNumber: string,       // Extracted bill/invoice number
  date: string,             // Extracted date (YYYY-MM-DD format)
  amount: number,           // Extracted total amount
  tax: number,              // Extracted tax amount (if available)
  category: string,         // Inferred category (Fuel, Travel, Hotel, etc.)
  rawText: string,          // Full OCR extracted text
  confidence: number,       // OCR confidence score (0-1)
  status: string,           // "success", "failed", or "pending"
  errorMessage: string,     // Error description if status is "failed"
  processedAt: date,        // When OCR was processed
  createdAt: date,          // Document creation timestamp
  updatedAt: date           // Last update timestamp
}
```

**Example Document:**
```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "billId": "BILL-2405",
  "vendor": "Domino's Pizza",
  "billNumber": "DP-77121",
  "date": "2026-03-13",
  "amount": 714,
  "tax": null,
  "category": "Food",
  "rawText": "DOMINO'S PIZZA\nInvoice: DP-77121\nDate: 13/03/2026\nTotal: Rs. 714\n...",
  "confidence": 0.95,
  "status": "success",
  "errorMessage": "",
  "processedAt": ISODate("2026-03-12T10:30:00.000Z"),
  "createdAt": ISODate("2026-03-12T10:30:00.000Z"),
  "updatedAt": ISODate("2026-03-12T10:30:00.000Z")
}
```

---

## How It Works

### Processing Flow

```
1. Upload file → POST /api/process-ocr
   ↓
2. Check if bill exists in 'bills' collection
   ↓
3. Check if billId already exists in 'bill_ocr_results' (duplicate detection)
   ↓
4. Extract text from file:
   - PDF: Use pdf-parse
   - Image: Use Tesseract.js
   ↓
5. Parse extracted text to find:
   - Vendor name
   - Bill number
   - Date
   - Amount
   - Tax
   ↓
6. Store result in 'bill_ocr_results' collection
   ↓
7. Return processing summary
```

### Supported File Types

| Type | Format | Library | Confidence |
|------|--------|---------|------------|
| PDF | .pdf | pdf-parse | High (95%+) |
| JPEG | .jpg, .jpeg | Tesseract.js | Medium-High (70-90%) |
| PNG | .png | Tesseract.js | Medium-High (70-90%) |

**Max File Size:** 10MB

---

## Data Extraction Patterns

The OCR text parser uses regex patterns to extract:

### Vendor Name
- Searches for keywords: "vendor", "supplier", "merchant", "m/s", "from"
- Falls back to first non-empty line

### Bill Number
- Patterns: "Bill No", "Invoice No", "Receipt No"
- Minimum 4 characters, alphanumeric with dashes/slashes

### Date
- Formats: `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`
- Normalized to ISO format: `YYYY-MM-DD`

### Amount
- Keywords: "Total Amount", "Grand Total", "Amount Payable", "Total"
- Handles: "Rs.", "INR", comma-separated numbers

### Tax (GST/VAT)
- Keywords: "Tax", "GST", "VAT"
- Same number parsing as amount

### Category (Auto-inferred)
- "Fuel" → fuel, petrol, diesel
- "Travel" → travel, taxi, flight, bus, train
- "Hotel" → hotel, lodging, stay
- "Courier" → courier, shipping, dispatch

---

## Example Workflow: Complete OCR Processing

### Step 1: Create Bills First
```powershell
# Ensure bills exist in the bills collection
$bills = @(
    @{
        id = "BILL-2410"
        bill_number = "INV-001"
        vendor = "ABC Fuel Station"
        category = "Fuel"
        amount = 2500
        date = "2026-03-12"
        department = "Operations"
        status = "Uploaded"
        uploaded_by = "admin@company.com"
    }
)
```

### Step 2: Upload Bill Files
Create actual bill image/PDF files from your scanner or receipts

### Step 3: Process with OCR
```powershell
# Prepare file
$file = Get-Item "C:\receipts\fuel-station-bill.jpg"
$form = @{ "file_BILL-2410" = $file }

# Send to API
$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/process-ocr" -Form $form

# View results
$response | ConvertTo-Json -Depth 5
```

### Step 4: Retrieve and Verify
```powershell
# Get OCR results
$results = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/ocr-results?billId=BILL-2410"

# Check extracted data
$results.results[0] | Select-Object billId, vendor, amount, confidence
```

### Step 5: Reprocess if Needed
```powershell
# If OCR quality was poor, reprocess with better image
$betterFile = Get-Item "C:\receipts\fuel-bill-hires.jpg"
$form = @{ file = $betterFile }

Invoke-RestMethod -Method Post `
    -Uri "http://localhost:3001/api/ocr-results/BILL-2410/reprocess" `
    -Form $form
```

---

## Logging and Monitoring

The API logs processing details to console:

```
📋 OCR Processing: 3 file(s) received
✅ Successfully processed BILL-2405
❌ Error processing BILL-2406: No text extracted from image
⏭️  Skipping BILL-2407: OCR already processed

📊 OCR Processing Summary:
   Total Processed: 3
   ✅ Success: 1
   ❌ Failed: 1
   ⏭️  Skipped: 1
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No files uploaded" | Missing files in request | Include multipart file data with field name `file_<billId>` |
| "Bill not found" | BillId doesn't exist in bills collection | Ensure bill exists in database first |
| "Already processed" | OCR result exists for this billId | Use reprocess endpoint or delete result first |
| "No text extracted" | Poor image quality or unsupported format | Try higher resolution image or different format |
| "OCR processing failed" | Invalid file or corrupted image | Verify file integrity |
| "File size exceeds 10MB" | File too large | Use smaller image or compressed PDF |

---

## Performance Considerations

- **Single File:** ~2-5 seconds (depends on image quality)
- **Batch Processing:** ~10-30 seconds for 10 files
- **PDF Processing:** Generally faster than image OCR
- **Confidence Scores:** PDF text extraction = 0.95; Image OCR = 0.70-0.90

---

## Database Queries

### View All OCR Results
```javascript
db.bill_ocr_results.find().pretty()
```

### Count Successful Extractions
```javascript
db.bill_ocr_results.countDocuments({ status: "success" })
```

### Find Failed Extractions
```javascript
db.bill_ocr_results.find({ status: "failed" })
```

### Get Average Confidence
```javascript
db.bill_ocr_results.aggregate([
  { $match: { status: "success" } },
  { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } }
])
```

### Find Bills with Low Confidence
```javascript
db.bill_ocr_results.find({ 
  confidence: { $lt: 0.75 },
  status: "success"
})
```

---

## Advanced Usage

### Integration with Bill Approval Workflow

After successful OCR, update bill with extracted data:

```javascript
// In application logic
const ocrResult = await BillOCRResult.findOne({ billId: "BILL-2405" });

if (ocrResult.status === "success") {
  // Update bill with OCR-extracted data
  await Bill.updateOne(
    { id: "BILL-2405" },
    {
      vendor: ocrResult.vendor,
      bill_number: ocrResult.billNumber,
      date: ocrResult.date,
      amount: ocrResult.amount
    }
  );
}
```

### Scheduled OCR Processing

Run OCR processing periodically on unprocessed bills:

```javascript
// Schedule daily at 2 AM
const schedule = require('node-schedule');

schedule.scheduleJob('0 2 * * *', async () => {
  const unprocessedBills = await Bill.find({
    id: { $nin: (await BillOCRResult.find({}, 'billId')).map(r => r.billId) }
  });
  
  // Process unprocessed bills
  // Note: This requires actual file access
});
```

---

## Notes

- Files must be accessible during processing (current implementation requires file upload via API)
- For persistent file storage, implement S3, Google Cloud Storage, or local file persistence
- OCR confidence varies based on image quality, resolution, and text clarity
- Text extraction is in English; for multilingual support, adjust Tesseract language parameter

---

## Support

For issues or feature requests, refer to the GitHub repository or contact the development team.

**Last Updated:** March 12, 2026

