// __mocks__/axios.ts
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(() => Promise.resolve({ data: { message: 'Tasks created successfully' } })),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn((err) => err?.isAxiosError === true), 
  ...mockAxiosInstance,
};

export default mockAxios;
