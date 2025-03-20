const fs = require('fs');
const path = require('path');

// Path to the admin dashboard HTML file
const adminDashboardPath = path.join(__dirname, '../../public/admin-dashboard.html');

// Read the admin dashboard HTML file
let adminDashboardHTML = fs.readFileSync(adminDashboardPath, 'utf8');

// STEP 1: Update the formatting buttons with emoji indicators for better visibility
function updateFormattingButtons() {
  const oldToolbar = `<div id="editorToolbar" style="border: 1px solid var(--border-color); border-bottom: none; border-radius: 4px 4px 0 0; padding: 8px; background-color: #f8fafc; display: flex; flex-wrap: wrap; gap: 5px;">
            <button type="button" data-format="bold" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-weight: bold; min-width: 36px;" title="Bold">B</button>
            <button type="button" data-format="italic" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-style: italic; min-width: 36px;" title="Italic">I</button>
            <button type="button" data-format="heading" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-weight: bold; min-width: 36px;" title="Heading">H</button>
            <button type="button" data-format="link" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="Link">Link</button>
            <button type="button" data-format="image" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="Image">Img</button>
            <button type="button" data-format="code" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="Code">Code</button>
            <button type="button" data-format="quote" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="Quote">Quote</button>
            <button type="button" data-format="list" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="List">List</button>
          </div>`;

  const newToolbar = `<div id="editorToolbar" style="border: 1px solid var(--border-color); border-bottom: none; border-radius: 4px 4px 0 0; padding: 8px; background-color: #f8fafc; display: flex; flex-wrap: wrap; gap: 5px;">
            <button type="button" data-format="bold" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-weight: bold; min-width: 36px;" title="Bold">📝 <b>B</b></button>
            <button type="button" data-format="italic" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-style: italic; min-width: 36px;" title="Italic">📝 <i>I</i></button>
            <button type="button" data-format="heading" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-weight: bold; min-width: 36px;" title="Heading">📌 H</button>
            <button type="button" data-format="link" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="Link">🔗 Link</button>
            <button type="button" data-format="image" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="Image">🖼️ Image</button>
            <button type="button" data-format="code" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="Code">💻 Code</button>
            <button type="button" data-format="quote" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="Quote">💬 Quote</button>
            <button type="button" data-format="list" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 36px;" title="List">📋 List</button>
          </div>`;

  adminDashboardHTML = adminDashboardHTML.replace(oldToolbar, newToolbar);
}

// STEP 2: Add a word counter to the editor
function addWordCounter() {
  const oldTextarea = `<textarea id="postContent" style="border-radius: 0 0 4px 4px; min-height: 300px;" placeholder="Write your post content..."></textarea>`;
  
  const newTextareaWithCounter = `<textarea id="postContent" style="border-radius: 0 0 4px 4px; min-height: 300px;" placeholder="Write your post content..."></textarea>
        <div id="wordCounter" style="text-align: right; margin-top: 5px; color: #6b7280; font-size: 14px;">
          Words: 0 | Characters: 0
        </div>`;
  
  adminDashboardHTML = adminDashboardHTML.replace(oldTextarea, newTextareaWithCounter);
}

// STEP 3: Add a preview button for the blog
function addPreviewButton() {
  const oldFormEnd = `<div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button type="button" id="cancelPostBtn" class="secondary-button">Cancel</button>
          <button type="submit" id="savePostBtn">Save Post</button>
        </div>`;
  
  const newFormEndWithPreview = `<div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button type="button" id="cancelPostBtn" class="secondary-button">Cancel</button>
          <div>
            <button type="button" id="previewPostBtn" style="background-color: #6366F1; margin-right: 10px;">Preview</button>
            <button type="submit" id="savePostBtn">Save Post</button>
          </div>
        </div>
        
        <!-- Preview Modal -->
        <div id="previewModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1000; justify-content: center; align-items: center;">
          <div style="background-color: white; width: 90%; max-width: 800px; max-height: 90vh; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb;">
              <h3>Post Preview</h3>
              <button id="closePreviewBtn" style="background: none; border: none; cursor: pointer;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div id="previewContent" style="padding: 20px; overflow-y: auto; flex-grow: 1;">
              <!-- Preview content will be inserted here -->
              <div id="previewTitle" style="font-size: 28px; font-weight: bold; margin-bottom: 10px;"></div>
              <div style="display: flex; gap: 10px; margin-bottom: 20px; color: #6b7280; font-size: 14px;">
                <div id="previewDate"></div>
                <div>|</div>
                <div id="previewCategory"></div>
              </div>
              <div id="previewBody" style="line-height: 1.6;"></div>
            </div>
          </div>
        </div>`;
  
  adminDashboardHTML = adminDashboardHTML.replace(oldFormEnd, newFormEndWithPreview);
}

