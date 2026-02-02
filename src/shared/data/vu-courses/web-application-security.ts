
import { Course } from '@types';

export const vuWebSecurityCourse: Course = {
    id: 'vu-web-security',
    title: 'Web Application Security',
    description: 'Learn to identify and exploit vulnerabilities in web applications, understanding the OWASP Top 10 and secure coding practices, tailored for VU curriculum.',
    teacher_id: 'vu-security-dept',
    is_published: true,
    category: 'vishwakarma-university',
    difficulty: 'intermediate',
    estimated_hours: 20,
    enrollment_count: 0,
    rating: 5,
    modules: [
        {
            id: 'vu-mod-1',
            title: '1. Web Security Fundamentals',
            description: 'The bedrock of security: HTTP vs HTTPS, Sessions, and Definitions.',
            course_id: 'vu-web-security',
            order: 1,
            module_order: 1,
            content: `
        <h1>Module 1: Web Security Fundamentals</h1>
        <h2>Introduction to the Web</h2>
        <p>Before we can exploit web applications, we must master the language of the web: <strong>HTTP</strong>. Every attack, from SQL Injection to XSS, relies on manipulating HTTP requests and responses.</p>

        <h2>The Request-Response Cycle</h2>
        <p>The standard interaction involves a Client (your browser) sending a <strong>Request</strong> and the Server returning a <strong>Response</strong>.</p>

        \`\`\`mermaid
        sequenceDiagram
            participant Client as Browser
            participant Server as Web Server
            participant DB as Database

            Client->>Server: HTTP GET /login
            Server-->>Client: 200 OK (Login Page)
            Client->>Server: POST /login (user=admin, pass=123)
            Server->>DB: SELECT * FROM users (Auth Check)
            DB-->>Server: User Found
            Server-->>Client: 302 Redirect /dashboard
        \`\`\`

        <h2>HTTP Deep Dive</h2>
        <p>HTTP is a plaintext protocol. If you intercept it (using Wireshark or Burp Suite), you can read everything.</p>
        
        <h3>Anatomy of a Request</h3>
        \`\`\`http
        GET /admin HTTP/1.1
        Host: target-bank.com
        Cookie: session=secret_id
        User-Agent: Mozilla/5.0
        \`\`\`
        <p><strong>Method:</strong> GET, POST, PUT, DELETE (Verbs).</p>
        <p><strong>Headers:</strong> Metadata like Cookies, User-Agent.</p>

        <h2>HTTPS: The Secure Layer</h2>
        <p>HTTPS wraps HTTP in a TLS (Transport Layer Security) tunnel. It ensures:</p>
        <ul>
            <li><strong>Encryption:</strong> No one can read the data.</li>
            <li><strong>Integrity:</strong> No one modified the data.</li>
            <li><strong>Authentication:</strong> You are talking to the real server (Verified by Certificates).</li>
        </ul>

        <h2>Why it Matters</h2>
        <p>In 2024, a major breach occurred because a startup used HTTP for their internal admin panel login. Attackers sniffed the credentials from a coffee shop Wi-Fi.</p>
        
        <h2>YouTube Video</h2>
        <p><strong>Title:</strong> HTTP Crash Course & Security<br>
        <strong>Link:</strong> <a href="https://www.youtube.com/watch?v=iYM2zFP3Zn0" target="_blank">https://www.youtube.com/watch?v=iYM2zFP3Zn0</a></p>
      `,
            questions: [
                {
                    id: 'q1',
                    question: 'What is the primary purpose of HTTPS?',
                    options: ['To make websites load faster', 'To encrypt data between the client and server', 'To improve website design', 'To store user passwords securely'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: 'HTTPS (Hypertext Transfer Protocol Secure) uses TLS to encrypt communications, preventing attackers from reading sensitive data.'
                },
                {
                    id: 'q1-2',
                    question: 'What is a "Response" in the context of web traffic?',
                    options: ['The user clicking a button', 'The server sending data back to the client', 'The browser closing', 'The internet disconnecting'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: 'A response is the message sent by the server to the client after receiving a request.'
                },
                {
                    id: 'q1-3',
                    question: 'Which tool is commonly used to intercept and analyze HTTP traffic?',
                    options: ['Photoshop', 'Wireshark', 'Excel', 'VLC Media Player'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: 'Wireshark and Burp Suite are standard tools for sniffing and analyzing network traffic.'
                },
                {
                    id: 'q1-4',
                    question: 'What status code indicates a successful HTTP request?',
                    options: ['404 Not Found', '500 Internal Server Error', '200 OK', '302 Found'],
                    correctAnswer: 2,
                    difficulty: 'easy',
                    explanation: '200 OK is the standard response for successful HTTP requests.'
                },
                {
                    id: 'q1-5',
                    question: 'Which header typically contains the session ID?',
                    options: ['User-Agent', 'Cookie', 'Accept', 'Host'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: 'The Cookie header usually carries the session ID used for state management.'
                }
            ]
        },
        {
            id: 'vu-mod-2',
            title: '2. Sessions, AuthN & AuthZ',
            description: 'Understanding how we prove identity and permission.',
            course_id: 'vu-web-security',
            order: 2,
            module_order: 2,
            content: `
        <h1>Module 2: Sessions, AuthN & AuthZ</h1>
        <h2>The Big Three</h2>
        <p><strong>1. Authentication (AuthN):</strong> "Who are you?" (Login)</p>
        <p><strong>2. Authorization (AuthZ):</strong> "What are you allowed to do?" (Permissions)</p>
        <p><strong>3. Session Management:</strong> Remembering who you are after you log in.</p>

        <h2>Cookies & Sessions</h2>
        <p>Since HTTP is stateless (it forgets you immediately), we use <strong>Cookies</strong> to store a <strong>Session ID</strong>. If an attacker steals your Session ID (Session Hijacking), they become you.</p>

        <h3>Critical Cookie Attributes</h3>
        <ul>
            <li><strong>Secure:</strong> Only send over HTTPS.</li>
            <li><strong>HttpOnly:</strong> JavaScript cannot read this cookie (Prevents XSS theft).</li>
            <li><strong>SameSite:</strong> strict/lax rules to prevent CSRF.</li>
        </ul>
      `,
            questions: [
                {
                    id: 'q2',
                    question: 'Which cookie attribute prevents JavaScript from accessing the cookie?',
                    options: ['Secure', 'HttpOnly', 'SameSite', 'Max-Age'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: 'The HttpOnly flag directs the browser not to expose the cookie to client-side scripts (like JavaScript), mitigating XSS risks.'
                },
                {
                    id: 'q3',
                    question: 'A user logs in successfully but cannot access the admin page. This is an issue of:',
                    options: ['Authentication', 'Authorization', 'Session Fixation', 'Input Validation'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: 'Authorization determines what an authenticated user is permitted to do. The user is authenticated (logged in) but not authorized for the admin page.'
                },
                {
                    id: 'q2-3',
                    question: 'What is the purpose of the "Secure" cookie attribute?',
                    options: ['Encrypts the cookie value', 'Ensures cookie is sent only over HTTPS', 'Prevents deletion', 'Hides cookie from user'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: 'The Secure attribute ensures the cookie is only transmitted over encrypted (HTTPS) connections.'
                },
                {
                    id: 'q2-4',
                    question: 'Authentication answers which question?',
                    options: ['What can you do?', 'Where are you from?', 'Who are you?', 'How did you get here?'],
                    correctAnswer: 2,
                    difficulty: 'easy',
                    explanation: 'Authentication (AuthN) verifies the identity of the user.'
                },
                {
                    id: 'q2-5',
                    question: 'What vulnerability allows an attacker to use a stolen Session ID?',
                    options: ['Session Hijacking', 'SQL Injection', 'Buffer Overflow', 'Path Traversal'],
                    correctAnswer: 0,
                    difficulty: 'medium',
                    explanation: 'Session Hijacking involves stealing a valid session ID to impersonate a user.'
                }
            ]
        },
        {
            id: 'vu-mod-3',
            title: '3. Threats & Attack Vectors',
            description: 'How attackers think: Sniffing, Hijacking, and Validation bypass.',
            course_id: 'vu-web-security',
            order: 3,
            module_order: 3,
            content: `
          <h1>Module 3: Threats & Attack Vectors</h1>
          <h2>Common Attacks</h2>
          <h3>1. Sniffing</h3>
          <p>Capturing unencrypted traffic. <strong>Mitigation:</strong> HTTPS.</p>
          
          <h3>2. Session Hijacking</h3>
          <p>Stealing a valid session ID. <strong>Mitigation:</strong> HttpOnly cookies, Session Timeout.</p>
          
          <h3>3. Lack of Input Validation</h3>
          <p>Trusting user input leads to SQL Injection, XSS, etc. <strong>Rule #1: Never Trust User Input.</strong></p>

          <h2>Real World Example</h2>
          <p>Changing parameters in the URL (e.g., ?id=5 to ?id=6) to see someone else's data is a form of attack called IDOR (Insecure Direct Object Reference).</p>
        `,
            questions: [
                {
                    id: 'q5',
                    question: "Where is the most critical place to perform input validation?",
                    options: ['In the HTML form', 'In the JavaScript', 'On the server-side', 'In the database'],
                    correctAnswer: 2,
                    difficulty: 'hard',
                    explanation: "Client-side validation can be bypassed. Server-side validation is mandatory."
                },
                {
                    id: 'q5-2',
                    question: "What is Sniffing?",
                    options: ['Smelling hardware issues', 'Capturing network traffic', 'Deleting logs', 'Encrypting data'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: "Sniffing involves intercepting and capturing data packets traversing a network."
                },
                {
                    id: 'q5-3',
                    question: "Modifying URL parameters (e.g. ?id=5 to ?id=6) to access other data is known as:",
                    options: ['IDOR', 'Phishing', 'DDoS', 'Ransomware'],
                    correctAnswer: 0,
                    difficulty: 'medium',
                    explanation: "IDOR (Insecure Direct Object Reference) occurs when an application exposes a reference to an internal implementation object."
                },
                {
                    id: 'q5-4',
                    question: "What is the best mitigation for Sniffing attacks?",
                    options: ['Use strong passwords', 'Use HTTPS (Encryption)', 'Use a firewall', 'Use antivirus'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: "Encryption (HTTPS) prevents sniffers from reading the content of captured traffic."
                },
                {
                    id: 'q5-5',
                    question: "What should you assume about all user input?",
                    options: ['It is safe', 'It is trustworthy', 'It is malicious/untrusted', 'It is formatted correctly'],
                    correctAnswer: 2,
                    difficulty: 'easy',
                    explanation: "Security Rule #1: Never Trust User Input."
                }
            ]
        },
        {
            id: 'vu-mod-4',
            title: '4. OWASP A01: Broken Access Control',
            description: 'The #1 vulnerability: Users accessing what they shouldn\'t.',
            course_id: 'vu-web-security',
            order: 4,
            module_order: 4,
            content: `
          <h1>Module 4: Broken Access Control (A01)</h1>
          <h2>What is it?</h2>
          <p>When a user can access data or perform actions they are not authorized for.</p>

          <h2>Common Types</h2>
          <ul>
            <li><strong>IDOR (Insecure Direct Object Reference):</strong> Changing an ID in a URL (e.g., /invoice/100 to /invoice/101).</li>
            <li><strong>Privilege Escalation:</strong> A user force-browsing to /adminUrl to gain admin powers.</li>
            <li><strong>CORS Misconfiguration:</strong> Allowing unauthorized sites to read your API data.</li>
          </ul>

          <h2>Lab: Broken Access Control</h2>
          <p>In this lab, you will act as an attacker trying to view other users' profiles by manipulating ID parameters.</p>
          
          <div style="margin: 20px 0; padding: 20px; background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 8px; text-align: center;">
            <p style="color: #00FF88; font-weight: bold; margin-bottom: 15px;">Ready to exploit IDOR?</p>
            <button data-lesson-action="launch-lab" data-lab-id="broken-access-control" style="background-color: #00FF88; color: black; padding: 12px 24px; border-radius: 6px; font-weight: bold; border: none; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#00CC66'" onmouseout="this.style.backgroundColor='#00FF88'">Launch Broken Access Control Lab</button>
          </div>
        `,
            questions: [
                {
                    id: 'q4',
                    question: "An attacker changes ?user_id=123 to ?user_id=124 and views another profile. This is:",
                    options: ['SQL Injection', 'XSS', 'IDOR', 'Broken Authentication'],
                    correctAnswer: 2,
                    difficulty: 'medium',
                    explanation: "IDOR (Insecure Direct Object Reference) is a type of Access Control failure."
                },
                {
                    id: 'q4-2',
                    question: "What is Privilege Escalation?",
                    options: ['Running faster code', 'Gaining higher permissions than authorized', 'Upgrading software', 'Increasing server RAM'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "Privilege Escalation occurs when a user gains access to resources reserved for higher-privileged accounts."
                },
                {
                    id: 'q4-3',
                    question: "What does A01 Broken Access Control refer to?",
                    options: ['Password guessing', 'Users acting outside their intended permissions', 'Server crashing', 'Slow database'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: "It covers vulnerabilities where restrictions on what authenticated users can do are not properly enforced."
                },
                {
                    id: 'q4-4',
                    question: "Which of these is a CORS misconfiguration risk?",
                    options: ['Slow loading images', 'Unauthorized sites reading API data', 'Broken layout', 'Server timeout'],
                    correctAnswer: 1,
                    difficulty: 'hard',
                    explanation: "Overly permissive CORS headers can allow arbitrary websites to read sensitive data from your API."
                },
                {
                    id: 'q4-5',
                    question: "Force browsing to /adminUrl is an example of:",
                    options: ['Broken Access Control', 'Phishing', 'Social Engineering', 'Insecure Deserialization'],
                    correctAnswer: 0,
                    difficulty: 'medium',
                    explanation: "Accessing hidden or restricted URLs without proper authorization checks is a Broken Access Control issue."
                }
            ]
        },
        {
            id: 'vu-mod-5',
            title: '5. OWASP A02: Cryptographic Failures',
            description: 'Failures in protecting sensitive data causing breaches.',
            course_id: 'vu-web-security',
            order: 5,
            module_order: 5,
            content: `
          <h1>Module 5: Cryptographic Failures (A02)</h1>
          <h2>The Problem</h2>
          <p>Previously known as "Sensitive Data Exposure". It happens when we don't encrypt data properly.</p>

          <h2>Key Failures</h2>
          <ul>
            <li>Using weak hashes (MD5, SHA1) for passwords.</li>
            <li>Hardcoding keys in source code.</li>
            <li>Transmitting data as HTTP (no TLS).</li>
          </ul>

          <h2>Solution</h2>
          <p>Use <strong>bcrypt</strong> or <strong>Argon2</strong> for passwords. Always use HTTPS. Use a Key Vault for secrets.</p>

          <h2>Lab: Cryptographic Failures</h2>
          <p>Analyze how weak encryption allows attackers to crack passwords and steal data.</p>

          <div style="margin: 20px 0; padding: 20px; background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 8px; text-align: center;">
            <p style="color: #00FF88; font-weight: bold; margin-bottom: 15px;">Can you crack the code?</p>
            <button data-lesson-action="launch-lab" data-lab-id="cryptographic-failures" style="background-color: #00FF88; color: black; padding: 12px 24px; border-radius: 6px; font-weight: bold; border: none; cursor: pointer;">Launch Cryptographic Failures Lab</button>
          </div>
        `,
            questions: [
                {
                    id: 'm2-q3',
                    question: "Storing passwords using unsalted MD5 is a:",
                    options: ['Broken Access Control', 'Cryptographic Failure', 'Insecure Design', 'Vulnerable Component'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "MD5 is weak and unsalted hashes are vulnerable to rainbow tables."
                },
                {
                    id: 'm5-q2',
                    question: "What should you use instead of plain HTTP?",
                    options: ['FTP', 'HTTPS', 'Telnet', 'SMTP'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: "HTTPS provides encryption for data in transit."
                },
                {
                    id: 'm5-q3',
                    question: "Why should you avoid hardcoding API keys in source code?",
                    options: ['It makes code ugly', 'Anyone with code access can steal them', 'Compiler errors', 'It slows execution'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: "Source code is often shared or visible; secrets should be in environment variables or vaults."
                },
                {
                    id: 'm5-q4',
                    question: "Which of these is a secure algorithm for password hashing?",
                    options: ['Base64', 'MD5', 'SHA-1', 'Bcrypt'],
                    correctAnswer: 3,
                    difficulty: 'medium',
                    explanation: "Bcrypt (and Argon2) are designed to be slow and salt automatically, making them safe for passwords."
                },
                {
                    id: 'm5-q5',
                    question: "What does encryption provide?",
                    options: ['Confidentiality', 'Availability', 'Speed', 'Usability'],
                    correctAnswer: 0,
                    difficulty: 'easy',
                    explanation: "Encryption ensures data is kept confidential and readable only by authorized parties."
                }
            ]
        },
        {
            id: 'vu-mod-6',
            title: '6. OWASP A03: Injection Attacks',
            description: 'SQLi, Command Injection, and how to stop them.',
            course_id: 'vu-web-security',
            order: 6,
            module_order: 6,
            content: `
          <h1>Module 6: Injection (A03)</h1>
          <h2>Concept</h2>
          <p>Injection happens when untrusted user data is sent to an interpreter as part of a command or query.</p>

          <h2>SQL Injection (SQLi)</h2>
          <p>The most famous injection. Attackers insert SQL commands into input fields.</p>
          <p><code>SELECT * FROM users WHERE name = '' OR '1'='1';</code></p>
          <p>This trick forces the database to return all records because 1=1 is always true.</p>

          <h2>Defense</h2>
          <p><strong>Prepared Statements (Parameterized Queries).</strong> This separates code from data.</p>

          <h2>Lab: SQL Injection</h2>
          <p>Inject SQL payloads to bypass authentication and dump the database.</p>

          <div style="margin: 20px 0; padding: 20px; background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 8px; text-align: center;">
            <p style="color: #00FF88; font-weight: bold; margin-bottom: 15px;">Deploy the Payload</p>
            <button data-lesson-action="launch-lab" data-lab-id="sql-injection" style="background-color: #00FF88; color: black; padding: 12px 24px; border-radius: 6px; font-weight: bold; border: none; cursor: pointer;">Launch SQL Injection Lab</button>
          </div>
        `,
            questions: [
                {
                    id: 'm2-q2',
                    question: "What is the most effective defense against SQL Injection?",
                    options: ['WAF', "Blacklisting '", 'Prepared statements', 'HTTPS'],
                    correctAnswer: 2,
                    difficulty: 'easy',
                    explanation: "Prepared statements ensure input is treated as data, not code."
                },
                {
                    id: 'm6-q2',
                    question: "What does SQLi stand for?",
                    options: ['Sequential Query Language Input', 'Structured Query Language Injection', 'Simple Query Logic Interface', 'Server Query Link Index'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: "SQLi stands for SQL Injection."
                },
                {
                    id: 'm6-q3',
                    question: "Which query condition is commonly used to bypass authentication in SQLi?",
                    options: ["'1'='1'", "'user'='admin'", "'pass'='123'", "TRUE=FALSE"],
                    correctAnswer: 0,
                    difficulty: 'medium',
                    explanation: "'1'='1' is a tautology (always true) used to manipulate query logic."
                },
                {
                    id: 'm6-q4',
                    question: "Injection attacks occur when:",
                    options: ['Untrusted data is sent to an interpreter', 'Passwords are weak', 'Server is slow', 'Network is unencrypted'],
                    correctAnswer: 0,
                    difficulty: 'medium',
                    explanation: "Injection happens when data is mistaken for code by an interpreter."
                },
                {
                    id: 'm6-q5',
                    question: "Besides SQL, what else is vulnerable to injection?",
                    options: ['HTML (XSS)', 'OS Commands', 'LDAP', 'All of the above'],
                    correctAnswer: 3,
                    difficulty: 'medium',
                    explanation: "Injection can happen in SQL, LDAP, OS commands, XML, and more."
                }
            ]
        },
        {
            id: 'vu-mod-7',
            title: '7. OWASP A04 & A05: Design & Config',
            description: 'Insecure Design and Security Misconfiguration.',
            course_id: 'vu-web-security',
            order: 7,
            module_order: 7,
            content: `
          <h1>Module 7: Design & Configuration</h1>
          <h2>A04: Insecure Design</h2>
          <p>Flaws in the architecture itself. "Secure by Design" is the solution. Example: Not limiting how many times someone can guess a coupon code.</p>

          <div style="margin: 10px 0; padding: 15px; border: 1px solid #333; border-radius: 6px;">
            <h4 style="color:#00FF88; margin-top:0;">Lab: Insecure Design</h4>
            <p style="font-size: 0.9em;">Exploit architectural flaws.</p>
            <button data-lesson-action="launch-lab" data-lab-id="insecure-design" style="background-color: #00B37A; color: black; padding: 8px 16px; border-radius: 4px; border: none; font-weight: bold; cursor: pointer;">Open Lab</button>
          </div>

          <h2>A05: Security Misconfiguration</h2>
          <p>Leaving default passwords (admin/admin), showing full error traces to users, or leaving S3 buckets open.</p>

          <div style="margin: 10px 0; padding: 15px; border: 1px solid #333; border-radius: 6px;">
            <h4 style="color:#00FF88; margin-top:0;">Lab: Misconfiguration</h4>
            <p style="font-size: 0.9em;">Find the hidden leaks.</p>
            <button data-lesson-action="launch-lab" data-lab-id="security-misconfiguration" style="background-color: #00B37A; color: black; padding: 8px 16px; border-radius: 4px; border: none; font-weight: bold; cursor: pointer;">Open Lab</button>
          </div>
        `,
            questions: [
                {
                    id: 'm2-q6',
                    question: "Insecure Design is:",
                    options: ['A coding error', 'A runtime config error', 'An architectural flaw', 'A library issue'],
                    correctAnswer: 2,
                    difficulty: 'medium',
                    explanation: "It refers to logical or architectural flaws that cannot be fixed just by coding better."
                },
                {
                    id: 'm2-q7',
                    question: "Leaving /phpinfo.php accessible is:",
                    options: ['Access Control', 'Injection', 'Security Misconfiguration', 'SSRF'],
                    correctAnswer: 2,
                    difficulty: 'easy',
                    explanation: "It offers unnecessary info to attackers, hence a misconfiguration."
                },
                {
                    id: 'm7-q3',
                    question: "Using default credentials (admin/admin) is an example of:",
                    options: ['Security Misconfiguration', 'Insecure Design', 'Broken Access Control', 'Injection'],
                    correctAnswer: 0,
                    difficulty: 'easy',
                    explanation: "Leaving default configurations active is a classic Security Misconfiguration."
                },
                {
                    id: 'm7-q4',
                    question: "How can you prevent Insecure Design?",
                    options: ['Write code faster', 'Threat Modeling and Secure Design patterns', 'Use more firewalls', 'Disable logging'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "Insecure design is fixed by better planning, threat modeling, and following secure architecture patterns."
                },
                {
                    id: 'm7-q5',
                    question: "Displaying full stack traces to users is dangerous because:",
                    options: ['It looks ugly', 'It reveals internal system details to attackers', 'It slows down the browser', 'It consumes bandwidth'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "Stack traces can leak paths, versions, and logic that help attackers plan further attacks."
                }
            ]
        },
        {
            id: 'vu-mod-8',
            title: '8. Vulnerable Components & Auth Failures',
            description: 'OWASP A06 and A07.',
            course_id: 'vu-web-security',
            order: 8,
            module_order: 8,
            content: `
          <h1>Module 8: Components & Auth</h1>
          <h2>A06: Vulnerable and Outdated Components</h2>
          <p>Using libraries with known CVEs (like Log4j). You are only as secure as your weakest dependency.</p>

           <div style="margin: 20px 0; padding: 20px; background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 8px; text-align: center;">
            <p style="color: #00FF88; font-weight: bold; margin-bottom: 15px;">Exploit Weak Dependencies</p>
            <button data-lesson-action="launch-lab" data-lab-id="vulnerable-components" style="background-color: #00FF88; color: black; padding: 12px 24px; border-radius: 6px; font-weight: bold; border: none; cursor: pointer;">Launch Vulnerable Components Lab</button>
          </div>

          <h2>A07: Identification & Authentication Failures</h2>
          <p>Allowing weak passwords, no MFA, or permitting Credential Stuffing attacks.</p>
        `,
            questions: [
                {
                    id: 'm3-q1',
                    question: "Which tool identifies known vulnerabilities in dependencies?",
                    options: ['Burp Suite', 'ZAP', 'OWASP Dependency-Check', 'Nmap'],
                    correctAnswer: 2,
                    difficulty: 'easy',
                    explanation: "Dependency-Check scans usage of libraries against CVE databases."
                },
                {
                    id: 'm8-q2',
                    question: "What is a CVE?",
                    options: ['Common Vulnerabilities and Exposures', 'Computer Virus Elimination', 'Critical Value Error', 'Code Verification Entity'],
                    correctAnswer: 0,
                    difficulty: 'easy',
                    explanation: "CVE is a list of publicly disclosed cybersecurity vulnerabilities."
                },
                {
                    id: 'm8-q3',
                    question: "Credential Stuffing relies on:",
                    options: ['Users reusing passwords across sites', 'Complex passwords', 'MFA being enabled', 'Encryption being broken'],
                    correctAnswer: 0,
                    difficulty: 'medium',
                    explanation: "Credential Stuffing works because users recycle passwords; attackers try breached credentials on other sites."
                },
                {
                    id: 'm8-q4',
                    question: "What is an effective defense against Credential Stuffing?",
                    options: ['MFA (Multi-Factor Authentication)', 'Shorter passwords', 'No captcha', 'Using HTTP'],
                    correctAnswer: 0,
                    difficulty: 'medium',
                    explanation: "MFA stops attackers even if they have the correct password."
                },
                {
                    id: 'm8-q5',
                    question: "Why is Log4j (Log4Shell) a famous example of A06?",
                    options: ['It was a vulnerable component used everywhere', 'It was a SQL injection', 'It was a weak password', 'It was a design flaw'],
                    correctAnswer: 0,
                    difficulty: 'easy',
                    explanation: "Log4j was a widely used library with a critical RCE vulnerability (Vulnerable Component)."
                }
            ]
        },
        {
            id: 'vu-mod-9',
            title: '9. Advanced Risks (A08-A10)',
            description: 'SSRF, Logging Failures, and Integrity issues.',
            course_id: 'vu-web-security',
            order: 9,
            module_order: 9,
            content: `
            <h1>Module 9: Advanced Risks</h1>
            <h2>A08: Software and Data Integrity Failures</h2>
            <p>Code or updates coming from untrusted sources, or Insecure Deserialization.</p>

            <h2>A09: Logging & Monitoring Failures</h2>
            <p>Not recording logins or failed attacks allows breaches to persist for months.</p>

            <h2>A10: Server-Side Request Forgery (SSRF)</h2>
            <p>Tricking the server into fetching data from the internal network (like AWS Metadata at 169.254.169.254).</p>
         `,
            questions: [
                {
                    id: 'm3-q7',
                    question: "AWS metadata is typically found at:",
                    options: ['127.0.0.1', '192.168.1.1', '8.8.8.8', '169.254.169.254'],
                    correctAnswer: 3,
                    difficulty: 'hard',
                    explanation: "169.254.169.254 is the link-local address for cloud metadata."
                },
                {
                    id: 'm9-q2',
                    question: "What is SSRF?",
                    options: ['Server-Side Request Forgery', 'Super Secure Remote File', 'Simple Server Routing Function', 'Secure Socket Relay Function'],
                    correctAnswer: 0,
                    difficulty: 'easy',
                    explanation: "SSRF stands for Server-Side Request Forgery."
                },
                {
                    id: 'm9-q3',
                    question: "Logging failures allow attackers to:",
                    options: ['Steal passwords directly', 'Persist in a network undetected', 'Crash the server', 'See the UI'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "Without logs, you cannot detect that an attack is happening or investigate how it happened."
                },
                {
                    id: 'm9-q4',
                    question: "Insecure Deserialization can lead to:",
                    options: ['Remote Code Execution (RCE)', 'Better performance', 'Smaller file sizes', 'Faster database queries'],
                    correctAnswer: 0,
                    difficulty: 'hard',
                    explanation: "Deserializing untrusted data can allow attackers to execute arbitrary code (RCE)."
                },
                {
                    id: 'm9-q5',
                    question: "What should you NOT log?",
                    options: ['Failed login attempts', 'System errors', 'User passwords / Credit Card numbers', 'Transaction IDs'],
                    correctAnswer: 2,
                    difficulty: 'easy',
                    explanation: "Never log sensitive data (PII, PCI, Credentials)."
                }
            ]
        },
        {
            id: 'vu-mod-10',
            title: '10. Secure SDLC',
            description: 'Building security in from the start.',
            course_id: 'vu-web-security',
            order: 10,
            module_order: 10,
            content: `
            <h1>Module 10: Secure SDLC</h1>
            <h2>Shift Left</h2>
            <p>Test for security early. Don't wait for a pen-test 2 days before launch.</p>
            
            <h2>Threat Modeling</h2>
            <p>Using STRIDE to identify design flaws before writing code.</p>

            <h2>SAST vs DAST</h2>
            <p><strong>SAST:</strong> Scanning source code (White box).</p>
            <p><strong>DAST:</strong> Scanning the running app (Black box).</p>
        `,
            questions: [
                {
                    id: 'm4-q1',
                    question: "What does 'Shift-Left' mean?",
                    options: ['Delay testing', 'Move security earlier in SDLC', 'Hire more devs', 'Use Linux'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: "Doing security tasks earlier in the process."
                },
                {
                    id: 'm10-q2',
                    question: "What is Threat Modeling?",
                    options: ['Making scary graphics', 'Identifying potential threats during design', 'Hacking a live server', 'Installing antivirus'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "Threat Modeling is a pro-active design phase activity to identify risks."
                },
                {
                    id: 'm10-q3',
                    question: "SAST stands for:",
                    options: ['Static Application Security Testing', 'Simple App Security Tool', 'Server Admin System Test', 'Secure Apps Static Test'],
                    correctAnswer: 0,
                    difficulty: 'medium',
                    explanation: "SAST is Static Application Security Testing (White box)."
                },
                {
                    id: 'm10-q4',
                    question: "DAST involves:",
                    options: ['Reading source code', 'Testing a running application', 'Checking database schemas', 'Interviewing developers'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "DAST (Dynamic Application Security Testing) interacts with the running application (Black box)."
                },
                {
                    id: 'm10-q5',
                    question: "STRIDE is a mnemonic for:",
                    options: ['Coding standards', 'Threat categories', 'Password rules', 'Firewall types'],
                    correctAnswer: 1,
                    difficulty: 'hard',
                    explanation: "STRIDE (Spoofing, Tampering, Repudiation, Info Disclosure, Denial of Service, Elevation of Priv) categories threats."
                }
            ]
        },
        {
            id: 'vu-mod-11',
            title: '11. Active Defense',
            description: 'Pen-testing, WAFs, and Incident Response.',
            course_id: 'vu-web-security',
            order: 11,
            module_order: 11,
            content: `
            <h1>Module 11: Active Defense</h1>
            <h2>Penetration Testing</h2>
            <p>Ethical Hacking to find bugs before criminals do.</p>

            <h2>WAF (Web Application Firewall)</h2>
            <p>A firewall that inspects HTTP traffic to block attacks like SQLi.</p>

            <h2>Incident Response</h2>
            <p>Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned.</p>
            
            <h3>YouTube Video</h3>
            <p><strong>Title:</strong> Web App Penetration Testing<br>
            <strong>Link:</strong> <a href="https://www.youtube.com/watch?v=2_lswM1S264" target="_blank">https://www.youtube.com/watch?v=2_lswM1S264</a></p>
        `,
            questions: [
                {
                    id: 'm11-q1',
                    question: "Difference between Vuln Assessment and Pen Test?",
                    options: ['Cost', 'Pen tests exploit findings', 'Tools', 'People'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "Pen tests verify risk by exploiting the vulnerability."
                },
                {
                    id: 'm11-q2',
                    question: "What is a WAF?",
                    options: ['Web Application Firewall', 'Wide Area Fence', 'Wireless Access Finder', 'Web Admin Function'],
                    correctAnswer: 0,
                    difficulty: 'easy',
                    explanation: "A WAF filters, monitors, and blocks HTTP traffic to and from a web application."
                },
                {
                    id: 'm11-q3',
                    question: "Which phase comes first in Incident Response?",
                    options: ['Eradication', 'Recovery', 'Preparation', 'Lessons Learned'],
                    correctAnswer: 2,
                    difficulty: 'medium',
                    explanation: "Preparation is the key first step to ensuring you can handle an incident when it occurs."
                },
                {
                    id: 'm11-q4',
                    question: "Ethical Hacking is also known as:",
                    options: ['Black Hat Hacking', 'White Hat Hacking', 'Grey Hat Hacking', 'Script Kiddie'],
                    correctAnswer: 1,
                    difficulty: 'easy',
                    explanation: "White Hat hackers use their skills to improve security with permission."
                },
                {
                    id: 'm11-q5',
                    question: "Active Defense implies:",
                    options: ['Waiting for an attack', 'Proactively testing and monitoring', 'Disconnecting from the internet', 'Ignoring logs'],
                    correctAnswer: 1,
                    difficulty: 'medium',
                    explanation: "Active defense involves proactive measures like pen-testing and real-time monitoring."
                }
            ]
        },
        {
            id: 'vu-final-exam',
            title: '12. Final Certification Exam',
            description: 'Comprehensive exam covering all modules. Passing this exam unlocks your certificate.',
            course_id: 'vu-web-security',
            order: 12,
            module_order: 12,
            content: `
            <h1>Final Certification Exam</h1>
            <p>Welcome to the Final Exam. This exam consists of <strong>20 questions</strong> selected randomly from all previous modules.</p>
            <p><strong>Rules:</strong></p>
            <ul>
                <li>You must score at least <strong>70%</strong> to pass.</li>
                <li><strong>Strict Proctoring is Active.</strong> You are allowed <strong>ONE warning</strong> for looking away or covering your face.</li>
                <li>A second violation will result in immediate disqualification and a <strong>1-hour lockout</strong>.</li>
            </ul>
            <p>Good luck!</p>
            `,
            questions: [] // Questions will be dynamically generated
        }
    ]
};
