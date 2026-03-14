# Admin Model Retraining Workflow

## Overview

This document explains how an admin can retrain the employability prediction models through your web interface.

---

## When to Retrain

### ✅ You MUST retrain when:
- Adding new degree programs (e.g., BSEE, BSCpE)
- Adding new skill categories to existing programs
- Changing the structure of input data

### ✅ You SHOULD retrain when:
- Accumulating 200+ new students
- Every quarter/semester (to keep models fresh)
- Model accuracy appears to be degrading
- Job market conditions have changed significantly

### ❌ You DON'T need to retrain when:
- Just collecting more data for existing programs (can wait until quarterly)
- Making UI changes
- Updating prediction display logic

---

## Admin Workflow — Frontend Perspective

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD                            │
└─────────────────────────────────────────────────────────────────┘

Step 1: Upload CSV
┌────────────────────────────┐
│  [Choose File] [Upload]    │  ← Admin clicks to upload new training CSV
└────────────────────────────┘
         │
         ▼
┌────────────────────────────┐
│  ✅ Validation Passed      │  ← Server validates CSV format/content
│  500 students              │
│  7 programs                │
│  No errors                 │
│  ⚠️ 1 warning              │
└────────────────────────────┘
         │
         ▼
Step 2: Review & Confirm
┌────────────────────────────┐
│  Current models:           │
│  - Trained: 2025-01-15     │
│  - 500 students            │
│  - Accuracy: 100% / 59%    │
│                            │
│  New dataset:              │
│  - 650 students            │
│  - Same 7 programs         │
│                            │
│  [Retrain Models] [Cancel] │  ← Admin clicks "Retrain Models"
└────────────────────────────┘
         │
         ▼
Step 3: Retraining in Progress
┌────────────────────────────┐
│  ⏳ Retraining models...   │  ← Background task started
│  This may take 2-5 minutes │
│                            │
│  [Check Status]            │  ← Admin can close tab and come back
└────────────────────────────┘
         │
         ▼
Step 4: Completion
┌────────────────────────────┐
│  ✅ Retraining Complete!   │
│                            │
│  Model 1: 100% accuracy    │
│  Model 2: 62% accuracy     │
│                            │
│  Backup saved to:          │
│  backups/20250314_143022   │
│                            │
│  [Deploy] [Rollback]       │  ← Admin can deploy or rollback
└────────────────────────────┘
```

---

## API Endpoints (for Frontend Developers)

### 1. Upload & Validate CSV

```javascript
POST /admin/upload-training-data

// Frontend code
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch('/admin/upload-training-data', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// {
//   "valid": true,
//   "message": "Validation passed",
//   "warnings": ["Dataset size (450) is smaller than recommended (500+)"]
// }
```

**Response:**
- `valid`: `true/false` — whether CSV passes validation
- `message`: Description of validation result
- `warnings`: Array of non-critical issues

**Frontend Action:**
- If `valid === false`: Show error, don't allow retraining
- If `valid === true` with warnings: Show warnings but allow retraining
- Save the filename for next step

---

### 2. Trigger Retraining

```javascript
POST /admin/retrain-models?filename=training_data_20250314_143022.csv&backup=true

const response = await fetch(
  `/admin/retrain-models?filename=${uploadedFilename}&backup=true`,
  { method: 'POST' }
);

const result = await response.json();
// {
//   "success": true,
//   "message": "Retraining started in background..."
// }
```

**Parameters:**
- `filename`: The filename returned from step 1
- `backup`: `true/false` — whether to backup current models

**Frontend Action:**
- Show "Retraining in progress" message
- Start polling `/admin/retraining-status`
- Disable the retrain button until complete

---

### 3. Check Status (Poll This)

```javascript
GET /admin/retraining-status

// Poll every 5 seconds
const interval = setInterval(async () => {
  const response = await fetch('/admin/retraining-status');
  const status = await response.json();
  
  if (!status.is_running && status.last_result) {
    clearInterval(interval);
    // Retraining complete - show results
    handleComplete(status.last_result);
  }
}, 5000);

// Response:
// {
//   "is_running": false,
//   "last_run": "2025-03-14T14:30:22",
//   "last_result": {
//     "success": true,
//     "message": "Models retrained successfully",
//     "metrics": {
//       "dataset_size": 650,
//       "model1_cv_accuracy": 1.0,
//       "model2_cv_accuracy": 0.623,
//       ...
//     },
//     "backup_location": "backend/.../backups/20250314_143022"
//   }
// }
```

**Frontend Action:**
- While `is_running === true`: Show spinner/progress
- When `is_running === false`:
  - If `last_result.success === true`: Show success + metrics
  - If `last_result.success === false`: Show error message

---

### 4. Rollback to Previous Version

```javascript
POST /admin/rollback-models

await fetch('/admin/rollback-models', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    backup_location: "backend/.../backups/20250314_143022"
  })
});

// Response:
// {
//   "success": true,
//   "message": "Successfully rolled back to: ..."
// }
```

**Frontend Action:**
- Show confirmation dialog before rollback
- On success: Show success message
- Reload predictor or restart server to use old models

---

### 5. List Available Backups

```javascript
GET /admin/list-backups

