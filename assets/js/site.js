// Image Modal Component
function initImageModals() {
  const triggers = document.querySelectorAll('.image-modal-trigger');
  if (!triggers.length) return;

  triggers.forEach(trigger => {
    const img = trigger.querySelector('img.modal-thumbnail');
    const modalId = trigger.getAttribute('data-modal-id');
    const modal = document.getElementById(modalId);
    
    if (!img || !modal) return;

    const closeBtn = modal.querySelector('.image-modal-close');
    const backdrop = modal.querySelector('.image-modal-backdrop');
    let lastFocusedElement = null;

    // Open modal
    const openModal = (e) => {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      
      lastFocusedElement = document.activeElement;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      
      // Focus close button
      closeBtn.focus();
      
      // Trap focus
      document.addEventListener('keydown', trapFocus);
      document.addEventListener('keydown', handleEscape);
    };

    // Close modal
    const closeModal = () => {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('open');
      document.body.style.overflow = '';
      
      // Remove listeners
      document.removeEventListener('keydown', trapFocus);
      document.removeEventListener('keydown', handleEscape);
      
      // Restore focus
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    };

    // Focus trap
    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      
      const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    // ESC key handler
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    // Event listeners
    img.addEventListener('click', openModal);
    img.addEventListener('keydown', openModal);
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
  });
}

// Initialize all components
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageModals);
  } else {
    initImageModals();
  }
})();
