S({
  id: 'textract', cat: 'aiservices', name: 'Amazon Textract', doc: 'textract/',
  tag: 'Extract text, tables, forms and key-value pairs from scanned documents and PDFs.',
  what: 'Textract is OCR that understands document **structure**. Beyond plain text detection it returns tables, form fields as key-value pairs, signatures, layout elements, and answers to natural-language **Queries** ("What is the invoice total?"). Specialised APIs handle expenses, identity documents and lending packages.\n\nIt returns a graph of **blocks** (pages, lines, words, cells) with geometry and confidence scores, which you convert into whatever your pipeline needs.',
  flow: ['PDF / image in S3', 'Start async job', 'Layout + OCR', 'Block graph (JSON)', 'Your parser', 'Clean text / tables'],
  steps: [
    [0, 'A document lands in [[s3]].'],
    [1, 'You call `StartDocumentAnalysis` with the features you need (tables, forms, queries, layout). Single images can use the synchronous API.'],
    [2, 'Textract performs OCR and structure analysis, including handwriting.'],
    [3, 'Completion is signalled by [[sns]]; you fetch paginated results as JSON blocks with relationships.'],
    [4, 'Your code walks the block graph to rebuild tables and reading order.'],
    [5, 'Clean text and structured data go on to chunking, embedding or a database.']
  ],
  gotchas: [
    '**Sync vs async.** Multi-page PDFs need the asynchronous APIs through S3; the synchronous calls suit single pages.',
    '**The raw output is a graph, not text.** Reconstructing tables and reading order is real code. Use helper libraries.',
    '**Confidence is per element.** Route low-confidence fields to human review rather than trusting everything.',
    '**Priced per page and per feature.** Turning on tables, forms and queries together multiplies cost.',
    'Throttling limits apply; use async with queues for large backfills.'
  ],
  edges: [
    'Poor scans, skew and low resolution degrade results. Preprocess if you control capture.',
    'For mixed-media files (documents, images, audio, video) Bedrock\'s data-automation features may extract in one step; compare cost and fidelity.',
    'Layout output helps RAG chunking by keeping headings and sections together.'
  ],
  ml: [
    'Document ingestion step for RAG: scans and PDFs become text for [[bedrock-kb|Knowledge Bases]].',
    'Pair with an LLM: Textract extracts fields reliably, the LLM validates or reasons over them.',
    'Intelligent document processing for invoices, claims and forms with human review loops.'
  ],
  pairs: ['s3', 'comprehend', 'bedrock-kb', 'lambda', 'stepfunctions', 'sm-groundtruth'],
  cost: 'Per page, with different rates per feature (text detection, tables, forms, queries, expense, ID).'
});

S({
  id: 'comprehend', cat: 'aiservices', name: 'Amazon Comprehend', doc: 'comprehend/',
  tag: 'Classic NLP as an API: entities, sentiment, key phrases, language and PII detection.',
  what: 'Comprehend analyses text without any model work: **entities** (people, places, organisations), **sentiment**, **key phrases**, **language**, **syntax**, **toxicity**, and **PII** detection and redaction. You can also train **custom classifiers** and **custom entity recognisers** on your own labelled data.\n\nIt is deterministic, cheap per call, and well-suited to the high-volume, low-ambiguity part of text workflows.',
  flow: ['Text', 'Comprehend API', 'Detect entities / PII / sentiment', 'Structured JSON', 'Route or redact'],
  steps: [
    [0, 'Text arrives from a ticket, review, transcript, or document.'],
    [1, 'You call the synchronous API for short text, or start an asynchronous job over many documents in [[s3]].'],
    [2, 'The service detects the requested attributes, each with a confidence score and character offsets.'],
    [3, 'You receive structured JSON.'],
    [4, 'Your code redacts PII, routes by sentiment or topic, or indexes extracted entities.']
  ],
  gotchas: [
    '**Per-request size limits** are small (thousands of bytes). Chunk long text or use async jobs.',
    '**Custom models and real-time endpoints** are billed while they exist. Remove endpoints you are not using.',
    '**PII detection is probabilistic.** It reduces risk but is not a compliance guarantee. Test on your own data.',
    'Language coverage varies by feature.'
  ],
  edges: [
    'Offsets are based on the text you sent; if you chunked or normalised it, map offsets back.',
    'Comprehend Medical is a separate service for clinical text.'
  ],
  ml: [
    'Redact PII from user prompts and documents **before** they reach an LLM or are logged.',
    'Cheap pre-classification: route obvious cases without an LLM call and send only ambiguous ones to a model.',
    'Metadata extraction (entities, topics) to enrich chunks for better filtering in RAG.'
  ],
  pairs: ['textract', 'transcribe', 'bedrock-guardrails', 's3', 'macie'],
  cost: 'Per unit of 100 characters analysed, per feature; custom model training and endpoint hours billed separately.'
});

