import '@testing-library/jest-dom';

// Clear localStorage before every test so state doesn't bleed across tests
beforeEach(() => {
  localStorage.clear();
});
