/* =========================================
   FlexiGig — App Logic
   Liquid Toggle + View Switching
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  const body = document.body;
  const seekerView = document.getElementById('seeker-view');
  const posterView = document.getElementById('poster-view');
  const toggleSeeker = document.getElementById('toggle-seeker');
  const togglePoster = document.getElementById('toggle-poster');
  const toggleBlob = document.getElementById('toggle-blob');
  const bottomToggle = document.getElementById('bottom-toggle');

  // ===== ROLE-BASED PROTECTION =====
  const userRole = localStorage.getItem('flexigig_role');
  
  // If no role found, redirect to login (simulating protected route)
  if (!userRole) {
    window.location.href = 'login.html';
    return;
  }

  // Define logic for role-based UI restriction
  function initRoleView() {
    if (userRole === 'candidate') {
      // Seeker mode: Hide poster toggle and force seeker view
      if (togglePoster) togglePoster.style.display = 'none';
      if (bottomToggle) bottomToggle.style.pointerEvents = 'none'; // Lock the toggle
      switchMode('seeker');
    } else if (userRole === 'employer') {
      // Employer mode: Hide seeker toggle and force poster view
      if (toggleSeeker) toggleSeeker.style.display = 'none';
      if (bottomToggle) bottomToggle.style.pointerEvents = 'none'; // Lock the toggle
      
      // Move the blob to the employer side immediately
      if (toggleBlob) toggleBlob.style.transform = 'translateX(100%)';
      
      switchMode('poster');
    }
  }

  // ===== MODE SWITCHING =====
  function switchMode(mode) {
    const isSeeker = mode === 'seeker';

    // Body class
    body.classList.remove('seeker-mode', 'poster-mode');
    body.classList.add(isSeeker ? 'seeker-mode' : 'poster-mode');

    // Views
    if (seekerView) seekerView.classList.toggle('active', isSeeker);
    if (posterView) posterView.classList.toggle('active', !isSeeker);

    // Toggle buttons
    if (toggleSeeker) toggleSeeker.classList.toggle('active', isSeeker);
    if (togglePoster) togglePoster.classList.toggle('active', !isSeeker);

    // Re-trigger card animations
    const activeView = isSeeker ? seekerView : posterView;
    if (activeView) {
      const cards = activeView.querySelectorAll('.bento-card');
      cards.forEach((card, i) => {
        card.style.animation = 'none';
        card.offsetHeight; // force reflow
        card.style.animation = `card-entrance 0.5s ease forwards`;
        card.style.animationDelay = `${i * 0.05}s`;
      });
    }
  }

  if (toggleSeeker) toggleSeeker.addEventListener('click', () => switchMode('seeker'));
  if (togglePoster) togglePoster.addEventListener('click', () => switchMode('poster'));

  // Run initial role check
  initRoleView();

  // ===== THEME TOGGLE (DARK MODE) =====
  const themeToggle = document.getElementById('theme-toggle');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');

  // Load saved theme
  const savedTheme = localStorage.getItem('flexigig_theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (themeIconSun) themeIconSun.style.display = 'block';
    if (themeIconMoon) themeIconMoon.style.display = 'none';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = body.classList.toggle('dark-mode');
      localStorage.setItem('flexigig_theme', isDark ? 'dark' : 'light');
      
      // Update icons
      if (themeIconSun) themeIconSun.style.display = isDark ? 'block' : 'none';
      if (themeIconMoon) themeIconMoon.style.display = isDark ? 'none' : 'block';
      
      // Feedback animation
      themeToggle.style.transform = 'scale(0.8) rotate(45deg)';
      setTimeout(() => {
        themeToggle.style.transform = '';
      }, 200);
    });
  }

  // ===== SEARCH =====
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const jobCards = document.querySelectorAll('.job-card');
      jobCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // Removed JOBS_DATA
  let originalFeaturedHTML = '';
  const jobListContainer = document.getElementById('job-list-container');
  const featuredHeading = document.getElementById('featured-heading');
  const backBtn = document.getElementById('back-to-featured');
  const seeAllBtn = document.getElementById('see-all-featured');

  if (jobListContainer) {
    originalFeaturedHTML = jobListContainer.innerHTML;
  }

  function renderJobCard(job) {
    const tagsHTML = job.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    const applicantText = job.applicantsCount === 1 ? '1 applicant' : `${job.applicantsCount || 0} applicants`;
    return `
      <div class="job-card pressed card-entrance" data-job-id="${job.id}">
        <div class="job-card-top">
          <div class="company-logo" style="background: ${job.bgColor};">${job.icon}</div>
          <div class="job-meta">
            <h3>${job.title}</h3>
            <p class="company-name">${job.company}</p>
          </div>
          <span class="pay-badge">${job.pay}</span>
        </div>
        <div class="job-card-tags">${tagsHTML}</div>
        <div class="job-card-bottom">
          <span class="location">📍 ${job.location} • <span class="applicant-count">${applicantText}</span></span>
          ${userRole === 'candidate' ? '<button class="apply-btn">Quick Apply</button>' : ''}
        </div>
      </div>
    `;
  }

  async function showCategoryJobs(category) {
    if (userRole !== 'candidate') return; // Only seekers can browse
    
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    
    let jobs = [];
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        let allJobs = await res.json();
        allJobs = allJobs.filter(j => j.category === category);
        
        jobs = allJobs.map(j => ({
          title: j.title,
          company: j.company_name,
          pay: j.pay_rate,
          location: j.location,
          tags: [j.type || 'Job'],
          icon: '✨',
          bgColor: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
          id: j.id
        }));
      }
    } catch(err) {
      console.error('Failed to fetch jobs', err);
    }
    
    // Update Heading & UI
    if (featuredHeading) featuredHeading.textContent = `⚡ Gigs in ${categoryName}`;
    if (backBtn) backBtn.style.display = 'inline-block';
    if (seeAllBtn) seeAllBtn.style.display = 'none';

    // Clear and Render
    if (jobListContainer) {
      jobListContainer.innerHTML = '';
      if (jobs.length === 0) {
        jobListContainer.innerHTML = '<p class="empty-msg">No jobs found in this category right now.</p>';
      } else {
        jobs.forEach((job, i) => {
          const cardHTML = renderJobCard(job);
          jobListContainer.insertAdjacentHTML('beforeend', cardHTML);
          
          // Re-attach apply listeners to new buttons
          const newBtn = jobListContainer.lastElementChild.querySelector('.apply-btn');
          attachApplyListener(newBtn);
        });
      }
    }
    
    // Smooth Scroll to jobs
    jobListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function loadFeaturedJobs() {
    if (userRole !== 'candidate') return;
    
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const allJobs = await res.json();
      
      const jobs = allJobs.map(j => ({
        title: j.title,
        company: j.company_name,
        pay: j.pay_rate,
        location: j.location,
        tags: [j.type || 'Job'],
        icon: '✨',
        bgColor: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
        id: j.id,
        applicantsCount: j.applicants_count
      }));

      if (jobListContainer) {
        jobListContainer.innerHTML = '';
        if (jobs.length === 0) {
          jobListContainer.innerHTML = '<p class="empty-msg">No jobs available right now. Check back later!</p>';
        } else {
          jobs.forEach(job => {
            const cardHTML = renderJobCard(job);
            jobListContainer.insertAdjacentHTML('beforeend', cardHTML);
            const newBtn = jobListContainer.lastElementChild.querySelector('.apply-btn');
            attachApplyListener(newBtn);
          });
        }
        originalFeaturedHTML = jobListContainer.innerHTML;
      }
    } catch (err) {
      console.error('Error loading featured jobs:', err);
    }
  }

  function restoreFeatured(e) {
    if (e) e.preventDefault();
    if (featuredHeading) featuredHeading.textContent = `🔥 Featured Gigs`;
    if (backBtn) backBtn.style.display = 'none';
    if (seeAllBtn) seeAllBtn.style.display = 'inline-block';
    if (jobListContainer) {
      jobListContainer.innerHTML = originalFeaturedHTML;
      // Re-attach apply listeners to restored cards
      const restoredBtns = jobListContainer.querySelectorAll('.apply-btn');
      restoredBtns.forEach(btn => attachApplyListener(btn));
    }
  }

  // ===== NOTIFICATIONS / TOASTS =====
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  function showToast(title, message, type = 'seeker') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'employer' 
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    
    toast.innerHTML = `
      <div class="toast-icon" style="background: ${type === 'employer' ? 'var(--poster-accent)' : 'var(--seeker-accent)'}">
        ${icon}
      </div>
      <div class="toast-content">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto-remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  function triggerEmployerNotification(jobTitle) {
    const notifDot = document.getElementById('notif-dot-indicator') || document.querySelector('.notif-dot');
    if (notifDot) notifDot.classList.add('active');
    
    // Store notification for employer to see on login
    const pending = JSON.parse(localStorage.getItem('flexigig_pending_notifs') || '[]');
    pending.push({
      title: 'New Applicant!',
      message: `Someone just applied for "${jobTitle}"`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('flexigig_pending_notifs', JSON.stringify(pending));
  }

  // Check for pending notifications for employers on load
  function checkPendingNotifications() {
    if (userRole === 'employer') {
      const pending = JSON.parse(localStorage.getItem('flexigig_pending_notifs') || '[]');
      if (pending.length > 0) {
        pending.forEach((notif, i) => {
          setTimeout(() => {
            showToast(notif.title, notif.message, 'employer');
          }, 500 * (i + 1));
        });
        // Clear after showing
        localStorage.removeItem('flexigig_pending_notifs');
      }
    }
  }

  // ===== NOTIFICATIONS DROPDOWN =====
  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  const notifList = document.getElementById('notif-list');
  const notifDotIndicator = document.getElementById('notif-dot-indicator');
  
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isVisible = notifDropdown.style.display === 'block';
      if (isVisible) {
        notifDropdown.style.display = 'none';
      } else {
        notifDropdown.style.display = 'block';
        if (notifDotIndicator) notifDotIndicator.classList.remove('active');
        await loadNotifications();
      }
    });

    window.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.style.display = 'none';
      }
    });
  }

  async function loadNotifications() {
    if (!notifList) return;
    notifList.innerHTML = '<div style="text-align:center;"><div class="btn-loader" style="display:inline-block;border: 3px solid #f3f3f3;border-top:3px solid var(--indigo);border-radius:50%;width:16px;height:16px;animation:spin 1s linear infinite;"></div></div>';
    
    try {
      const res = await fetch('/api/auth/notifications', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const notifs = await res.json();
        if (notifs.length === 0) {
          notifList.innerHTML = '<p class="empty-msg" style="text-align: center; font-size: 0.9rem;">No new notifications</p>';
          return;
        }
        
        notifList.innerHTML = notifs.map(n => `
          <div style="padding: 10px; border-bottom: 1px solid var(--border); font-size:0.9rem; text-align: left;">
            <strong style="color:var(--text);">${n.title}</strong><br/>
            <span style="color:var(--text-dim);">${n.message}</span><br/>
            <small style="color:var(--indigo);">${new Date(n.created_at).toLocaleDateString()}</small>
          </div>
        `).join('');
      } else {
        throw new Error('Failed to load notifications');
      }
    } catch (err) {
      notifList.innerHTML = `<p class="empty-msg" style="text-align:center; color: var(--error); font-size:0.9rem;">Error loading</p>`;
    }
  }

  // ===== HOME BUTTONS (LOGO + NAV) =====
  const homeBtnLogo = document.getElementById('main-logo');
  const homeBtnNav = document.getElementById('nav-home');

  [homeBtnLogo, homeBtnNav].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (userRole === 'candidate') {
          restoreFeatured();
        } else if (userRole === 'employer') {
          loadEmployerJobs();
        }

        // Visual feedback
        if (btn === homeBtnLogo) {
          btn.style.transform = 'scale(0.95)';
          setTimeout(() => btn.style.transform = '', 100);
        }
        
        // Ensure nav-home is active
        if (homeBtnNav) {
          document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
          homeBtnNav.classList.add('active');
        }
      });
    }
  });

  // Helper for Apply Buttons
  function attachApplyListener(btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.classList.contains('applied')) return;

      const jobCard = btn.closest('.job-card');
      const jobTitle = jobCard ? jobCard.querySelector('h3').textContent : 'this position';
      
      // Update Button State
      btn.classList.add('applied');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Applied
      `;

      // Increment applicant count on the card
      const countSpan = jobCard ? jobCard.querySelector('.applicant-count') : null;
      if (countSpan) {
        const currentText = countSpan.textContent;
        const currentNum = parseInt(currentText) || 0;
        const newNum = currentNum + 1;
        countSpan.textContent = newNum === 1 ? '1 applicant' : `${newNum} applicants`;
        // Brief glow animation
        countSpan.style.color = '#a8e6cf';
        countSpan.style.transition = 'color 0.5s ease';
        setTimeout(() => { countSpan.style.color = ''; }, 1500);
      }

      // Trigger backend apply
      const jobId = jobCard.getAttribute('data-job-id');
      if (jobId) {
        fetch(`/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        }).catch(e => console.error(e));
      }

      // Show Seeker Feedback
      showToast('Application Sent!', `You've successfully applied to ${jobTitle}.`, 'seeker');
      
      // Trigger Employer-side Simulation
      triggerEmployerNotification(jobTitle);
    });
  }

  // ===== CATEGORY CARDS =====
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const category = card.getAttribute('data-category');
      showCategoryJobs(category);

      // Visual feedback — brief scale
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.style.transform = '';
      }, 200);
    });
  });

  // Dynamic fetch for employer dashboard
  async function loadEmployerJobs() {
    if (userRole !== 'employer') return;
    
    // Also load stats
    loadDashboardStats();

    try {
      const res = await fetch('/api/jobs/me', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const myJobs = await res.json();
        const listingsTable = document.getElementById('active-listings-table');
        if (listingsTable) {
          listingsTable.innerHTML = `
            <div class="listing-row listing-header">
              <span>Role</span>
              <span>Applicants</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
          `;
          myJobs.forEach(job => {
            const newRow = document.createElement('div');
            newRow.className = 'listing-row';
            newRow.innerHTML = `
              <span class="listing-role">${job.title}</span>
              <span class="listing-count glow-sm">${job.applicants_count || 0}</span>
              <span class="listing-status active-status">● Live</span>
              <button class="listing-action">Manage</button>
            `;
            listingsTable.appendChild(newRow);
            const actionBtn = newRow.querySelector('.listing-action');
            if (actionBtn) {
              actionBtn.addEventListener('click', () => openApplicantsModal(job.id, job.title));
            }
          });
          
          const countEl = document.getElementById('active-listings-count');
          if (countEl) countEl.textContent = myJobs.length;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadDashboardStats() {
    try {
      const res = await fetch('/api/jobs/stats', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const stats = await res.json();
        
        // Update stats bento cards
        const statsCards = document.querySelectorAll('.poster-stat-card');
        if (statsCards.length >= 4) {
          // 0: Active Listings, 1: Applicants Today, 2: Interviews Set, 3: Hire Rate
          statsCards[0].querySelector('.poster-stat-number').textContent = stats.activeListings;
          statsCards[1].querySelector('.poster-stat-number').textContent = stats.applicantsToday;
          statsCards[2].querySelector('.poster-stat-number').textContent = stats.interviewsSet;
          statsCards[3].querySelector('.poster-stat-number').textContent = stats.hireRate;
          
          // Add glow effect briefy
          statsCards.forEach(card => {
            const num = card.querySelector('.poster-stat-number');
            num.classList.add('glow');
            setTimeout(() => num.classList.remove('glow'), 2000);
          });
        }
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }

  if (userRole === 'employer') loadEmployerJobs();

  // ===== JOB CREATION MODAL =====
  const jobModal = document.getElementById('job-modal');
  const createJobBtn = document.getElementById('create-job-btn'); // The "+ Create Listing" button
  const closeModalBtn = document.getElementById('close-modal');
  const cancelJobBtn = document.getElementById('cancel-job-btn');
  const createJobForm = document.getElementById('create-job-form');
  const listingsTable = document.getElementById('active-listings-table');
  const listingsCount = document.getElementById('active-listings-count');

  if (createJobBtn && jobModal) {
    createJobBtn.addEventListener('click', () => {
      jobModal.classList.add('active');
    });
  }

  const hideModal = () => {
    if (jobModal) {
      jobModal.classList.remove('active');
      if (createJobForm) createJobForm.reset();
    }
  };

  if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
  if (cancelJobBtn) cancelJobBtn.addEventListener('click', hideModal);

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target === jobModal) hideModal();
  });

  if (createJobForm) {
    createJobForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('job-title-input').value;
      const pay = document.getElementById('job-pay-input').value;
      const status = document.getElementById('job-status-input').value;
      const category = document.getElementById('job-category-input').value;

      const submitBtn = createJobForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({
            title,
            description: 'No description provided',
            companyName: userObj.firstName ? (userObj.firstName + " Co.") : 'My Company',
            location: 'Remote',
            type: 'Full-time',
            category: category,
            payRate: pay
          })
        });
        
        if (!res.ok) throw new Error('Failed to create job');
        const newJob = await res.json();
        
        // Create new listing row
        const newRow = document.createElement('div');
        newRow.className = 'listing-row card-entrance';
        newRow.innerHTML = `
          <span class="listing-role">${title}</span>
          <span class="listing-count glow-sm">0</span>
          <span class="listing-status ${status === 'Live' ? 'active-status' : 'paused-status'}">
            ${status === 'Live' ? '● Live' : '◼ Paused'}
          </span>
          <button class="listing-action">Manage</button>
        `;

        // Append to table
        if (listingsTable) {
          listingsTable.appendChild(newRow);
          
          // Attach listener to new manage button to show applicants modal
          const actionBtn = newRow.querySelector('.listing-action');
          if (actionBtn) {
            actionBtn.addEventListener('click', () => {
              openApplicantsModal(newJob.id, newJob.title);
            });
          }
        }
      } catch (err) {
        showToast('Error', err.message, 'employer');
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      if (submitBtn) submitBtn.disabled = false;

      // Update counter
      if (listingsCount) {
        const currentCount = parseInt(listingsCount.textContent);
        listingsCount.textContent = currentCount + 1;
        listingsCount.classList.add('glow');
        setTimeout(() => listingsCount.classList.remove('glow'), 2000);
      }

      // Feedback & Cleanup
      showToast('Listing Launched! 🚀', `"${title}" is now active in your dashboard.`, 'employer');
      hideModal();
    });
  }

  // ===== APPLICANTS MODAL =====
  const applicantsModal = document.getElementById('applicants-modal');
  const closeApplicantsBtn = document.getElementById('close-applicants-modal');
  const applicantsList = document.getElementById('applicants-list');

  if (closeApplicantsBtn) {
    closeApplicantsBtn.addEventListener('click', () => {
      applicantsModal.classList.remove('active');
    });
  }

  async function openApplicantsModal(jobId, jobTitle) {
    if (!applicantsModal || !applicantsList) return;
    
    applicantsModal.querySelector('h2').textContent = `👥 Applicants for ${jobTitle}`;
    applicantsList.innerHTML = '<div style="padding: 2rem; text-align: center;"><div class="btn-loader" style="border: 3px solid #f3f3f3; border-top: 3px solid var(--indigo); border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display:inline-block;"></div></div>';
    applicantsModal.classList.add('active');

    try {
      const res = await fetch(`/api/jobs/${jobId}/applicants`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (!res.ok) throw new Error('Failed to fetch applicants');
      const applicants = await res.json();
      
      if (applicants.length === 0) {
        applicantsList.innerHTML = '<p class="empty-msg" style="text-align:center;">No one has applied yet.</p>';
        return;
      }

      applicantsList.innerHTML = applicants.map(app => `
        <div class="app-item" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 12px; background: rgba(255,255,255,0.2);">
          <div style="display:flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div class="app-info" style="margin: 0; text-align: left;">
              <strong style="font-size: 1.1rem; color: var(--text);">${app.first_name || 'Candidate'} ${app.last_name || ''}</strong>
              <span style="font-size: 0.9rem; color: var(--text-dim); display:block; margin-top:0.25rem;">✉️ ${app.email}</span>
            </div>
            <span class="app-status status-review" style="font-size: 0.8rem; padding: 4px 10px; background: var(--bg-card); text-transform: capitalize;">${app.status || 'applied'}</span>
          </div>
          <div style="display:flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="status-action-btn" data-job="${jobId}" data-app="${app.app_id}" data-status="rejected" style="padding:4px 8px; font-size:0.8rem; background:var(--error); color:white; border:none; border-radius:4px; cursor:pointer;">Reject</button>
            <button class="status-action-btn" data-job="${jobId}" data-app="${app.app_id}" data-status="waitlist" style="padding:4px 8px; font-size:0.8rem; background:#f59e0b; color:white; border:none; border-radius:4px; cursor:pointer;">Waitlist</button>
            <button class="status-action-btn" data-job="${jobId}" data-app="${app.app_id}" data-status="interview" style="padding:4px 8px; font-size:0.8rem; background:var(--indigo); color:white; border:none; border-radius:4px; cursor:pointer;">Interview</button>
            <button class="status-action-btn" data-job="${jobId}" data-app="${app.app_id}" data-status="selected" style="padding:4px 8px; font-size:0.8rem; background:var(--success); color:white; border:none; border-radius:4px; cursor:pointer;">Selected</button>
          </div>
        </div>
      `).join('');

      // Attach button listeners
      document.querySelectorAll('.status-action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const jId = e.target.getAttribute('data-job');
          const aId = e.target.getAttribute('data-app');
          const newStatus = e.target.getAttribute('data-status');
          e.target.disabled = true;
          try {
            const upRes = await fetch(`/api/jobs/${jId}/applicants/${aId}`, {
              method: 'PATCH',
              headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ status: newStatus })
            });
            if (upRes.ok) {
              const statusPill = e.target.closest('.app-item').querySelector('.app-status');
              statusPill.textContent = newStatus;
              if (newStatus === 'rejected') statusPill.style.color = 'var(--error)';
              else if (newStatus === 'selected') statusPill.style.color = 'var(--success)';
              else statusPill.style.color = 'var(--text)';
            }
          } catch(e) { console.error(e); }
          e.target.disabled = false;
        });
      });
    } catch (err) {
      applicantsList.innerHTML = `<p class="empty-msg" style="text-align:center; color: var(--error);">Error loading applicants: ${err.message}</p>`;
    }
  }

  // ===== ANIMATE PIPELINE ON SCROLL =====
  const observerOptions = {
    threshold: 0.3
  };

  const pipelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fills = entry.target.querySelectorAll('.pipe-fill');
        fills.forEach(fill => {
          const width = fill.style.width;
          fill.style.width = '0%';
          setTimeout(() => {
            fill.style.width = width;
          }, 200);
        });
      }
    });
  }, observerOptions);

  const pipeline = document.querySelector('.poster-pipeline');
  if (pipeline) {
    pipelineObserver.observe(pipeline);
  }

  // ===== AVATAR / LOGOUT =====
  const avatarBtn = document.getElementById('avatar-btn');
  if (avatarBtn) {
    avatarBtn.title = "Click to Logout";
    avatarBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('flexigig_role');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      }
    });
  }

  // Initialize
  initRoleView();
  if (userRole === 'candidate') loadFeaturedJobs();
  checkPendingNotifications();
});