S({
  id: 'transcribe', cat: 'aiservices', name: 'Amazon Transcribe', doc: 'transcribe/',
  tag: 'Speech to text, for files and live streams, with diarisation, vocabulary and PII redaction.',
  what: 'Transcribe converts speech to text in **batch** mode (audio files in S3) and **streaming** mode (real-time over HTTP/2 or WebSocket). Features include **speaker diarisation**, **custom vocabularies**, **automatic language identification**, **PII redaction**, and call-analytics outputs such as sentiment and call summaries for contact-centre audio.',
  flow: ['Audio file / stream', 'Transcribe', 'ASR + diarisation', 'Transcript JSON', 'Downstream NLP / LLM'],
  steps: [
    [0, 'Audio is stored in [[s3]] (batch) or streamed live from a microphone or telephony system.'],
    [1, 'You start a transcription job with language, vocabulary and redaction options.'],
    [2, 'The service performs speech recognition and, if requested, separates speakers.'],
    [3, 'A transcript JSON with word timings and confidence is produced (S3 for batch, incremental events for streaming).'],
    [4, 'Text flows on to [[comprehend]], search indexing, or an LLM for summarisation and analysis.']
  ],
  gotchas: [
    '**Audio quality sets the ceiling.** Telephone 8 kHz audio is supported, but noise and crosstalk raise errors. Prefer higher sampling rates and clean channels.',
    '**Streaming sessions have maximum duration** and require reconnect logic with context handling.',
    '**Domain jargon needs custom vocabularies** or custom language models; default accuracy on product names is poor.',
    'Speaker labels are "spk_0", not identities. Mapping to people is your job.'
  ],
  edges: [
    'Multi-channel audio (agent on one channel, customer on another) transcribes more accurately with channel identification than with diarisation.',
    'Redacted transcripts and redacted audio are separate options.'
  ],
  ml: [
    'Voice front end for LLM assistants: transcribe, reason with [[bedrock]], respond with [[polly]].',
    'Call analytics: transcribe, redact, summarise, and score conversations at scale.',
    'Create searchable text from meetings and media for RAG.'
  ],
  pairs: ['polly', 'comprehend', 'bedrock', 's3', 'lex'],
  cost: 'Per second of audio (with a minimum per request) for batch and streaming, with extra for call-analytics and redaction features.'
});

