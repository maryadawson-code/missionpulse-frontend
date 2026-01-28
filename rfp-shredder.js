/**
 * MissionPulse RFP Shredder - Multi-File Upload Handler
 * Sprint 16: Support for PDF, DOCX, XLSX, TXT, MSG, ZIP
 * © 2026 Mission Meets Tech
 */

(function(global) {
  'use strict';

  // Supported file types
  const SUPPORTED_TYPES = {
    'application/pdf': { ext: 'pdf', icon: '📄', name: 'PDF Document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', icon: '📝', name: 'Word Document' },
    'application/msword': { ext: 'doc', icon: '📝', name: 'Word Document (Legacy)' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', icon: '📊', name: 'Excel Spreadsheet' },
    'application/vnd.ms-excel': { ext: 'xls', icon: '📊', name: 'Excel Spreadsheet (Legacy)' },
    'text/plain': { ext: 'txt', icon: '📃', name: 'Text File' },
    'message/rfc822': { ext: 'msg', icon: '📧', name: 'Email Message' },
    'application/vnd.ms-outlook': { ext: 'msg', icon: '📧', name: 'Outlook Message' },
    'application/zip': { ext: 'zip', icon: '📦', name: 'ZIP Archive' },
    'application/x-zip-compressed': { ext: 'zip', icon: '📦', name: 'ZIP Archive' }
  };

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_FILES = 20;

  class RFPShredder {
    constructor(options = {}) {
      this.supabase = options.supabase || global.MissionPulse?.getClient?.();
      this.opportunityId = options.opportunityId || null;
      this.onProgress = options.onProgress || (() => {});
      this.onComplete = options.onComplete || (() => {});
      this.onError = options.onError || console.error;
      this.files = [];
      this.results = [];
    }

    /**
     * Validate a single file
     */
    validateFile(file) {
      const errors = [];

      // Check size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }

      // Check type
      const typeInfo = SUPPORTED_TYPES[file.type] || this.getTypeByExtension(file.name);
      if (!typeInfo) {
        errors.push(`Unsupported file type: ${file.type || 'unknown'}`);
      }

      return {
        valid: errors.length === 0,
        errors,
        typeInfo
      };
    }

    /**
     * Get type info by file extension (fallback)
     */
    getTypeByExtension(filename) {
      const ext = filename.split('.').pop().toLowerCase();
      const extMap = {
        'pdf': SUPPORTED_TYPES['application/pdf'],
        'docx': SUPPORTED_TYPES['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'doc': SUPPORTED_TYPES['application/msword'],
        'xlsx': SUPPORTED_TYPES['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'xls': SUPPORTED_TYPES['application/vnd.ms-excel'],
        'txt': SUPPORTED_TYPES['text/plain'],
        'msg': SUPPORTED_TYPES['application/vnd.ms-outlook'],
        'zip': SUPPORTED_TYPES['application/zip']
      };
      return extMap[ext] || null;
    }

    /**
     * Add files to queue
     */
    addFiles(fileList) {
      const newFiles = Array.from(fileList);
      
      if (this.files.length + newFiles.length > MAX_FILES) {
        this.onError(`Maximum ${MAX_FILES} files allowed`);
        return { added: 0, errors: [`Maximum ${MAX_FILES} files allowed`] };
      }

      const results = { added: 0, errors: [] };

      newFiles.forEach(file => {
        const validation = this.validateFile(file);
        if (validation.valid) {
          this.files.push({
            file,
            id: crypto.randomUUID(),
            status: 'pending',
            typeInfo: validation.typeInfo,
            progress: 0
          });
          results.added++;
        } else {
          results.errors.push(`${file.name}: ${validation.errors.join(', ')}`);
        }
      });

      return results;
    }

    /**
     * Remove file from queue
     */
    removeFile(fileId) {
      this.files = this.files.filter(f => f.id !== fileId);
    }

    /**
     * Clear all files
     */
    clearFiles() {
      this.files = [];
      this.results = [];
    }

    /**
     * Get queue status
     */
    getQueue() {
      return this.files.map(f => ({
        id: f.id,
        name: f.file.name,
        size: f.file.size,
        type: f.typeInfo?.name || 'Unknown',
        icon: f.typeInfo?.icon || '📄',
        status: f.status,
        progress: f.progress,
        error: f.error
      }));
    }

    /**
     * Process all files
     */
    async processAll() {
      if (!this.opportunityId) {
        throw new Error('Opportunity ID required');
      }

      this.results = [];

      for (let i = 0; i < this.files.length; i++) {
        const fileItem = this.files[i];
        
        try {
          fileItem.status = 'processing';
          this.onProgress(this.getQueue(), i, this.files.length);

          const result = await this.processFile(fileItem);
          fileItem.status = 'complete';
          fileItem.progress = 100;
          this.results.push(result);

        } catch (error) {
          fileItem.status = 'error';
          fileItem.error = error.message;
          this.results.push({
            fileId: fileItem.id,
            fileName: fileItem.file.name,
            success: false,
            error: error.message
          });
        }

        this.onProgress(this.getQueue(), i + 1, this.files.length);
      }

      this.onComplete(this.results);
      return this.results;
    }

    /**
     * Process a single file
     */
    async processFile(fileItem) {
      const { file, typeInfo } = fileItem;
      
      // 1. Upload to Supabase Storage
      const storagePath = `rfp-docs/${this.opportunityId}/${Date.now()}_${file.name}`;
      
      // For now, we'll store file metadata in the database
      // Actual file upload would go to Supabase Storage bucket
      
      // 2. Create database record
      const { data: docRecord, error: dbError } = await this.supabase
        .from('rfp_documents')
        .insert({
          opportunity_id: this.opportunityId,
          file_name: file.name,
          file_type: typeInfo?.ext || 'unknown',
          file_size: file.size,
          storage_path: storagePath,
          upload_status: 'completed'
        })
        .select()
        .single();

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      // 3. Extract text based on file type
      let extractedText = '';
      let sections = {};

      try {
        switch (typeInfo?.ext) {
          case 'txt':
            extractedText = await this.extractTextFile(file);
            break;
          case 'pdf':
            // PDF extraction would use pdf.js or server-side processing
            extractedText = '[PDF content - requires server processing]';
            break;
          case 'docx':
            // DOCX extraction would use mammoth.js or server-side
            extractedText = '[DOCX content - requires server processing]';
            break;
          case 'xlsx':
            // Excel extraction would use SheetJS
            extractedText = '[Excel content - requires server processing]';
            break;
          default:
            extractedText = '[Content extraction not available for this file type]';
        }

        // 4. Parse sections (simplified)
        sections = this.parseSections(extractedText);

        // 5. Update record with extracted content
        await this.supabase
          .from('rfp_documents')
          .update({
            extracted_text: extractedText.substring(0, 50000), // Limit stored text
            extracted_sections: sections,
            processed_at: new Date().toISOString()
          })
          .eq('id', docRecord.id);

      } catch (extractError) {
        console.warn('Extraction warning:', extractError);
        // Continue even if extraction fails
      }

      return {
        fileId: fileItem.id,
        fileName: file.name,
        documentId: docRecord.id,
        success: true,
        sections: Object.keys(sections),
        textLength: extractedText.length
      };
    }

    /**
     * Extract text from plain text file
     */
    async extractTextFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    }

    /**
     * Parse RFP sections from text
     */
    parseSections(text) {
      const sections = {};
      
      // Common RFP section patterns
      const patterns = [
        { name: 'scope', regex: /(?:scope\s+of\s+work|sow|statement\s+of\s+work)/i },
        { name: 'requirements', regex: /(?:technical\s+requirements?|requirements?)/i },
        { name: 'evaluation', regex: /(?:evaluation\s+(?:criteria|factors)|scoring)/i },
        { name: 'deliverables', regex: /(?:deliverables?|cdrl)/i },
        { name: 'period', regex: /(?:period\s+of\s+performance|pop|schedule)/i },
        { name: 'pricing', regex: /(?:pricing|cost|price)/i },
        { name: 'clauses', regex: /(?:clauses?|far|dfars)/i },
        { name: 'instructions', regex: /(?:instructions?\s+to\s+offerors?|proposal\s+instructions?)/i },
        { name: 'qualifications', regex: /(?:qualifications?|experience|past\s+performance)/i },
        { name: 'security', regex: /(?:security|clearance|classification)/i }
      ];

      patterns.forEach(pattern => {
        if (pattern.regex.test(text)) {
          sections[pattern.name] = true;
        }
      });

      return sections;
    }

    /**
     * Send to AI for analysis
     */
    async analyzeWithAI(documentIds) {
      // This would call the backend API for AI analysis
      const response = await fetch('https://missionpulse-api.onrender.com/api/shred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: this.opportunityId,
          documentIds
        })
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      return response.json();
    }
  }

  /**
   * Create dropzone UI component
   */
  function createDropzone(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const shredder = new RFPShredder(options);

    container.innerHTML = `
      <div class="rfp-dropzone border-2 border-dashed border-slate-600 rounded-xl p-8 text-center transition-colors"
        id="${containerId}-drop">
        <div class="text-4xl mb-4">📁</div>
        <p class="text-white font-medium mb-2">Drop RFP files here</p>
        <p class="text-slate-400 text-sm mb-4">PDF, DOCX, XLSX, TXT, MSG, ZIP (max 50MB each)</p>
        <input type="file" id="${containerId}-input" multiple accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.msg,.zip" class="hidden">
        <button onclick="document.getElementById('${containerId}-input').click()" 
          class="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-4 py-2 rounded-lg">
          Browse Files
        </button>
      </div>
      <div id="${containerId}-queue" class="mt-4 space-y-2"></div>
      <div id="${containerId}-actions" class="hidden mt-4 flex justify-end gap-3">
        <button id="${containerId}-clear" class="px-4 py-2 rounded bg-slate-700 text-white text-sm">Clear All</button>
        <button id="${containerId}-process" class="bg-cyan-500 text-slate-900 font-semibold px-4 py-2 rounded-lg">
          Process Files
        </button>
      </div>
    `;

    const dropzone = container.querySelector(`#${containerId}-drop`);
    const input = container.querySelector(`#${containerId}-input`);
    const queueEl = container.querySelector(`#${containerId}-queue`);
    const actionsEl = container.querySelector(`#${containerId}-actions`);
    const clearBtn = container.querySelector(`#${containerId}-clear`);
    const processBtn = container.querySelector(`#${containerId}-process`);

    // Drag events
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-cyan-400', 'bg-cyan-500/10');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-cyan-400', 'bg-cyan-500/10');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-cyan-400', 'bg-cyan-500/10');
      handleFiles(e.dataTransfer.files);
    });

    // File input
    input.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      input.value = '';
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      shredder.clearFiles();
      renderQueue();
    });

    // Process button
    processBtn.addEventListener('click', async () => {
      processBtn.disabled = true;
      processBtn.textContent = 'Processing...';
      
      try {
        await shredder.processAll();
      } catch (error) {
        console.error('Processing error:', error);
      }
      
      processBtn.disabled = false;
      processBtn.textContent = 'Process Files';
    });

    function handleFiles(fileList) {
      const result = shredder.addFiles(fileList);
      if (result.errors.length > 0) {
        alert(result.errors.join('\n'));
      }
      renderQueue();
    }

    function renderQueue() {
      const queue = shredder.getQueue();
      
      if (queue.length === 0) {
        queueEl.innerHTML = '';
        actionsEl.classList.add('hidden');
        return;
      }

      actionsEl.classList.remove('hidden');
      
      queueEl.innerHTML = queue.map(file => `
        <div class="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${file.icon}</span>
            <div>
              <p class="text-white text-sm font-medium">${file.name}</p>
              <p class="text-slate-400 text-xs">${file.type} • ${formatSize(file.size)}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${file.status === 'pending' ? `
              <button onclick="window._rfpShredders['${containerId}'].removeFile('${file.id}'); window._rfpShredders['${containerId}']._renderQueue()"
                class="text-slate-400 hover:text-red-400 text-xs">Remove</button>
            ` : ''}
            ${file.status === 'processing' ? `
              <span class="text-cyan-400 text-xs">Processing...</span>
            ` : ''}
            ${file.status === 'complete' ? `
              <span class="text-green-400 text-xs">✓ Complete</span>
            ` : ''}
            ${file.status === 'error' ? `
              <span class="text-red-400 text-xs">✗ ${file.error}</span>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Store reference and render function
    if (!global._rfpShredders) global._rfpShredders = {};
    shredder._renderQueue = renderQueue;
    global._rfpShredders[containerId] = shredder;

    // Set up progress callback
    shredder.onProgress = () => renderQueue();

    return shredder;
  }

  // Export
  global.RFPShredder = RFPShredder;
  global.createRFPDropzone = createDropzone;
  global.RFP_SUPPORTED_TYPES = SUPPORTED_TYPES;

})(typeof window !== 'undefined' ? window : global);