const response = await fetch('/admin/list-backups');
const data = await response.json();

// {
//   "backups": [
//     {
//       "timestamp": "20250314_143022",
//       "path": "backend/.../backups/20250314_143022",
//       "created": "2025-03-14T14:30:22"
//     },
//     {
//       "timestamp": "20250301_090000",
//       "path": "backend/.../backups/20250301_090000",
//       "created": "2025-03-01T09:00:00"
//     }
//   ]
// }
```

**Frontend Action:**
- Display list of backups with dates
- Let admin select one for rollback

---

## Frontend Components Needed

### 1. CSV Upload Component

```jsx
<UploadCSV 
  onUploadSuccess={(filename, validation) => {
    setUploadedFile(filename);
    setValidation(validation);
  }}
  onUploadError={(error) => {
    showError(error);
  }}
/>
```

### 2. Validation Results Display

```jsx
{validation.valid ? (
  <div className="success">
    ✅ Validation Passed
    {validation.warnings.length > 0 && (
      <div className="warnings">
        {validation.warnings.map(w => <p>⚠️ {w}</p>)}
      </div>
    )}
  </div>
) : (
  <div className="error">
    ❌ {validation.message}
  </div>
)}
```

### 3. Retrain Button

```jsx
<button 
  onClick={() => triggerRetraining(uploadedFile)}
  disabled={!validation.valid || isRetraining}
>
  {isRetraining ? 'Retraining...' : 'Retrain Models'}
</button>
```

### 4. Status Poller

```jsx
useEffect(() => {
  if (!isRetraining) return;
  
  const interval = setInterval(async () => {
    const status = await checkStatus();
    
    if (!status.is_running) {
      setIsRetraining(false);
      setResult(status.last_result);
      clearInterval(interval);
    }
  }, 5000);
  
  return () => clearInterval(interval);
}, [isRetraining]);
```

### 5. Results Display

```jsx
{result.success ? (
  <div className="success-panel">
    <h3>✅ Retraining Successful</h3>
    <p>Dataset: {result.metrics.dataset_size} students</p>
    <p>Model 1 Accuracy: {(result.metrics.model1_cv_accuracy * 100).toFixed(1)}%</p>
    <p>Model 2 Accuracy: {(result.metrics.model2_cv_accuracy * 100).toFixed(1)}%</p>
    
    <button onClick={deployModels}>Deploy to Production</button>
    <button onClick={rollbackModels}>Rollback</button>
  </div>
) : (
  <div className="error-panel">
    <h3>❌ Retraining Failed</h3>
    <p>{result.error}</p>
  </div>
)}
```

---

## Important Notes for Frontend

### 1. File Upload Size Limits
- CSV files can be 1-5 MB
- Set appropriate upload limits in your frontend
- Show file size to user before upload

### 2. Timeout Handling
- Retraining can take 2-5 minutes
- Don't timeout HTTP requests too quickly
- Use background tasks (already implemented in backend)

### 3. Error States to Handle
- File upload fails
- CSV validation fails
- Retraining fails
- Network errors while polling
- Backup not found for rollback

### 4. UX Recommendations
- Show progress indicator during retraining
- Allow admin to leave page and come back
- Send email/notification when complete (optional)
- Show before/after accuracy comparison
- Confirm before rollback (destructive action)

---

## Security Considerations

### 1. Authentication
```javascript
// Add auth headers to all requests
headers: {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json'
}
```

### 2. Role-Based Access
- Only admins should access `/admin/*` endpoints
- Implement proper RBAC checks in backend
- Frontend should hide admin UI for non-admins

### 3. File Validation
- Only allow `.csv` files
- Limit file size (max 10 MB)
- Scan for malicious content if needed

---

## Testing Checklist

- [ ] Upload valid CSV → passes validation
- [ ] Upload invalid CSV → shows error
- [ ] Upload CSV with warnings → shows warnings but allows proceed
- [ ] Trigger retraining → status updates correctly
- [ ] Retraining completes successfully → shows metrics
- [ ] Retraining fails → shows error message
- [ ] Poll status while retraining in progress
- [ ] List backups → shows all available backups
- [ ] Rollback to previous version → works correctly
- [ ] Try to retrain while already retraining → shows error

---

## Production Deployment

### Option 1: Zero-Downtime Deployment
1. Retrain models to new files (e.g., `model1_v2.pkl`)
2. Test new models in staging
3. Update predictor to load `v2` files
4. Restart server
5. Old models stay as backup

### Option 2: Blue-Green Deployment
1. Run two instances of your app (blue/green)
2. Retrain on green instance
3. Test green instance
4. Switch traffic from blue to green
5. Keep blue as rollback

### Option 3: Simple Replacement (What we have now)
1. Backup current models
2. Retrain and overwrite
3. Restart predictor (or auto-reload)
4. Rollback if issues detected

**Current implementation uses Option 3** — simplest but requires brief downtime or auto-reload mechanism.

---

*This document is for frontend developers integrating the admin retraining UI.*