S({
  id: 'polly', cat: 'aiservices', name: 'Amazon Polly', doc: 'polly/',
  tag: 'Text to natural-sounding speech, in many languages and voice engines.',
  what: 'Polly synthesises speech from text or **SSML** (markup for pauses, emphasis, pronunciation). Voice engines range from standard to **neural**, **long-form** and **generative**, with increasing naturalness. It can also emit **speech marks** (timestamps for words and visemes) to drive subtitles or lip-sync animation, and supports custom **lexicons** for pronunciation.',
  flow: ['Text / SSML', 'Polly', 'Voice engine', 'Audio stream', 'Client playback'],
  steps: [
    [0, 'Your app sends text (or SSML) with a voice and engine.'],
    [1, 'Polly applies the lexicon and normalises text.'],
    [2, 'The chosen engine synthesises audio.'],
    [3, 'Audio streams back in MP3, OGG or PCM, or is written to [[s3]] by an asynchronous task for long text.'],
    [4, 'The client plays it, optionally using speech marks for synchronisation.']
  ],
  gotchas: [
    '**Synchronous requests have a character cap;** long content needs the async task API.',
    '**SSML tags support varies by engine and voice.** A tag valid for standard voices may be ignored on neural ones.',
    '**Priced per character, with different rates per engine.** Generative voices cost more.',
    'Pronunciation of names and acronyms often needs lexicons.'
  ],
  edges: [
    'For conversational assistants, stream sentence by sentence as the LLM generates, to hide synthesis latency.',
    'Caching synthesised audio for repeated phrases (prompts, greetings) saves cost.'
  ],
  ml: [
    'Speak LLM answers in voice assistants and accessibility features.',
    'Narrate generated content such as reports and news summaries.',
    'Produce IVR prompts and training audio programmatically.'
  ],
  pairs: ['transcribe', 'bedrock', 'lex', 'lambda', 's3'],
  cost: 'Per million characters synthesised, by engine tier. Cache what repeats.'
});

S({
  id: 'translate', cat: 'aiservices', name: 'Amazon Translate', doc: 'translate/',
  tag: 'Neural machine translation with terminology control, for text and documents.',
  what: 'Translate performs neural machine translation across many languages, in real time or in **batch** over files in S3. **Custom terminology** forces specific term translations (brand names, product terms), and settings control **formality** and profanity masking. **Active Custom Translation** adapts output to your parallel data without training a model.',
  flow: ['Source text', 'Translate', 'Apply terminology', 'Translated text'],
  steps: [
    [0, 'You send text, or a document, with source and target languages (or automatic detection).'],
    [1, 'Translate runs the neural model and applies your custom terminology.'],
    [2, 'Formality and profanity settings shape the output.'],
    [3, 'Translated text returns, or batch outputs are written to [[s3]].']
  ],
  gotchas: [
    '**Per-request size limits** apply to real-time calls; chunk long text on sentence boundaries.',
    '**Terminology matching is literal.** Variants, plurals and casing may need multiple entries.',
    '**Context is limited.** Sentence-level translation can miss meaning that spans paragraphs.',
    'Quality varies by language pair.'
  ],
  edges: [
    'For nuanced marketing copy or heavily contextual text, an LLM on [[bedrock]] may read better; Translate is faster, cheaper and more predictable at volume.',
    'Document translation preserves formatting for supported file types.'
  ],
  ml: [
    'Multilingual RAG: translate queries into the index language and answers back, or translate documents at ingestion.',
    'Localise model outputs and UI text cheaply.',
    'Normalise multilingual training data.'
  ],
  pairs: ['bedrock', 'comprehend', 'bedrock-kb', 's3'],
  cost: 'Per character translated; batch and Active Custom Translation priced differently.'
});

