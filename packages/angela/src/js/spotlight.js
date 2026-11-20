const spotlight = document.querySelector('.spotlight');

spotlight.addEventListener('pointermove', (event) => {
  const rect = spotlight.getBoundingClientRect();
  spotlight.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
  spotlight.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
});
