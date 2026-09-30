/**
 * CrediPulse AI — Interactive 3D Perspective Tilt & Specular Glare Engine
 * Provides physical 3D gyroscopic tilt and dynamic specular light reflections on hover.
 */

function init3DTilt() {
  const cards = document.querySelectorAll('.glass-card, .ribbon-card, .metric-card, .quick-card, .verdict-banner');

  cards.forEach(card => {
    // Add tilt-card marker class if not present
    card.classList.add('tilt-card');

    // Create glare overlay if not present
    if (!card.querySelector('.tilt-glare')) {
      const glare = document.createElement('div');
      glare.className = 'tilt-glare';
      card.appendChild(glare);
    }

    // Attach listeners
    card.removeEventListener('mousemove', handleCardMouseMove);
    card.removeEventListener('mouseleave', handleCardMouseLeave);

    card.addEventListener('mousemove', handleCardMouseMove);
    card.addEventListener('mouseleave', handleCardMouseLeave);
  });
}

function handleCardMouseMove(e) {
  const card = this;
  const rect = card.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  // Normalized cursor coordinate from 0.0 to 1.0
  const mouseX = (e.clientX - rect.left) / width;
  const mouseY = (e.clientY - rect.top) / height;

  // Calculate tilt angles (degrees)
  const maxTilt = 12; // Maximum tilt angle in degrees
  const tiltX = (mouseY - 0.5) * -maxTilt;
  const tiltY = (mouseX - 0.5) * maxTilt;

  // Apply 3D Perspective Transform
  card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;

  // Update Specular Glare position
  card.style.setProperty('--glare-x', `${(mouseX * 100).toFixed(1)}%`);
  card.style.setProperty('--glare-y', `${(mouseY * 100).toFixed(1)}%`);
}

function handleCardMouseLeave() {
  const card = this;
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  setTimeout(() => {
    card.style.transition = '';
  }, 400);
}

// Auto-run when document loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3DTilt);
} else {
  init3DTilt();
}