S({
  id: 'rekognition', cat: 'aiservices', name: 'Amazon Rekognition', doc: 'rekognition/',
  tag: 'Image and video analysis: objects, text, faces, moderation, and custom vision labels.',
  what: 'Rekognition analyses images and video: **label detection**, **text in images**, **face detection, comparison and search** against collections, **content moderation**, **PPE detection**, and **face liveness**. **Custom Labels** trains a model on your own images for domain-specific objects without writing ML code.\n\nVideo analysis is asynchronous: you start a job on a video in S3 and receive a completion notification.',
  flow: ['Image / video in S3', 'Rekognition API', 'Detect labels / faces / moderation', 'JSON with confidence', 'Your rules'],
  steps: [
    [0, 'An image or video is stored in [[s3]] (or sent as bytes for small images).'],
    [1, 'You call the relevant API (`DetectLabels`, `DetectModerationLabels`, `SearchFacesByImage`) or start a video job.'],
    [2, 'The service returns detections with bounding boxes and confidence scores.'],
    [3, 'Your code applies thresholds and business rules.'],
    [4, 'Results trigger actions: flag content, tag assets, grant access, or index metadata.']
  ],
  gotchas: [
    '**Thresholds are your responsibility.** Use high confidence thresholds for consequential decisions, and keep humans in the loop.',
    '**Face analysis has legal and ethical constraints.** Review AWS service terms and applicable law; some uses are restricted.',
    '**Custom Labels models bill while running.** Start and stop the model deliberately.',
    'Image size and format limits apply; very large images are downscaled or rejected.'
  ],
  edges: [
    'Moderation categories are a taxonomy; mapping them to your policy needs tuning on your own content.',
    'Face collections are stored vectors; manage consent, retention and deletion.'
  ],
  ml: [
    'Content-safety screening of user uploads before they reach a multimodal model.',
    'Automatic tagging and metadata for media libraries, then indexed for retrieval.',
    'Combine with an LLM: Rekognition extracts objects and text, the LLM writes captions or reasons about scenes.'
  ],
  pairs: ['s3', 'lambda', 'bedrock', 'sm-groundtruth', 'sns'],
  cost: 'Per image or per minute of video analysed, by feature. Custom Labels adds hourly inference charges.'
});

S({
  id: 'lex', cat: 'aiservices', name: 'Amazon Lex', doc: 'lexv2/',
  tag: 'Build conversational voice and text bots with intents, slots and fulfilment hooks.',
  what: 'Lex V2 builds bots around **intents** (what the user wants), **slots** (the parameters needed), and **fulfilment** (a Lambda that does the work). It combines speech recognition and language understanding, handles multi-turn slot-filling dialogs, and integrates with Amazon Connect and messaging channels.\n\nIt can now include LLM-assisted features and a **QnA intent** that answers from a [[bedrock-kb|Knowledge Base]].',
  flow: ['User utterance', 'Lex NLU', 'Intent + slots', 'Elicit missing slots', 'Lambda fulfilment', 'Response'],
  steps: [
    [0, 'The user speaks or types an utterance.'],
    [1, 'Lex recognises the speech (if voice) and classifies the intent.'],
    [2, 'It extracts slot values from the utterance.'],
    [3, 'It prompts for any required slot still missing, handling confirmations and corrections.'],
    [4, 'When complete, it calls your [[lambda]] fulfilment function.'],
    [5, 'The response is returned as text or synthesised speech.']
  ],
  gotchas: [
    '**Bots are locale-specific.** Each language is built and tested separately.',
    '**Slot-filling loops frustrate users.** Design fallbacks and a way out to a human agent.',
    '**Sessions time out.** Persist state you need beyond the idle timeout.',
    'Intent overlap causes misrouting; keep sample utterances distinct and test with real phrasing.'
  ],
  edges: [
    'Versions and aliases separate drafts from production; deploy through aliases.',
    'LLM-based assistants (via [[bedrock]]) are more flexible for open-ended dialog, while Lex is better for tightly structured transactions.'
  ],
  ml: [
    'Structured front door for contact-centre automation, handing open questions to an LLM.',
    'Voice-enabled transaction flows (bookings, status lookups) with deterministic behaviour.',
    'Hybrid: Lex for the transactional skeleton, Knowledge Base QnA for FAQs.'
  ],
  pairs: ['lambda', 'transcribe', 'polly', 'bedrock-kb', 'bedrock'],
  cost: 'Per text or voice request processed, with extra for some LLM-assisted features.'
});

