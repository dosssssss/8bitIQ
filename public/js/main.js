// Home page logic (login, register) goes here.
fetch('/api/health')
  .then((res) => res.json())
  .then((data) => console.log('API:', data.message))
  .catch(() => console.warn('API not reachable'));
