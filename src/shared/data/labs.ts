// Labs data - to be populated with real labs later
export const labs: any[] = [
  {
    id: 'broken-access-control',
    title: 'Broken Access Control',
    description: 'Learn about authorization flaws that allow users to access resources they shouldn\'t have permission to view or modify.',
    difficulty: 'beginner',
    estimatedTime: '30-45 min',
    completed: false,
    tools: ['Browser', 'Developer Tools', 'HTTP Client'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/access-control',
    instructions: `
# Broken Access Control Lab

## Objective
Understand and exploit broken access control vulnerabilities where proper authorization checks are missing or improperly implemented.

## Key Concepts
- **Authorization vs Authentication**: Authentication verifies who you are, authorization determines what you can access
- **Insecure Direct Object References (IDOR)**: Accessing objects by manipulating parameters without proper authorization checks
- **Privilege Escalation**: Gaining higher privileges than intended by the application

## Common Vulnerabilities
- Missing authorization checks on sensitive endpoints
- User can modify their role/permission in requests
- Direct object references without validation
- Horizontal privilege escalation between users
- Vertical privilege escalation to admin functions

## Lab Objectives
1. Identify endpoints without proper authorization
2. Exploit IDOR vulnerabilities to access other users' data
3. Attempt to escalate privileges to admin level
4. Demonstrate the impact of broken access control
    `,
    category: 'Web Security',
  },
  {
    id: 'cryptographic-failures',
    title: 'Cryptographic Failures',
    description: 'Explore how weak cryptography, poor key management, and insecure data transmission lead to data breaches.',
    difficulty: 'intermediate',
    estimatedTime: '45-60 min',
    completed: false,
    tools: ['Browser', 'Burp Suite', 'Hash Cracker'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/crypto',
    instructions: `
# Cryptographic Failures Lab

## Objective
Learn how to identify and exploit weak cryptographic implementations that expose sensitive data.

## Key Concepts
- **Encryption in Transit**: Data should be encrypted when transmitted over networks
- **Encryption at Rest**: Sensitive data should be encrypted when stored
- **Weak Algorithms**: Using outdated or weak encryption methods (MD5, SHA1, DES)
- **Poor Key Management**: Hardcoded keys, weak passwords, insecure storage

## Common Vulnerabilities
- Transmitting sensitive data over HTTP instead of HTTPS
- Using weak hashing algorithms for passwords
- Hardcoded encryption keys in source code
- Inadequate key rotation policies
- Storing passwords in plaintext or with weak hashing

## Lab Objectives
1. Identify unencrypted sensitive data in transit
2. Crack weak password hashes
3. Find hardcoded encryption keys
4. Demonstrate data exposure risks
5. Learn proper cryptographic practices
    `,
    category: 'Web Security',
  },
  {
    id: 'sql-injection',
    title: 'SQL Injection',
    description: 'Master SQL injection attacks by inserting malicious SQL code into input fields to manipulate database queries.',
    difficulty: 'beginner',
    estimatedTime: '30-45 min',
    completed: false,
    tools: ['Browser', 'SQL Client', 'Burp Suite'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/sqli',
    instructions: `
# SQL Injection Lab

## Objective
Understand and exploit SQL injection vulnerabilities where user input is unsafely concatenated into SQL queries.

## Key Concepts
- **Query Concatenation**: Building SQL queries by directly inserting user input
- **Authentication Bypass**: Using SQL injection to bypass login checks
- **Data Exfiltration**: Extracting unauthorized data from the database
- **Data Manipulation**: Modifying or deleting database records

## Common Vulnerabilities
- Unvalidated user input directly in SQL queries
- Missing input sanitization and parameterized queries
- Error messages revealing database structure
- Time-based blind SQL injection
- Boolean-based blind SQL injection

## Lab Objectives
1. Bypass login forms using SQL injection
2. Extract data from unauthorized tables
3. Determine database structure
4. Modify data using injection
5. Delete records from the database
6. Learn about parameterized queries as protection
    `,
    category: 'Web Security',
  },
  {
    id: 'insecure-design',
    title: 'Insecure Design',
    description: 'Discover security flaws that arise from poor architectural decisions and missing security controls in the design phase.',
    difficulty: 'intermediate',
    estimatedTime: '45-60 min',
    completed: false,
    tools: ['Browser', 'Developer Tools', 'API Tester'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/insecure-design',
    instructions: `
# Insecure Design Lab

## Objective
Learn how architectural flaws and missing security controls during design phase lead to vulnerabilities.

## Key Concepts
- **Threat Modeling**: Identifying potential security threats early
- **Security Requirements**: Defining security needs during design
- **Defense in Depth**: Implementing multiple layers of security
- **Secure by Default**: Security should be the default, not an afterthought

## Common Vulnerabilities
- No rate limiting on sensitive operations
- Missing password reset token validation
- No account lockout after failed login attempts
- Business logic flaws in critical operations
- Missing fraud detection mechanisms
- Insufficient logging and monitoring

## Lab Objectives
1. Exploit missing rate limiting
2. Bypass password reset mechanisms
3. Exploit business logic flaws
4. Perform unauthorized operations
5. Understand importance of threat modeling
6. Learn secure design principles
    `,
    category: 'Web Security',
  },
  {
    id: 'security-misconfiguration',
    title: 'Security Misconfiguration',
    description: 'Identify and exploit misconfigurations in servers, frameworks, and applications that expose sensitive information.',
    difficulty: 'beginner',
    estimatedTime: '30-45 min',
    completed: false,
    tools: ['Browser', 'Nmap', 'Server Scanner'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/misconfig',
    instructions: `
# Security Misconfiguration Lab

## Objective
Discover how improper configuration of security settings exposes applications to attacks.

## Key Concepts
- **Default Credentials**: Unchanged default usernames and passwords
- **Debug Mode**: Leaving debug/verbose error messages enabled in production
- **Directory Listing**: Web servers configured to display directory contents
- **Unnecessary Services**: Running unneeded services and ports
- **Security Headers**: Missing HTTP security headers

## Common Vulnerabilities
- Default admin credentials still active
- Stack traces revealing application structure
- Directory listing enabled on web server
- Outdated libraries and dependencies
- Verbose error messages in production
- Missing or misconfigured security headers
- Unnecessary HTTP methods enabled (PUT, DELETE)

## Lab Objectives
1. Find and use default credentials
2. Access directory listings
3. Identify and exploit verbose error messages
4. Discover hidden files and configurations
5. Exploit outdated dependencies
6. Understand importance of proper hardening
    `,
    category: 'Web Security',
  },
  {
    id: 'vulnerable-components',
    title: 'Vulnerable Components',
    description: 'Learn how known vulnerabilities in libraries and dependencies can be exploited to compromise applications.',
    difficulty: 'advanced',
    estimatedTime: '60-90 min',
    completed: false,
    tools: ['Browser', 'Dependency Scanner', 'Exploit Tools'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/vuln-components',
    instructions: `
# Vulnerable Components Lab

## Objective
Understand how using libraries and components with known vulnerabilities creates security risks.

## Key Concepts
- **Dependency Management**: Tracking and updating third-party libraries
- **CVE (Common Vulnerabilities and Exposures)**: Publicly documented vulnerabilities
- **Supply Chain Attack**: Compromising applications through vulnerable dependencies
- **Patching**: Keeping software up-to-date with security fixes

## Common Vulnerabilities
- Using outdated versions of frameworks (Express, Django, Rails)
- Vulnerable JavaScript libraries with known exploits
- Unpatched database systems
- Vulnerable authentication libraries
- Outdated cryptographic libraries
- Known RCE (Remote Code Execution) vulnerabilities in components

## Lab Objectives
1. Identify known vulnerabilities in dependencies
2. Exploit CVE vulnerabilities in components
3. Perform Remote Code Execution
4. Understand supply chain risks
5. Learn dependency scanning tools
6. Implement secure update policies
    `,
    category: 'Web Security',
  },
  // NLP Labs
  {
    id: 'nlp-text-basics',
    title: 'Text Basics',
    description: 'Introduction to basic text processing techniques including string manipulation, formatting, and regular expressions.',
    difficulty: 'beginner',
    estimatedTime: '20-30 min',
    completed: false,
    tools: ['Python', 'NLTK', 'Regex'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/text-basics',
    instructions: `
# NLP Text Basics Lab

## Objective
Learn the fundamental techniques for handling and processing text data.

## Key Concepts
- **String Manipulation**: Basic operations on text strings
- **Regular Expressions**: Pattern matching in text
- **Text Normalization**: Cleaning and standardizing text
- **Tokenization**: Breaking text into units

## Lab Objectives
1. Perform basic string operations
2. precise pattern matching with regex
3. Clean and normalize text data
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-preprocessing',
    title: 'Text Preprocessing',
    description: 'Learn essential preprocessing steps like tokenization, stemming, lemmatization, and stop word removal.',
    difficulty: 'beginner',
    estimatedTime: '30-45 min',
    completed: false,
    tools: ['Python', 'NLTK', 'Spacy'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/preprocessing',
    instructions: `
# NLP Preprocessing Lab

## Objective
Master the art of preparing text data for NLP models.

## Key Concepts
- **Tokenization**: Word and sentence segmentation
- **Stop Words**: Removing common non-informative words
- **Stemming & Lemmatization**: Reducing words to root forms
- **Noise Removal**: Cleaning unwanted characters

## Lab Objectives
1. Tokenize text into words and sentences
2. Remove stop words and punctuation
3. Apply stemming and lemmatization
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-vectorization',
    title: 'Vectorization',
    description: 'Convert text into numerical vectors using Bag of Words, TF-IDF, and other encoding techniques.',
    difficulty: 'intermediate',
    estimatedTime: '45-60 min',
    completed: false,
    tools: ['Python', 'Scikit-learn'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/vectorization',
    instructions: `
# NLP Vectorization Lab

## Objective
Learn how to transform text into numerical representations for machine learning.

## Key Concepts
- **Bag of Words (BoW)**: Frequency-based representation
- **TF-IDF**: Term Frequency-Inverse Document Frequency
- **One-Hot Encoding**: Binary representation of tokens

## Lab Objectives
1. Implement Bag of Words model
2. Calculate TF-IDF scores
3. Compare different vectorization strategies
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-classification',
    title: 'Text Classification',
    description: 'Build text classification models to categorize documents into predefined classes.',
    difficulty: 'intermediate',
    estimatedTime: '45-60 min',
    completed: false,
    tools: ['Python', 'Scikit-learn', 'NLTK'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/classification',
    instructions: `
# NLP Text Classification Lab

## Objective
Build and evaluate models to classify text into categories.

## Key Concepts
- **Supervised Learning**: Training on labeled data
- **Naive Bayes**: Probabilistic classifier
- **Evaluation Metrics**: Precision, Recall, F1-Score

## Lab Objectives
1. Prepare labeled dataset
2. Train a Naive Bayes classifier
3. Evaluate model performance
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-topic-modeling',
    title: 'Topic Modeling',
    description: 'Uncover hidden topics in large document collections using techniques like LDA.',
    difficulty: 'advanced',
    estimatedTime: '60-75 min',
    completed: false,
    tools: ['Python', 'Gensim', 'LDA'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/topic-modeling',
    instructions: `
# NLP Topic Modeling Lab

## Objective
Discover abstract topics within a collection of documents.

## Key Concepts
- **Unsupervised Learning**: Finding patterns without labels
- **Latent Dirichlet Allocation (LDA)**: Generative statistical model
- **Topic Coherence**: Measuring topic quality

## Lab Objectives
1. Preprocess documents for topic modeling
2. Apply LDA to extract topics
3. Visualize and interpret topics
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-embeddings',
    title: 'Word Embeddings',
    description: 'Explore dense vector representations of words using Word2Vec and GloVe.',
    difficulty: 'advanced',
    estimatedTime: '60-75 min',
    completed: false,
    tools: ['Python', 'Gensim', 'Word2Vec'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/embeddings',
    instructions: `
# NLP Word Embeddings Lab

## Objective
Understand distributed representations of words in vector space.

## Key Concepts
- **Word2Vec**: CBOW and Skip-gram models
- **Semantic Similarity**: Measuring distance between words
- **Analogies**: Vector arithmetic (King - Man + Woman = Queen)

## Lab Objectives
1. Train a Word2Vec model
2. Visualize word embeddings
3. Perform semantic arithmetic
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-sentiment',
    title: 'Sentiment Analysis',
    description: 'Analyze the sentiment and emotional tone of text data.',
    difficulty: 'intermediate',
    estimatedTime: '45-60 min',
    completed: false,
    tools: ['Python', 'NLTK', 'VADER'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/sentiment',
    instructions: `
# NLP Sentiment Analysis Lab

## Objective
Determine the emotional tone behind a series of words.

## Key Concepts
- **Polarity**: Positive, negative, or neutral sentiment
- **Rule-based methods**: Lexicon-based approaches
- **ML-based methods**: Training identifiers

## Lab Objectives
1. Use VADER for sentiment scoring
2. Train a custom sentiment classifier
3. Analyze real-world reviews
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-ner',
    title: 'Named Entity Recognition',
    description: 'Identify and classify key named entities in text such as people, organizations, and locations.',
    difficulty: 'intermediate',
    estimatedTime: '45-60 min',
    completed: false,
    tools: ['Python', 'Spacy', 'NLTK'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/ner',
    instructions: `
# NLP NER Lab

## Objective
Extract structured information from unstructured text.

## Key Concepts
- **Entities**: Real-world objects (Person, Org, GPE)
- **BIO Tagging**: Beginning, Inside, Outside format
- **Information Extraction**: Structured data from text

## Lab Objectives
1. Use SpaCy for NER
2. Train a custom NER model
3. Extract entities from news articles
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-resume-parser',
    title: 'Resume Parser',
    description: 'Build a system to extract structured information like skills, education, and experience from resumes.',
    difficulty: 'advanced',
    estimatedTime: '60-90 min',
    completed: false,
    tools: ['Python', 'Spacy', 'Regex'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/resume-parser',
    instructions: `
# NLP Resume Parser Lab

## Objective
Automate the extraction of candidate information from resumes.

## Key Concepts
- **Document parsing**: Reading PDF/Docx files
- **Rule-based extraction**: Regex for specific patterns
- **Entity extraction**: Skills, Education, Experience

## Lab Objectives
1. Parse resume file formats
2. Extract contact details
3. Identify skills and education sections
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-neural-net',
    title: 'Neural Networks for NLP',
    description: 'Introduction to deep learning for NLP using RNNs and LSTMs.',
    difficulty: 'pro',
    estimatedTime: '90-120 min',
    completed: false,
    tools: ['Python', 'TensorFlow', 'Keras'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/neural-net',
    instructions: `
# NLP Neural Nets Lab

## Objective
Apply Deep Learning architectures to NLP tasks.

## Key Concepts
- **Feed Forward Networks**: Basic neural nets
- **RNN/LSTM**: Handling sequential data
- **Sequence Modeling**: Predicting next tokens

## Lab Objectives
1. Build a simple RNN
2. Implement an LSTM model
3. Train on sequence data
    `,
    category: 'NLP',
  },
  {
    id: 'nlp-text-gen',
    title: 'Text Generation',
    description: 'Generate creative text using language models and deep learning.',
    difficulty: 'pro',
    estimatedTime: '90-120 min',
    completed: false,
    tools: ['Python', 'Hugging Face', 'Transformers'],
    liveUrl: 'https://vulnarable-labs.onrender.com/lab/nlp/text-gen',
    instructions: `
# NLP Text Generation Lab

## Objective
Generate coherent text using modern language models.

## Key Concepts
- **Language Models**: Predicting probability of word sequences
- **Transformers**: Attention-based architectures
- **Fine-tuning**: Adapting pre-trained models

## Lab Objectives
1. Use pre-trained GPT models
2. Generate text from prompts
3. Fine-tune a small model
    `,
    category: 'NLP',
  },
];