// STEP 4: Fix the tab switching issue
function fixTabSwitching() {
  // Find script section and add proper event handlers for blog tabs
  const scriptEndIndex = adminDashboardHTML.lastIndexOf('</script>');
  
  if (scriptEndIndex !== -1) {
    const blogTabEventsScript = `
// Fix blog tab switching
document.addEventListener('DOMContentLoaded', function() {
  // Get all blog tabs
  const blogTabs = document.querySelectorAll('[data-blog-tab]');
  
  // Add event listeners to each blog tab
  blogTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      blogTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to the clicked tab
      this.classList.add('active');
      
      // Get the target tab content
      const targetTabId = this.getAttribute('data-blog-tab') + 'Tab';
      const targetTabContent = document.getElementById(targetTabId);
      
      // Hide all tab content
      document.querySelectorAll('.blog-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Show the target tab content
      if (targetTabContent) {
        targetTabContent.style.display = 'block';
      }
    });
  });
  
  // Initialize word counter
  const postContent = document.getElementById('postContent');
  const wordCounter = document.getElementById('wordCounter');
  
  if (postContent && wordCounter) {
    postContent.addEventListener('input', function() {
      const text = this.value;
      const wordCount = text.trim() ? text.trim().split(/\\s+/).length : 0;
      const charCount = text.length;
      
      wordCounter.textContent = \`Words: \${wordCount} | Characters: \${charCount}\`;
    });
  }
  
  // Initialize preview button
  const previewBtn = document.getElementById('previewPostBtn');
  const previewModal = document.getElementById('previewModal');
  const closePreviewBtn = document.getElementById('closePreviewBtn');
  
  if (previewBtn && previewModal) {
    previewBtn.addEventListener('click', function() {
      const postTitle = document.getElementById('postTitle').value || 'Untitled Post';
      const postCategory = document.getElementById('postCategory').options[document.getElementById('postCategory').selectedIndex].text;
      const content = document.getElementById('postContent').value || 'No content';
      
      // Set preview content
      document.getElementById('previewTitle').textContent = postTitle;
      document.getElementById('previewCategory').textContent = postCategory;
      document.getElementById('previewDate').textContent = new Date().toLocaleDateString();
      
      // Convert markdown to HTML (simplified)
      let htmlContent = content
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
        .replace(/\\[(.+?)\\]\\((.+?)\\)/g, '<a href="$2">$1</a>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^\\* (.+)$/gm, '<ul><li>$1</li></ul>')
        .replace(/^\\d+\\. (.+)$/gm, '<ol><li>$1</li></ol>')
        .split('\\n').join('<br>');
      
      document.getElementById('previewBody').innerHTML = htmlContent;
      
      // Show the modal
      previewModal.style.display = 'flex';
    });
    
    // Close preview modal
    closePreviewBtn.addEventListener('click', function() {
      previewModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    previewModal.addEventListener('click', function(e) {
      if (e.target === previewModal) {
        previewModal.style.display = 'none';
      }
    });
  }
});
`;
    
    adminDashboardHTML = adminDashboardHTML.slice(0, scriptEndIndex) + blogTabEventsScript + adminDashboardHTML.slice(scriptEndIndex);
  }
}

// Run all the update functions
updateFormattingButtons();
addWordCounter();
addPreviewButton();
fixTabSwitching();

// Write the updated HTML back to the file
fs.writeFileSync(adminDashboardPath, adminDashboardHTML);

console.log('Blog admin UI updated successfully!');