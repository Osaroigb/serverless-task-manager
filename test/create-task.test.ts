import AWSMock from 'aws-sdk-mock';
import { handler } from '../lambdas/create-task';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const TABLE_NAME = 'TestTable';

const VALID_TASK = {
  title: 'New Task',
  description: 'Task Description',
  status: 'pending',
};

describe('Create Task Lambda', () => {
  beforeAll(() => {
    process.env.TABLE_NAME = TABLE_NAME; // Set environment variable for tests
    AWSMock.setSDKInstance(require('aws-sdk'));
  });

  afterAll(() => {
    AWSMock.restore('DynamoDB.DocumentClient');
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should create a task successfully', async () => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'put',
      (params: any, callback: (err: null, data: any) => void) => {
        callback(null, {}); // Simulate successful put operation
      },
    );

    const event: APIGatewayProxyEvent = createEvent({
      body: JSON.stringify(VALID_TASK),
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(201);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('taskId');
    expect(body).toEqual(expect.objectContaining(VALID_TASK));
  });

  it('should return 400 if required fields are missing', async () => {
    const testCases = [
      {
        body: JSON.stringify({
          description: 'Task Description',
          status: 'pending',
        }),
      }, // Missing title
      { body: JSON.stringify({ title: 'New Task', status: 'pending' }) }, // Missing description
      {
        body: JSON.stringify({
          title: 'New Task',
          description: 'Task Description',
        }),
      }, // Missing status
      { body: JSON.stringify({}) }, // All fields missing
    ];

    for (const testCase of testCases) {
      const event: APIGatewayProxyEvent = createEvent(testCase);
      const context: Context = {} as any;
      const result = await handler(event, context);

      expect(result.statusCode).toEqual(400);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('error', 'Missing required fields');
    }
  });

  it('should return 400 if the request body is invalid JSON', async () => {
    const event: APIGatewayProxyEvent = createEvent({
      body: 'Invalid JSON',
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(400);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error', 'Missing required fields');
  });

  it('should return 500 if DynamoDB put operation fails', async () => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'put',
      (params: any, callback: (err: Error | null, data?: any) => void) => {
        callback(new Error('DynamoDB put failed')); // Simulate DynamoDB error
      },
    );

    const event: APIGatewayProxyEvent = createEvent({
      body: JSON.stringify(VALID_TASK),
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(500);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error', 'Could not create task');
  });
});

// Helper function to create a mock event
const createEvent = (
  overrides: Partial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent => ({
  path: '/tasks',
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'POST',
  isBase64Encoded: false,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: '',
  requestContext: {} as any,
  body: '',
  pathParameters: null,
  ...overrides,
});
