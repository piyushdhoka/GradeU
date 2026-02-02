# Webhook Integration Guide for Render Website

## Overview
This guide explains how to integrate the CyberCoach lab completion webhook into your render website.

## 🔌 Webhook Endpoint

**URL:** `https://your-backend.com/api/student/labs/webhook/complete`  
**Method:** `POST`  
**Content-Type:** `application/json`

---

## 📋 Integration Steps

### Step 1: Get Student ID from URL

When CyberCoach redirects to your render website, the URL will include:
```
https://vulnarable-labs.onrender.com/lab/access-control?studentId=<uuid>&returnUrl=<encoded-cybercoach-url>
```

Extract the studentId:
```javascript
// Get studentId from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('studentId');
const returnUrl = urlParams.get('returnUrl') || 'https://cybercoach.com/labs';
```

---

### Step 2: Call Webhook on Lab Completion

When student completes the lab, call the webhook:

```javascript
async function syncLabCompletion(studentId, labId) {
    const webhookUrl = 'https://your-backend.com/api/student/labs/webhook/complete';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentId: studentId,
                labId: labId, // e.g., 'broken-access-control'
                completedAt: new Date().toISOString(),
                metadata: {
                    score: calculateScore(),
                    timeSpent: getTimeSpent(),
                    attempts: getAttemptCount(),
                }
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Lab completion synced:', data);
            return true;
        } else {
            const error = await response.json();
            console.error('Webhook error:', error);
            return false;
        }
    } catch (error) {
        console.error('Failed to sync lab completion:', error);
        return false;
    }
}
```

---

### Step 3: Redirect Back to CyberCoach

After syncing completion, redirect student back:

```javascript
function onLabComplete(studentId, labId) {
    // Sync completion
    syncLabCompletion(studentId, labId).then(success => {
        if (success) {
            // Redirect back to CyberCoach with completion parameter
            const returnUrl = getReturnUrl(); // From URL params
            const redirectUrl = `${returnUrl}?labCompleted=${labId}`;
            window.location.href = redirectUrl;
        } else {
            // Still redirect, but show error message
            alert('Lab completed but sync failed. Please refresh CyberCoach to see completion.');
            const returnUrl = getReturnUrl();
            window.location.href = returnUrl;
        }
    });
}
```

---

## 🔐 Security Considerations

### Current Implementation:
- Rate limiting (30 requests/minute per IP)
- Input validation (UUID format, required fields)
- No authentication required (for ease of integration)

### Future Enhancements (Recommended):
1. **Webhook Secret:**
   ```javascript
   headers: {
       'Content-Type': 'application/json',
       'X-Webhook-Secret': process.env.LAB_WEBHOOK_SECRET
   }
   ```

2. **HMAC Signature:**
   ```javascript
   const signature = generateHMAC(payload, secret);
   headers: {
       'X-Webhook-Signature': signature
   }
   ```

3. **IP Whitelist:**
   - Only allow requests from render website IPs

---

## 📝 Lab ID Mapping

Ensure lab IDs match between CyberCoach and your render website:

| CyberCoach Lab ID | Render Website Path |
|-------------------|---------------------|
| `broken-access-control` | `/lab/access-control` |
| `cryptographic-failures` | `/lab/crypto` |
| `sql-injection` | `/lab/sqli` |
| `insecure-design` | `/lab/insecure-design` |
| `security-misconfiguration` | `/lab/misconfig` |
| `vulnerable-components` | `/lab/vuln-components` |

**Important:** The `labId` in the webhook must match the CyberCoach lab ID, not the render website path.

---

## 🧪 Testing

### Test Webhook Locally:
```bash
curl -X POST http://localhost:4000/api/student/labs/webhook/complete \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "123e4567-e89b-12d3-a456-426614174000",
    "labId": "broken-access-control"
  }'
```

### Test Health Check:
```bash
curl http://localhost:4000/api/student/labs/webhook/health
```

---

## 📊 Example Integration

### Complete Example:

```javascript
// lab-completion-handler.js

class LabCompletionHandler {
    constructor() {
        this.webhookUrl = 'https://your-backend.com/api/student/labs/webhook/complete';
        this.studentId = this.getStudentId();
        this.returnUrl = this.getReturnUrl();
    }

    getStudentId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('studentId');
    }

    getReturnUrl() {
        const params = new URLSearchParams(window.location.search);
        return decodeURIComponent(params.get('returnUrl') || 'https://cybercoach.com/labs');
    }

    getLabId() {
        // Map your render website path to CyberCoach lab ID
        const path = window.location.pathname;
        const mapping = {
            '/lab/access-control': 'broken-access-control',
            '/lab/crypto': 'cryptographic-failures',
            '/lab/sqli': 'sql-injection',
            '/lab/insecure-design': 'insecure-design',
            '/lab/misconfig': 'security-misconfiguration',
            '/lab/vuln-components': 'vulnerable-components',
        };
        return mapping[path] || null;
    }

    async syncCompletion(labId, metadata = {}) {
        if (!this.studentId || !labId) {
            console.error('Missing studentId or labId');
            return false;
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: this.studentId,
                    labId: labId,
                    completedAt: new Date().toISOString(),
                    metadata: metadata,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Webhook failed');
            }

            const data = await response.json();
            console.log('Lab completion synced:', data);
            return true;
        } catch (error) {
            console.error('Failed to sync lab completion:', error);
            return false;
        }
    }

    redirectToCyberCoach(labId, success = true) {
        const separator = this.returnUrl.includes('?') ? '&' : '?';
        const redirectUrl = success 
            ? `${this.returnUrl}${separator}labCompleted=${labId}`
            : this.returnUrl;
        
        window.location.href = redirectUrl;
    }

    async handleLabCompletion(metadata = {}) {
        const labId = this.getLabId();
        
        if (!labId) {
            console.error('Could not determine lab ID');
            this.redirectToCyberCoach('', false);
            return;
        }

        const success = await this.syncCompletion(labId, metadata);
        this.redirectToCyberCoach(labId, success);
    }
}

// Usage in your render website:
const labHandler = new LabCompletionHandler();

// When student completes lab:
labHandler.handleLabCompletion({
    score: 100,
    timeSpent: 1800, // seconds
    attempts: 1
});
```

---

## 🔄 Error Handling

### Retry Logic (Optional):
```javascript
async function syncWithRetry(studentId, labId, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const success = await syncLabCompletion(studentId, labId);
            if (success) return true;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
    return false;
}
```

---

## 📱 Mobile Considerations

If your render website supports mobile:
- Ensure webhook calls work on mobile browsers
- Handle network failures gracefully
- Consider offline queue for retry

---

## 🚀 Production Checklist

- [ ] Webhook URL configured correctly
- [ ] Student ID extraction tested
- [ ] Lab ID mapping verified
- [ ] Error handling implemented
- [ ] Redirect URL handling tested
- [ ] Rate limiting understood
- [ ] Logging/monitoring set up
- [ ] Tested end-to-end flow

---

## 📞 Support

If webhook fails:
1. Check webhook URL is correct
2. Verify studentId is valid UUID
3. Check labId matches CyberCoach ID
4. Review server logs for errors
5. Test health endpoint

---

## 🔍 Monitoring

Monitor these metrics:
- Webhook success rate
- Average response time
- Error rates by type
- Lab completion sync rate

