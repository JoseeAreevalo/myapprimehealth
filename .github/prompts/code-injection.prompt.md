---
mode: 'agent'
description: 'Code Injection Scan & Hardening'
tools: ['changes', 'codebase', 'fetch', 'findTestFiles', 'githubRepo', 'problems', 'runCommands', 'runTasks', 'search', 'searchResults', 'testFailure', 'usages', 'playwright', 'github', 'github-remote', 'Azure MCP Server']
---

# 🛡️ Code Injection Defense Assessment & Remediation Plan

## 🎯 Objective
Identify potential code injection vulnerabilities across the project (API + frontend) and propose concrete remediation steps. Focus on user-supplied inputs, unsafe string interpolation, dynamic code execution, and serialization/deserialization paths.

## 🔍 Investigation Scope

### 1. **Backend (API) Injection Risks**
- SQL Injection: Check all database queries (parameterized, sanitized?).
- Command Injection: Identify uses of `child_process`, shell commands, or exec functions.
- Template Injection: Review template engines / string templates built from user input.
- Deserialization: Inspect `JSON.parse`, custom serializers, YAML parsing.
- Validation: Ensure schema validation or sanitization libraries are applied.

### 2. **Frontend (React) Injection Risks**
- DOM-based XSS: Search for `dangerouslySetInnerHTML`, direct HTML assignment, or unsanitized user content.
- URL Manipulation: Validate use of `window.location`, query params, dynamic script loading.
- Third-Party Libraries: Check dynamic imports, script tags, inline event handlers.

### 3. **API Interaction Surfaces**
- Input Handling in Express Routes: Query params, body payload, headers.
- Logging & Error Reporting: Ensure no raw injection vectors.
- Configurations: Verify CORS, CSP, HTTP headers to mitigate reflective injection.

## 🧰 Tools & References
- Review `api/src/**` and `frontend/src/**`
- Inspect environment variable usage (dotenv)
- Check for custom sanitizers or missing protections

## 📋 Deliverables
1. **Vulnerability Report**
   - Each injection vector found
   - Snippet showing vulnerability
   - Impact assessment (Critical/High/Medium/Low)
   - CWE mapping if applicable

2. **Remediation Plan**
   - Specific fixes (code-level, config-level)
   - Best practice recommendations (parameterization, encoding, sanitization)
   - Suggested libraries or patterns (e.g., `express-validator`, DOMPurify)

3. **Validation Checklist**
   - Post-fix verification steps
   - Tests to add or update (unit/integration/e2e)

## ✅ Success Criteria
- [ ] All potential injection vectors identified and documented
- [ ] Remediation steps prioritized by severity
- [ ] Tests or proof-of-fix recommendations provided
- [ ] Security headers and configurations reviewed

## 🚀 Getting Started
1. Scan for direct DB calls in repositories/services.
2. Identify any use of raw SQL strings built with template literals.
3. Review Express middlewares for data validation or lack thereof.
4. For the frontend, search for any HTML injections or inline script usage.
5. Document findings and propose remediations.
