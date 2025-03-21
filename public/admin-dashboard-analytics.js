// Admin Dashboard Analytics functionality

// Initialize the analytics dashboard
function initAnalyticsDashboard() {
  console.log('Initializing analytics dashboard...');
  
  // Check if we're in development mode (no Firebase config)
  const isDevMode = !window.SECURE_CONFIG?.firebase?.apiKey && !window.runtimeConfig?.firebase?.apiKey;
  if (isDevMode) {
    console.log('Running in development mode with mock data');
  }
  
  // Set up event listeners
  document.addEventListener('DOMContentLoaded', () => {
    setupAnalyticsTabContent();
    setupDateRangePickers();
    loadAnalyticsData(isDevMode);
  });
}

// Set up analytics tab content
function setupAnalyticsTabContent() {
  // Create analytics tab content if it doesn't exist
  const siteAdminTab = document.getElementById('siteAdminTab');
  if (!siteAdminTab) return;
  
  siteAdminTab.innerHTML = `
    <div class="card">
      <h2>Site Analytics</h2>
      
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
                <div id="totalBookViews" style="font-size: 24px; font-weight: bold; color: var(--primary-color); margin-bottom: 5px;">435</div>
                <div style="font-size: 14px; color: #6b7280;">Total Book Views</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="totalDetailViews" style="font-size: 24px; font-weight: bold; color: var(--success-color); margin-bottom: 5px;">187</div>
                <div style="font-size: 14px; color: #6b7280;">Book Detail Views</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="searchCount" style="font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">52</div>
                <div style="font-size: 14px; color: #6b7280;">Search Count</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="filterUseCount" style="font-size: 24px; font-weight: bold; color: #f59e0b; margin-bottom: 5px;">124</div>
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
                <div id="totalPostViews" style="font-size: 24px; font-weight: bold; color: var(--primary-color); margin-bottom: 5px;">321</div>
                <div style="font-size: 14px; color: #6b7280;">Total Post Views</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="avgReadTime" style="font-size: 24px; font-weight: bold; color: var(--success-color); margin-bottom: 5px;">4:26</div>
                <div style="font-size: 14px; color: #6b7280;">Avg. Read Time</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="commentCount" style="font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">32</div>
                <div style="font-size: 14px; color: #6b7280;">Comments</div>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: 4px; padding: 15px; text-align: center;">
                <div id="shareCount" style="font-size: 24px; font-weight: bold; color: #f59e0b; margin-bottom: 5px;">19</div>
                <div style="font-size: 14px; color: #6b7280;">Shares</div>
              </div>
            </div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">Most Popular Posts</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Views</th>
                  <th>Avg. Read Time</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody id="popularPostsTable">
                <tr>
                  <td>How to Build a React App with Firebase</td>
                  <td>142</td>
                  <td>5:12</td>
                  <td>8</td>
                </tr>
                <tr>
                  <td>Getting Started with TypeScript</td>
                  <td>98</td>
                  <td>4:08</td>
                  <td>5</td>
                </tr>
                <tr>
                  <td>Best Practices for Modern Web Development</td>
                  <td>81</td>
                  <td>3:45</td>
                  <td>3</td>
                </tr>
              </tbody>
            </table>
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

// Load analytics data
function loadAnalyticsData(isDevMode = false) {
  try {
    console.log('Loading analytics data...');
    
    // This would normally fetch data from an API
    // For now, we'll use mock data
    
    // Update overview stats with mock data
    const totalPageviews = document.getElementById('totalPageviews');
    const pageviewsDelta = document.getElementById('pageviewsDelta');
    const uniqueVisitors = document.getElementById('uniqueVisitors');
    const visitorsDelta = document.getElementById('visitorsDelta');
    const avgSessionDuration = document.getElementById('avgSessionDuration');
    const durationDelta = document.getElementById('durationDelta');
    const bounceRate = document.getElementById('bounceRate');
    const bounceDelta = document.getElementById('bounceDelta');
    
    if (totalPageviews) totalPageviews.textContent = '1,258';
    if (pageviewsDelta) {
      pageviewsDelta.textContent = '+12.5%';
      pageviewsDelta.classList.add('positive');
    }
    
    if (uniqueVisitors) uniqueVisitors.textContent = '487';
    if (visitorsDelta) {
      visitorsDelta.textContent = '+8.2%';
      visitorsDelta.classList.add('positive');
    }
    
    if (avgSessionDuration) avgSessionDuration.textContent = '3:42';
    if (durationDelta) {
      durationDelta.textContent = '+5.8%';
      durationDelta.classList.add('positive');
    }
    
    if (bounceRate) bounceRate.textContent = '38.4%';
    if (bounceDelta) {
      bounceDelta.textContent = '-2.1%';
      bounceDelta.classList.add('positive');
    }
    
    // Load top pages data
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
    
    // Load book activity data
    const totalBookViews = document.getElementById('totalBookViews');
    const totalDetailViews = document.getElementById('totalDetailViews');
    const searchCount = document.getElementById('searchCount');
    const filterUseCount = document.getElementById('filterUseCount');
    
    if (totalBookViews) totalBookViews.textContent = '435';
    if (totalDetailViews) totalDetailViews.textContent = '187';
    if (searchCount) searchCount.textContent = '52';
    if (filterUseCount) filterUseCount.textContent = '124';
    
    console.log('Analytics data loaded successfully');
  } catch (error) {
    console.error('Error loading analytics data:', error);
    
    // Add a visible error message in development mode
    if (isDevMode) {
      const siteAdminTab = document.getElementById('siteAdminTab');
      if (siteAdminTab) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'card';
        errorDiv.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #ef4444;">
            <h3>Analytics Error</h3>
            <p>Unable to load analytics data. This is likely because you're in development mode without Firebase credentials.</p>
            <p style="margin-top: 10px; font-size: 14px;">For testing, mock data is being displayed.</p>
          </div>
        `;
        
        // Insert at the top
        if (siteAdminTab.firstChild) {
          siteAdminTab.insertBefore(errorDiv, siteAdminTab.firstChild);
        } else {
          siteAdminTab.appendChild(errorDiv);
        }
      }
    }
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
  `;
  document.head.appendChild(styleEl);
}

// Call this function to initialize everything
function setupAnalytics() {
  addAnalyticsStyles();
  initAnalyticsDashboard();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', setupAnalytics);