S({
  id: 'kendra', cat: 'aiservices', name: 'Amazon Kendra', doc: 'kendra/',
  tag: 'Managed enterprise search with connectors, permission-aware results and a retriever for RAG.',
  what: 'Kendra indexes content from many sources through **connectors** (S3, SharePoint, Confluence, databases and more), understands natural-language queries, and respects **document-level access control lists** so users only see what they may. Its **Retrieve** API returns relevant passages for RAG, and the **GenAI Index** edition is built to serve as a high-accuracy retriever for generative AI apps.',
  flow: ['Data sources', 'Connectors sync', 'Index (ACLs)', 'Query / Retrieve', 'Ranked passages', 'LLM'],
  steps: [
    [0, 'You connect sources, such as [[s3]], wikis and file shares.'],
    [1, 'Connectors crawl on a schedule and capture content and ACLs.'],
    [2, 'Documents are processed and stored in a managed index.'],
    [3, 'A query arrives with the user\'s identity or group context.'],
    [4, 'Kendra returns passages ranked by semantic relevance, filtered by permissions.'],
    [5, 'An LLM uses them as grounding context for the answer.']
  ],
  gotchas: [
    '**It is billed by the hour per index,** running or idle. It is one of the pricier retrieval options at small scale.',
    '**Edition limits cap documents and query capacity.** Check the limits against your corpus.',
    '**Sync lag.** Updates appear only after the connector next syncs.',
    'Passage size is bounded, so very long contexts need multiple retrieved passages.'
  ],
  edges: [
    'Identity and ACL mapping is the hard part of enterprise search; test with real user groups.',
    'Bedrock Knowledge Bases can use Kendra\'s GenAI Index as a retrieval backend.'
  ],
  ml: [
    'Permission-aware retrieval for internal assistants when ACL fidelity matters more than raw cost.',
    'Retriever for RAG where its connectors already cover your sources.',
    'Compare against [[bedrock-kb|Knowledge Bases]] plus a vector store on cost and quality.'
  ],
  pairs: ['bedrock', 'bedrock-kb', 's3', 'q', 'iam'],
  cost: 'Hourly index fee by edition, plus connector sync and extra capacity units. Evaluate against your query volume.'
});

S({
  id: 'personalize', cat: 'aiservices', name: 'Amazon Personalize', doc: 'personalize/',
  tag: 'Managed recommendation and personalised ranking trained on your interaction data.',
  what: 'Personalize trains recommenders from three datasets: **users**, **items**, and **interactions** (clicks, purchases, views). It offers **recipes** for personalised recommendations, similar items, popular items and re-ranking. You deploy as a **campaign** or **recommender** for real-time requests, or run **batch** inference jobs. Live events sent through `PutEvents` update recommendations within a session.',
  flow: ['Interaction data', 'Dataset group', 'Train solution (recipe)', 'Campaign / recommender', 'GetRecommendations', 'Live events'],
  steps: [
    [0, 'You import historical interactions (and optional item and user metadata) from [[s3]].'],
    [1, 'They are organised in a dataset group.'],
    [2, 'A solution version trains using a recipe suited to the goal.'],
    [3, 'You deploy it as a campaign with provisioned throughput, or a recommender.'],
    [4, 'The app calls `GetRecommendations` with a user ID for ranked item IDs.'],
    [5, 'New interaction events stream back through `PutEvents`, keeping recommendations fresh.']
  ],
  gotchas: [
    '**Needs enough data.** There are minimum counts of interactions and users before training succeeds, and quality needs far more.',
    '**Cold start.** New items and users get weaker results until they have interactions; supply metadata to help.',
    '**Campaigns bill for provisioned throughput** whether queried or not. Set the minimum thoughtfully.',
    '**Models need retraining** (or auto-update) to stay current with the catalogue.'
  ],
  edges: [
    'Filters exclude items (already purchased, out of stock) at query time without retraining.',
    'Returns item IDs only. You join to your catalogue for names and images.',
    'Feedback loops: recommending what is popular makes it more popular; monitor diversity.'
  ],
  ml: [
    'Home-page and "you may also like" recommendations without building a ranking model.',
    'Candidate generation for a larger system: Personalize proposes, a custom model or LLM re-ranks or explains.',
    'Personalised notifications and search re-ranking.'
  ],
  pairs: ['s3', 'kinesis', 'lambda', 'dynamodb', 'bedrock'],
  cost: 'Data ingestion, training hours, and recommendation requests or provisioned TPS for campaigns.'
});
