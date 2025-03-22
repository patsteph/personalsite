const fs = require('fs');
const path = require('path');

// Path to the admin dashboard HTML file
const adminDashboardPath = path.join(__dirname, '../../public/admin-dashboard.html');

// Read the current file content
let fileContent = fs.readFileSync(adminDashboardPath, 'utf8');

// Fix 1: Update formatting buttons
console.log('Adding emoji indicators to formatting buttons...');
fileContent = fileContent.replace(
  /<button type="button" data-format="bold"[^>]*>B<\/button>/g,
  '<button type="button" data-format="bold" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-weight: bold; min-width: 40px;" title="Bold"><b>B</b> 📝</button>'
);

fileContent = fileContent.replace(
  /<button type="button" data-format="italic"[^>]*>I<\/button>/g,
  '<button type="button" data-format="italic" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-style: italic; min-width: 40px;" title="Italic"><i>I</i> 📝</button>'
);

fileContent = fileContent.replace(
  /<button type="button" data-format="heading"[^>]*>H<\/button>/g,
  '<button type="button" data-format="heading" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; font-weight: bold; min-width: 40px;" title="Heading">H 📌</button>'
);

fileContent = fileContent.replace(
  /<button type="button" data-format="link"[^>]*>Link<\/button>/g,
  '<button type="button" data-format="link" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 40px;" title="Link">🔗 Link</button>'
);

fileContent = fileContent.replace(
  /<button type="button" data-format="image"[^>]*>Img<\/button>/g,
  '<button type="button" data-format="image" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 40px;" title="Image">🖼️ Image</button>'
);

fileContent = fileContent.replace(
  /<button type="button" data-format="code"[^>]*>Code<\/button>/g,
  '<button type="button" data-format="code" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 40px;" title="Code">💻 Code</button>'
);

fileContent = fileContent.replace(
  /<button type="button" data-format="quote"[^>]*>Quote<\/button>/g,
  '<button type="button" data-format="quote" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 40px;" title="Quote">💬 Quote</button>'
);

fileContent = fileContent.replace(
  /<button type="button" data-format="list"[^>]*>List<\/button>/g,
  '<button type="button" data-format="list" style="padding: 5px 10px; background-color: white; border: 1px solid var(--border-color); border-radius: 4px; min-width: 40px;" title="List">📋 List</button>'
);

// Fix 2: Add word counter
console.log('Adding word counter...');
fileContent = fileContent.replace(
  /<textarea id="postContent"[^>]*><\/textarea>/g,
  '<textarea id="postContent" style="border-radius: 0 0 4px 4px; min-height: 300px;" placeholder="Write your post content..."></textarea><div id="wordCounter" style="text-align: right; margin-top: 5px; color: #6b7280; font-size: 14px;">Words: 0 | Characters: 0</div>'
);

// Fix 3: Add preview button
console.log('Adding preview button and modal...');
// We'll add this before the closing </body> tag to ensure it's in the document
let previewButton = `
<!-- Blog Preview Button -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Add preview button
  const savePostBtn = document.getElementById('savePostBtn');
  if (savePostBtn) {
    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.id = 'previewPostBtn';
    previewBtn.textContent = 'Preview';
    previewBtn.style.backgroundColor = '#6366F1';
    previewBtn.style.marginRight = '10px';
    previewBtn.style.color = 'white';
    previewBtn.style.border = 'none';
    previewBtn.style.padding = '12px';
    previewBtn.style.borderRadius = '4px';
    previewBtn.style.fontSize = '16px';
    previewBtn.style.fontWeight = '500';
    previewBtn.style.cursor = 'pointer';
    
    savePostBtn.parentNode.insertBefore(previewBtn, savePostBtn);
    
    // Create preview modal
    const previewModal = document.createElement('div');
    previewModal.id = 'previewModal';
    previewModal.style.display = 'none';
    previewModal.style.position = 'fixed';
    previewModal.style.top = '0';
    previewModal.style.left = '0';
    previewModal.style.width = '100%';
    previewModal.style.height = '100%';
    previewModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    previewModal.style.zIndex = '1000';
    previewModal.style.justifyContent = 'center';
    previewModal.style.alignItems = 'center';
    
    previewModal.innerHTML = \`
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
          <div id="previewTitle" style="font-size: 28px; font-weight: bold; margin-bottom: 10px;"></div>
          <div style="display: flex; gap: 10px; margin-bottom: 20px; color: #6b7280; font-size: 14px;">
            <div id="previewDate"></div>
            <div>|</div>
            <div id="previewCategory"></div>
          </div>
          <div id="previewBody" style="line-height: 1.6;"></div>
        </div>
      </div>
    \`;
    
    document.body.appendChild(previewModal);
    
    // Add preview button event listener
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
    
    // Close modal event listeners
    document.getElementById('closePreviewBtn').addEventListener('click', function() {
      previewModal.style.display = 'none';
    });
    
    previewModal.addEventListener('click', function(e) {
      if (e.target === previewModal) {
        previewModal.style.display = 'none';
      }
    });
  }
  
  // Add word counter functionality
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
  
  // Fix blog tab switching
  const blogTabs = document.querySelectorAll('[data-blog-tab]');
  
  blogTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      blogTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to the clicked tab
      this.classList.add('active');
      
      // Get the target tab content
      const targetId = this.getAttribute('data-blog-tab');
      const targetTabId = targetId + 'Tab';
      const targetTabContent = document.getElementById(targetTabId);
      
      console.log('Switching to blog tab:', targetId, targetTabId);
      
      // Hide all tab content
      document.querySelectorAll('.blog-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Show the target tab content
      if (targetTabContent) {
        targetTabContent.style.display = 'block';
      } else {
        console.error('Blog tab content not found:', targetTabId);
      }
    });
  });
});
</script>
`;

// Add script before </body> tag
fileContent = fileContent.replace('</body>', previewButton + '</body>');

// Write the updated content back to the file
fs.writeFileSync(adminDashboardPath, fileContent);

console.log('Admin dashboard updated successfully!');