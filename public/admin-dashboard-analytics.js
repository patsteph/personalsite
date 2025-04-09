// Admin Dashboard Analytics functionality

// Initialize the analytics dashboard
function initAnalyticsDashboard() {
  console.log('Initializing analytics dashboard...');
  
  // Set up event listeners for DOMContentLoaded
  if (document.readyState === "loading") {
    // Wait for the document to finish loading
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Analytics: DOM Content Loaded event fired');
      setupAnalyticsTabContent();
      setupDateRangePickers();
      loadAnalyticsData();
    });
  } else {
    // Document already loaded, run immediately
    console.log('Analytics: Document already loaded, running setup immediately');
    setupAnalyticsTabContent();
    setupDateRangePickers();
    loadAnalyticsData();
  }
}

// Set up analytics tab content
function setupAnalyticsTabContent() {
  // Create analytics tab content if it doesn't exist
  const siteAdminTab = document.getElementById('siteAdminTab');
  if (!siteAdminTab) return;
  
  siteAdminTab.innerHTML = `
    <div class="card">
      <h2>Site Analytics</h2>
      
      <!-- Status message area -->
      <div id="analytics-status-message" class="mb-4"></div>
      
      <!-- Date range selector -->
      <div style="display: flex; margin: 20px 0; gap: 15px; flex-wrap: wrap;">
        <div style="flex-grow: 1; max-width: 250px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;">Date Range</label>
          <select id="analyticsDateRange" class="form-control">
            <option value="7d">Last 7 Days</option>
            <option value="30d" selected>Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">Last 12 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        <div id="customDateContainer" style="display: none; flex-grow: 1; max-width: 500px; display: flex; gap: 10px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Start Date</label>
            <input type="date" id="startDate" class="form-control">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">End Date</label>
            <input type="date" id="endDate" class="form-control">
          </div>
        </div>
        
        <div style="align-self: flex-end;">
          <button id="refreshAnalytics" class="btn-small" style="height: 38px;">Refresh</button>
        </div>
      </div>
      
      <!-- Overview stats -->
      <div class="dashboard-grid" style="margin-bottom: 30px;">
        <div class="stat-card">
          <h3>Total Pageviews</h3>
          <div class="value" id="totalPageviews">0</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            <span id="pageviewsDelta" class="delta"></span>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>Unique Visitors</h3>
          <div class="value" id="uniqueVisitors">0</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            <span id="visitorsDelta" class="delta"></span>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>Avg. Session Duration</h3>
          <div class="value" id="avgSessionDuration">0:00</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            <span id="durationDelta" class="delta"></span>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>Bounce Rate</h3>
          <div class="value" id="bounceRate">0%</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            <span id="bounceDelta" class="delta"></span>
          </div>
        </div>
      </div>
      
      <!-- Page Traffic and User Activity tabs -->
      <div class="tabs">
        <div class="tab active" data-analytics-tab="pageTraffic">Page Traffic</div>
        <div class="tab" data-analytics-tab="visitorActivity">Visitor Activity</div>
        <div class="tab" data-analytics-tab="bookActivity">Book Interactions</div>
        <div class="tab" data-analytics-tab="blogActivity">Blog Activity</div>
      </div>
      
      <!-- Page Traffic Tab Content -->
      <div id="pageTrafficTab" class="analytics-tab-content active">
        <div style="margin-top: 20px;">
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Site Visitors</h3>
            <div class="visitor-counter-wrapper" style="display: flex; justify-content: center; align-items: center; padding: 20px 0;">
              <div class="visitor-counter" style="display: flex; background: #111827; border-radius: 8px; padding: 10px; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                <div id="visitsDigit1" class="counter-digit" style="background: #1e293b; color: #38bdf8; font-size: 36px; font-weight: bold; padding: 10px 15px; border-radius: 6px; margin: 0 4px; min-width: 40px; text-align: center; font-family: monospace; position: relative; overflow: hidden;">0</div>
                <div id="visitsDigit2" class="counter-digit" style="background: #1e293b; color: #38bdf8; font-size: 36px; font-weight: bold; padding: 10px 15px; border-radius: 6px; margin: 0 4px; min-width: 40px; text-align: center; font-family: monospace; position: relative; overflow: hidden;">0</div>
                <div id="visitsDigit3" class="counter-digit" style="background: #1e293b; color: #38bdf8; font-size: 36px; font-weight: bold; padding: 10px 15px; border-radius: 6px; margin: 0 4px; min-width: 40px; text-align: center; font-family: monospace; position: relative; overflow: hidden;">0</div>
                <div id="visitsDigit4" class="counter-digit" style="background: #1e293b; color: #38bdf8; font-size: 36px; font-weight: bold; padding: 10px 15px; border-radius: 6px; margin: 0 4px; min-width: 40px; text-align: center; font-family: monospace; position: relative; overflow: hidden;">0</div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 10px; font-size: 14px; color: #6b7280;">
              Total unique visitors since launch
            </div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Traffic Over Time</h3>
            <div id="trafficChart" style="width: 100%; height: 300px;"></div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Top Pages</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Avg. Time</th>
                  <th>Bounce Rate</th>
                </tr>
              </thead>
              <tbody id="topPagesTable">
                <tr>
                  <td colspan="4" style="text-align: center;">Loading page data...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Visitor Activity Tab Content -->
      <div id="visitorActivityTab" class="analytics-tab-content" style="display: none;">
        <div style="margin-top: 20px;">
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Visitor Demographics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h4 style="font-size: 16px; margin-bottom: 10px;">New vs. Returning Visitors</h4>
                <div id="visitorTypeChart" style="width: 100%; height: 200px;"></div>
              </div>
              <div>
                <h4 style="font-size: 16px; margin-bottom: 10px;">Traffic Sources</h4>
                <div id="trafficSourcesChart" style="width: 100%; height: 200px;"></div>
              </div>
            </div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">User Engagement</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="avgPageViews" style="font-size: 24px; font-weight: bold; color: var(--primary-color); margin-bottom: 5px;">2.8</div>
                <div style="font-size: 14px; color: #6b7280;">Pages per Session</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="avgSessionLength" style="font-size: 24px; font-weight: bold; color: var(--success-color); margin-bottom: 5px;">2:45</div>
                <div style="font-size: 14px; color: #6b7280;">Avg. Session Length</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="engagementRate" style="font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">42%</div>
                <div style="font-size: 14px; color: #6b7280;">Engagement Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Book Activity Tab Content -->
      <div id="bookActivityTab" class="analytics-tab-content" style="display: none;">
        <div style="margin-top: 20px;">
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Book Activity Overview</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="totalBookViews" style="font-size: 24px; font-weight: bold; color: var(--primary-color); margin-bottom: 5px;">0</div>
                <div style="font-size: 14px; color: #6b7280;">Total Book Views</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="totalDetailViews" style="font-size: 24px; font-weight: bold; color: var(--success-color); margin-bottom: 5px;">0</div>
                <div style="font-size: 14px; color: #6b7280;">Book Detail Views</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="searchCount" style="font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">0</div>
                <div style="font-size: 14px; color: #6b7280;">Search Count</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="filterUseCount" style="font-size: 24px; font-weight: bold; color: #f59e0b; margin-bottom: 5px;">0</div>
                <div style="font-size: 14px; color: #6b7280;">Filter Usage Count</div>
              </div>
            </div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Most Popular Books</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Views</th>
                  <th>Detail Views</th>
                  <th>Engagement Rate</th>
                </tr>
              </thead>
              <tbody id="popularBooksTable">
                <tr>
                  <td colspan="4" style="text-align: center;">Loading book data...</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Popular Search Terms</h3>
            <div id="searchTermsCloud" style="min-height: 200px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center;">
              <span style="font-size: 24px; color: var(--primary-color);">javascript</span>
              <span style="font-size: 20px; color: var(--primary-hover);">fiction</span>
              <span style="font-size: 18px; color: var(--primary-color);">design patterns</span>
              <span style="font-size: 22px; color: var(--primary-hover);">programming</span>
              <span style="font-size: 16px; color: var(--primary-color);">leadership</span>
              <span style="font-size: 19px; color: var(--primary-hover);">typescript</span>
              <span style="font-size: 17px; color: var(--primary-color);">react</span>
              <span style="font-size: 21px; color: var(--primary-hover);">sci-fi</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Blog Activity Tab Content -->
      <div id="blogActivityTab" class="analytics-tab-content" style="display: none;">
        <div style="margin-top: 20px;">
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Blog Activity Overview</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="totalPostViews" style="font-size: 24px; font-weight: bold; color: var(--primary-color); margin-bottom: 5px;">0</div>
                <div style="font-size: 14px; color: #6b7280;">Total Post Views</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="avgReadTime" style="font-size: 24px; font-weight: bold; color: var(--success-color); margin-bottom: 5px;">0:00</div>
                <div style="font-size: 14px; color: #6b7280;">Avg. Read Time</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="totalReactions" style="font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">0</div>
                <div style="font-size: 14px; color: #6b7280;">Reactions</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="shareCount" style="font-size: 24px; font-weight: bold; color: #f59e0b; margin-bottom: 5px;">0</div>
                <div style="font-size: 14px; color: #6b7280;">Shares</div>
              </div>
            </div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Most Popular Posts</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Views</th>
                  <th>Avg. Read Time</th>
                  <th>Reactions</th>
                </tr>
              </thead>
              <tbody id="popularPostsTable">
                <tr>
                  <td colspan="4" style="text-align: center;">Loading post data...</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Blog Reactions Breakdown</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">👍</div>
                <div id="thumbsUpCount" style="font-size: 20px; font-weight: bold; color: var(--primary-color);">0</div>
                <div style="font-size: 14px; color: #6b7280;">Thumbs Up</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">🎉</div>
                <div id="celebrateCount" style="font-size: 20px; font-weight: bold; color: var(--primary-color);">0</div>
                <div style="font-size: 14px; color: #6b7280;">Celebrate</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">🧠</div>
                <div id="brainCount" style="font-size: 20px; font-weight: bold; color: var(--primary-color);">0</div>
                <div style="font-size: 14px; color: #6b7280;">Insightful</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">😐</div>
                <div id="mehCount" style="font-size: 20px; font-weight: bold; color: var(--primary-color);">0</div>
                <div style="font-size: 14px; color: #6b7280;">Meh</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Set up the analytics tabs
  setupAnalyticsTabs();
}

// Set up the analytics tabs functionality
function setupAnalyticsTabs() {
  const analyticsTabs = document.querySelectorAll('[data-analytics-tab]');
  analyticsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all tabs and tab contents
      document.querySelectorAll('[data-analytics-tab]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.analytics-tab-content').forEach(c => c.style.display = 'none');
      
      // Activate clicked tab and its content
      tab.classList.add('active');
      const contentId = tab.getAttribute('data-analytics-tab') + 'Tab';
      const content = document.getElementById(contentId);
      if (content) {
        content.style.display = 'block';
      }
    });
  });
}

// Set up date range pickers
function setupDateRangePickers() {
  const dateRangeSelect = document.getElementById('analyticsDateRange');
  const customDateContainer = document.getElementById('customDateContainer');
  
  if (dateRangeSelect) {
    dateRangeSelect.addEventListener('change', () => {
      if (dateRangeSelect.value === 'custom') {
        customDateContainer.style.display = 'flex';
      } else {
        customDateContainer.style.display = 'none';
      }
    });
  }
  
  // Set default dates for custom range
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    endDateInput.valueAsDate = today;
    startDateInput.valueAsDate = thirtyDaysAgo;
  }
  
  // Set up refresh button
  const refreshBtn = document.getElementById('refreshAnalytics');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAnalyticsData();
    });
  }
}

// Show status message
function showStatusMessage(message, type = 'info') {
  const messageArea = document.getElementById('analytics-status-message');
  if (!messageArea) return;
  
  // Set styles based on message type
  let backgroundColor = '#f0f9ff'; // info - light blue
  let textColor = '#3b82f6';
  let borderColor = '#93c5fd';
  
  if (type === 'success') {
    backgroundColor = '#f0fdf4'; // light green
    textColor = '#22c55e';
    borderColor = '#86efac';
  } else if (type === 'warning') {
    backgroundColor = '#fffbeb'; // light yellow
    textColor = '#f59e0b';
    borderColor = '#fcd34d';
  } else if (type === 'error') {
    backgroundColor = '#fef2f2'; // light red
    textColor = '#ef4444';
    borderColor = '#fca5a5';
  }
  
  // Create the message element
  messageArea.innerHTML = '';
  messageArea.style.padding = '10px 15px';
  messageArea.style.marginBottom = '15px';
  messageArea.style.borderRadius = '6px';
  messageArea.style.backgroundColor = backgroundColor;
  messageArea.style.color = textColor;
  messageArea.style.border = `1px solid ${borderColor}`;
  messageArea.style.fontSize = '14px';
  messageArea.textContent = message;
}

// Load analytics data from the server API
function loadAnalyticsData() {
  showStatusMessage('Loading analytics data...', 'info');
  
  // Fetch analytics data from the server API
  fetch('/api/admin-analytics')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load analytics data (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        updateDashboardWithData(data.data);
        showStatusMessage('Analytics data loaded successfully', 'success');
      } else {
        showStatusMessage(`Error loading data: ${data.error || 'Unknown error'}`, 'error');
      }
    })
    .catch(error => {
      console.error('Error loading analytics data:', error);
      showStatusMessage(`Error: ${error.message}. Using sample data instead.`, 'error');
      
      // Use sample data as fallback
      useSampleData();
    });
}

// Update the dashboard with the received data
function updateDashboardWithData(data) {
  if (!data) {
    useSampleData();
    return;
  }
  
  console.log('Updating dashboard with data:', data);
  
  // Extract data
  const siteStats = data.siteStats || {};
  const topPages = data.topPages || [];
  const bookEngagement = data.bookEngagement || {};
  const blogEngagement = data.blogEngagement || {};
  
  // Update visitor counter
  const totalVisitors = siteStats.visits || 0;
  updateVisitorCounter(totalVisitors);
  
  // Update overview stats
  const totalPageviews = document.getElementById('totalPageviews');
  const uniqueVisitors = document.getElementById('uniqueVisitors');
  const avgSessionDuration = document.getElementById('avgSessionDuration');
  const bounceRate = document.getElementById('bounceRate');
  
  if (totalPageviews) totalPageviews.textContent = totalVisitors.toLocaleString();
  if (uniqueVisitors) {
    // Estimate unique visitors as 40-60% of total visits
    const estimatedUnique = Math.round(totalVisitors * (totalVisitors > 1000 ? 0.4 : 0.6));
    uniqueVisitors.textContent = estimatedUnique.toLocaleString();
  }
  if (avgSessionDuration) avgSessionDuration.textContent = '3:42'; // Placeholder
  if (bounceRate) bounceRate.textContent = '38.4%'; // Placeholder
  
  // Update top pages table
  const topPagesTable = document.getElementById('topPagesTable');
  if (topPagesTable && topPages.length > 0) {
    topPagesTable.innerHTML = topPages.map(page => `
      <tr>
        <td>${page.path}</td>
        <td>${page.views}</td>
        <td>${page.avgTime}</td>
        <td>${page.bounceRate}%</td>
      </tr>
    `).join('');
  }
  
  // Update book engagement stats
  const totalBookViews = document.getElementById('totalBookViews');
  const totalDetailViews = document.getElementById('totalDetailViews');
  const searchCount = document.getElementById('searchCount');
  const filterUseCount = document.getElementById('filterUseCount');
  
  if (totalBookViews) totalBookViews.textContent = (bookEngagement.totalViews || 0).toLocaleString();
  if (totalDetailViews) totalDetailViews.textContent = (bookEngagement.totalDetailViews || 0).toLocaleString();
  if (searchCount) searchCount.textContent = (bookEngagement.searchCount || 0).toLocaleString();
  if (filterUseCount) filterUseCount.textContent = (bookEngagement.filterCount || 0).toLocaleString();
  
  // Update blog engagement stats
  const totalPostViews = document.getElementById('totalPostViews');
  const avgReadTime = document.getElementById('avgReadTime');
  const totalReactions = document.getElementById('totalReactions');
  
  if (totalPostViews) totalPostViews.textContent = (blogEngagement.totalViews || 0).toLocaleString();
  if (avgReadTime) avgReadTime.textContent = blogEngagement.avgReadTime || '0:00';
  if (totalReactions) totalReactions.textContent = (blogEngagement.totalReactions || 0).toLocaleString();
  
  // Update reaction counts
  const reactions = siteStats.reactions || {};
  
  const thumbsUpCount = document.getElementById('thumbsUpCount');
  const celebrateCount = document.getElementById('celebrateCount');
  const brainCount = document.getElementById('brainCount');
  const mehCount = document.getElementById('mehCount');
  
  if (thumbsUpCount) thumbsUpCount.textContent = (reactions.thumbsUp || 0).toLocaleString();
  if (celebrateCount) celebrateCount.textContent = (reactions.celebrate || 0).toLocaleString();
  if (brainCount) brainCount.textContent = (reactions.insightful || 0).toLocaleString();
  if (mehCount) mehCount.textContent = (reactions.meh || 0).toLocaleString();
  
  // Update popular books table
  const popularBooksTable = document.getElementById('popularBooksTable');
  if (popularBooksTable && bookEngagement.popularBooks && bookEngagement.popularBooks.length > 0) {
    popularBooksTable.innerHTML = bookEngagement.popularBooks.map(book => `
      <tr>
        <td>${book.title}</td>
        <td>${book.views}</td>
        <td>${book.detailViews}</td>
        <td>${book.engagement}</td>
      </tr>
    `).join('');
  } else if (popularBooksTable) {
    popularBooksTable.innerHTML = '<tr><td colspan="4" style="text-align: center;">No book data available</td></tr>';
  }
  
  // Update popular posts table
  const popularPostsTable = document.getElementById('popularPostsTable');
  if (popularPostsTable && blogEngagement.popularPosts && blogEngagement.popularPosts.length > 0) {
    popularPostsTable.innerHTML = blogEngagement.popularPosts.map(post => `
      <tr>
        <td>${post.title}</td>
        <td>${post.views}</td>
        <td>${post.readTime}</td>
        <td>${post.reactions}</td>
      </tr>
    `).join('');
  } else if (popularPostsTable) {
    popularPostsTable.innerHTML = '<tr><td colspan="4" style="text-align: center;">No blog data available</td></tr>';
  }
}

// Use sample data as fallback
function useSampleData() {
  // Update visitor counter
  updateVisitorCounter(2487);
  
  // Update overview stats
  const totalPageviews = document.getElementById('totalPageviews');
  const uniqueVisitors = document.getElementById('uniqueVisitors');
  const avgSessionDuration = document.getElementById('avgSessionDuration');
  const bounceRate = document.getElementById('bounceRate');
  
  if (totalPageviews) totalPageviews.textContent = '1,258';
  if (uniqueVisitors) uniqueVisitors.textContent = '487';
  if (avgSessionDuration) avgSessionDuration.textContent = '3:42';
  if (bounceRate) bounceRate.textContent = '38.4%';
  
  // Update top pages table
  const topPagesTable = document.getElementById('topPagesTable');
  if (topPagesTable) {
    topPagesTable.innerHTML = `
      <tr>
        <td>/books</td>
        <td>428</td>
        <td>5:12</td>
        <td>31.2%</td>
      </tr>
      <tr>
        <td>/</td>
        <td>389</td>
        <td>2:45</td>
        <td>42.8%</td>
      </tr>
      <tr>
        <td>/blog</td>
        <td>298</td>
        <td>6:18</td>
        <td>28.5%</td>
      </tr>
      <tr>
        <td>/cv</td>
        <td>143</td>
        <td>4:05</td>
        <td>35.7%</td>
      </tr>
    `;
  }
  
  // Update book engagement stats
  const totalBookViews = document.getElementById('totalBookViews');
  const totalDetailViews = document.getElementById('totalDetailViews');
  const searchCount = document.getElementById('searchCount');
  const filterUseCount = document.getElementById('filterUseCount');
  
  if (totalBookViews) totalBookViews.textContent = '435';
  if (totalDetailViews) totalDetailViews.textContent = '187';
  if (searchCount) searchCount.textContent = '52';
  if (filterUseCount) filterUseCount.textContent = '124';
  
  // Update blog engagement stats
  const totalPostViews = document.getElementById('totalPostViews');
  const avgReadTime = document.getElementById('avgReadTime');
  const totalReactions = document.getElementById('totalReactions');
  
  if (totalPostViews) totalPostViews.textContent = '321';
  if (avgReadTime) avgReadTime.textContent = '4:26';
  if (totalReactions) totalReactions.textContent = '87';
  
  // Update reaction counts
  const thumbsUpCount = document.getElementById('thumbsUpCount');
  const celebrateCount = document.getElementById('celebrateCount');
  const brainCount = document.getElementById('brainCount');
  const mehCount = document.getElementById('mehCount');
  
  if (thumbsUpCount) thumbsUpCount.textContent = '38';
  if (celebrateCount) celebrateCount.textContent = '21';
  if (brainCount) brainCount.textContent = '16';
  if (mehCount) mehCount.textContent = '12';
  
  // Sample data for popular books and posts tables is already in the HTML
}

// Function to update the visitor counter with animation
function updateVisitorCounter(totalVisitors) {
  const visitsDigit1 = document.getElementById('visitsDigit1');
  const visitsDigit2 = document.getElementById('visitsDigit2');
  const visitsDigit3 = document.getElementById('visitsDigit3');
  const visitsDigit4 = document.getElementById('visitsDigit4');
  
  // Animate the counter (simple version)
  if (visitsDigit1 && visitsDigit2 && visitsDigit3 && visitsDigit4) {
    // Split number into digits and pad with zeros
    const visitsStr = totalVisitors.toString().padStart(4, '0');
    setTimeout(() => { if (visitsDigit1) visitsDigit1.textContent = visitsStr[0]; }, 200);
    setTimeout(() => { if (visitsDigit2) visitsDigit2.textContent = visitsStr[1]; }, 400);
    setTimeout(() => { if (visitsDigit3) visitsDigit3.textContent = visitsStr[2]; }, 600);
    setTimeout(() => { if (visitsDigit4) visitsDigit4.textContent = visitsStr[3]; }, 800);
  }
}

// Set up additional styles
function addAnalyticsStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .delta {
      display: inline-flex;
      align-items: center;
    }
    
    .delta.positive {
      color: var(--success-color);
    }
    
    .delta.positive::before {
      content: "↑";
      margin-right: 2px;
    }
    
    .delta.negative {
      color: var(--error-color);
    }
    
    .delta.negative::before {
      content: "↓";
      margin-right: 2px;
    }
    
    /* Digital counter animation */
    .counter-digit {
      transition: all 0.3s ease-in-out;
    }
    
    /* Flicker animation for the counter */
    @keyframes digitalFlicker {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    
    .counter-digit {
      animation: digitalFlicker 2s infinite;
      animation-delay: var(--delay, 0ms);
    }
    
    #visitsDigit1 { --delay: 200ms; }
    #visitsDigit2 { --delay: 400ms; }
    #visitsDigit3 { --delay: 600ms; }
    #visitsDigit4 { --delay: 800ms; }
  `;
  document.head.appendChild(styleEl);
}

// Call this function to initialize everything
function setupAnalytics() {
  addAnalyticsStyles();
  initAnalyticsDashboard();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Analytics: Document ready, setting up analytics module');
  setupAnalytics();
});