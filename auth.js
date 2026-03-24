/* =========================================
   FlexiGig — Auth JS (Login + Register)
   Validation, interactions, and transitions
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ===== PASSWORD VISIBILITY TOGGLE =====
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.input-wrapper');
      const input = wrapper.querySelector('input');
      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
      } else {
        input.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
      }
    });
  });

  // ===== VALIDATION HELPERS =====
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = message;
      el.classList.add('show');
    }
  }

  function clearError(id) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.remove('show');
    }
  }

  function setInputState(input, valid) {
    input.classList.remove('valid', 'invalid');
    input.classList.add(valid ? 'valid' : 'invalid');
  }

  // ===== LOGIN FORM =====
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    // --- Login Role Toggle ---
    const candidateBtn = document.getElementById('login-toggle-candidate');
    const employerBtn = document.getElementById('login-toggle-employer');
    const indicator = document.getElementById('login-role-indicator');
    const heading = document.getElementById('login-heading');
    const subtitle = document.getElementById('login-subtitle');
    let loginRole = 'candidate';

    function setLoginRole(role) {
      loginRole = role;
      if (role === 'candidate') {
        candidateBtn.classList.add('active');
        employerBtn.classList.remove('active');
        indicator.classList.remove('employer');
        heading.textContent = 'Welcome back';
        subtitle.textContent = 'Sign in to find your next part-time gig';
      } else {
        employerBtn.classList.add('active');
        candidateBtn.classList.remove('active');
        indicator.classList.add('employer');
        heading.textContent = 'Employer Login';
        subtitle.textContent = 'Sign in to manage your job listings';
      }
    }

    if (candidateBtn) candidateBtn.addEventListener('click', () => setLoginRole('candidate'));
    if (employerBtn) employerBtn.addEventListener('click', () => setLoginRole('employer'));

    // Live email validation
    emailInput.addEventListener('blur', () => {
      if (emailInput.value && !validateEmail(emailInput.value)) {
        showError('email-error', 'Please enter a valid email address');
        setInputState(emailInput, false);
      } else if (emailInput.value) {
        clearError('email-error');
        setInputState(emailInput, true);
      }
    });

    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('invalid') && validateEmail(emailInput.value)) {
        clearError('email-error');
        setInputState(emailInput, true);
      }
    });

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      // Validate email
      if (!emailInput.value.trim()) {
        showError('email-error', 'Email is required');
        setInputState(emailInput, false);
        valid = false;
      } else if (!validateEmail(emailInput.value)) {
        showError('email-error', 'Please enter a valid email address');
        setInputState(emailInput, false);
        valid = false;
      } else {
        clearError('email-error');
        setInputState(emailInput, true);
      }

      // Validate password
      if (!passwordInput.value) {
        showError('password-error', 'Password is required');
        setInputState(passwordInput, false);
        valid = false;
      } else if (passwordInput.value.length < 8) {
        showError('password-error', 'Password must be at least 8 characters');
        setInputState(passwordInput, false);
        valid = false;
      } else {
        clearError('password-error');
        setInputState(passwordInput, true);
      }

      if (valid) {
        // Real login API call
        const btn = document.getElementById('login-submit');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        btn.disabled = true;

        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
        })
        .then(res => res.json())
        .then(data => {
          btnText.style.display = '';
          btnLoader.style.display = 'none';
          btn.disabled = false;
          
          if (data.error) {
            showError('password-error', data.error);
          } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('flexigig_role', data.user.role);
            localStorage.setItem('user', JSON.stringify(data.user));
            const roleLabel = data.user.role === 'candidate' ? 'Seeker' : 'Employer';
            showSuccessOverlay(`Welcome back, ${roleLabel}!`, 'Redirecting you to your dashboard...', 'index.html');
          }
        })
        .catch(err => {
          btnText.style.display = '';
          btnLoader.style.display = 'none';
          btn.disabled = false;
          showError('password-error', 'Server error. Please try again later.');
        });
      }
    });
  }

  // ===== REGISTER FORM =====
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const firstName = document.getElementById('reg-firstname');
    const lastName = document.getElementById('reg-lastname');
    const email = document.getElementById('reg-email');
    const password = document.getElementById('reg-password');

    // Password Strength Meter
    if (password) {
      password.addEventListener('input', () => {
        const val = password.value;
        const fill = document.getElementById('pw-fill');
        const label = document.getElementById('pw-label');

        let strength = 0;
        if (val.length >= 8) strength++;
        if (/[A-Z]/.test(val)) strength++;
        if (/[0-9]/.test(val)) strength++;
        if (/[^A-Za-z0-9]/.test(val)) strength++;

        const colors = ['var(--error)', 'var(--warning)', '#f59e0b', 'var(--success)'];
        const labels = ['Weak', 'Fair', 'Good', 'Strong'];
        const widths = ['25%', '50%', '75%', '100%'];

        if (val.length === 0) {
          fill.style.width = '0%';
          label.textContent = 'Password strength';
          label.style.color = 'var(--text-dim)';
        } else {
          const idx = Math.max(0, strength - 1);
          fill.style.width = widths[idx];
          fill.style.background = colors[idx];
          label.textContent = labels[idx];
          label.style.color = colors[idx];
        }
      });
    }

    // Role Selection interaction
    const roleOptions = document.querySelectorAll('input[name="role"]');
    roleOptions.forEach(opt => {
      opt.addEventListener('change', () => {
        document.querySelectorAll('.role-option').forEach(card => card.classList.remove('selected'));
        opt.closest('.role-option').classList.add('selected');
      });
    });

    // Live email validation
    email.addEventListener('blur', () => {
      if (email.value && !validateEmail(email.value)) {
        showError('reg-email-error', 'Please enter a valid email address');
        setInputState(email, false);
      } else if (email.value) {
        clearError('reg-email-error');
        setInputState(email, true);
      }
    });

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      // First name
      if (!firstName.value.trim()) {
        showError('firstname-error', 'First name is required');
        setInputState(firstName, false);
        valid = false;
      } else {
        clearError('firstname-error');
        setInputState(firstName, true);
      }

      // Last name
      if (!lastName.value.trim()) {
        showError('lastname-error', 'Last name is required');
        setInputState(lastName, false);
        valid = false;
      } else {
        clearError('lastname-error');
        setInputState(lastName, true);
      }

      // Email
      if (!email.value.trim()) {
        showError('reg-email-error', 'Email is required');
        setInputState(email, false);
        valid = false;
      } else if (!validateEmail(email.value)) {
        showError('reg-email-error', 'Please enter a valid email address');
        setInputState(email, false);
        valid = false;
      } else {
        clearError('reg-email-error');
        setInputState(email, true);
      }

      // Password
      if (!password.value) {
        showError('reg-password-error', 'Password is required');
        setInputState(password, false);
        valid = false;
      } else if (password.value.length < 8) {
        showError('reg-password-error', 'Password must be at least 8 characters');
        setInputState(password, false);
        valid = false;
      } else {
        clearError('reg-password-error');
        setInputState(password, true);
      }

      // Terms
      const terms = document.getElementById('agree-terms');
      if (terms && !terms.checked) {
        valid = false;
        // Brief shake animation on the checkbox
        terms.closest('.custom-checkbox').style.animation = 'shake 0.4s ease';
        setTimeout(() => {
          terms.closest('.custom-checkbox').style.animation = '';
        }, 400);
      }

      if (valid) {
        const btn = document.getElementById('register-submit');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        btn.disabled = true;

        // Save selected role
        const selectedRole = document.querySelector('input[name="role"]:checked').value;
        const normalizedRole = (selectedRole === 'seeker') ? 'candidate' : 'employer';

        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.value,
            password: password.value,
            role: normalizedRole,
            firstName: firstName.value,
            lastName: lastName.value
          })
        })
        .then(res => res.json())
        .then(data => {
          btnText.style.display = '';
          btnLoader.style.display = 'none';
          btn.disabled = false;

          if (data.error) {
            showError('reg-email-error', data.error);
          } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('flexigig_role', data.user.role);
            localStorage.setItem('user', JSON.stringify(data.user));
            showSuccessOverlay('Account created! 🎉', 'Your FlexiGig journey begins now.', 'index.html');
          }
        })
        .catch(err => {
          btnText.style.display = '';
          btnLoader.style.display = 'none';
          btn.disabled = false;
          showError('reg-email-error', 'Server error. Please try again later.');
        });
      }
    });
  }

  // ===== SOCIAL BUTTONS =====
  document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.transform = 'scale(0.97)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 200);
    });
  });

  // ===== SUCCESS OVERLAY =====
  function showSuccessOverlay(title, message, redirectUrl) {
    // Create overlay if not exists
    let overlay = document.querySelector('.success-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'success-overlay';
      overlay.innerHTML = `
        <div class="success-card">
          <div class="success-icon">✓</div>
          <h3></h3>
          <p></p>
          <button class="submit-btn" onclick="window.location.href='${redirectUrl}'">
            <span class="btn-text">Continue</span>
          </button>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    overlay.querySelector('h3').textContent = title;
    overlay.querySelector('p').textContent = message;

    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });
  }

});

// ===== SHAKE ANIMATION (injected) =====
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    50% { transform: translateX(6px); }
    75% { transform: translateX(-4px); }
  }
`;
document.head.appendChild(shakeStyle);
