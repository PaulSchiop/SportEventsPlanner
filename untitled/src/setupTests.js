// In src/setupTests.js
beforeAll(() => {
    window.alert = jest.fn();
});

beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
});

// For FontAwesome icons if needed
jest.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span>Icon</span>
}));