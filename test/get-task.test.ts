import AWSMock from 'aws-sdk-mock';
import { handler } from '../lambdas/get-task';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const TABLE_NAME = 'TestTable'; // Mock table name

const TASK_ID = '12345';
const VALID_TASK = {
  taskId: TASK_ID,
  title: 'Existing Task',
  description: 'Task Description',
  status: 'pending',
};

describe('Get Task Lambda', () => {
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

  it('should retrieve a task successfully', async () => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'get',
      (
        params: any,
        callback: (err: null, data: { Item: typeof VALID_TASK }) => void,
      ) => {
        callback(null, { Item: VALID_TASK }); // Simulate successful retrieval
      },
    );

    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: { taskId: TASK_ID },
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual(VALID_TASK);
  });

  it('should return 400 if taskId is missing', async () => {
    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: {},
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(400);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error', 'taskId is required');
  });

  it('should return 404 if task is not found', async () => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'get',
      (
        params: any,
        callback: (err: null, data: { Item?: undefined }) => void,
      ) => {
        callback(null, { Item: undefined }); // Simulate task not found
      },
    );

    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: { taskId: TASK_ID },
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(404);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error', 'Task not found');
  });

  it('should return 500 if DynamoDB get operation fails', async () => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'get',
      (params: any, callback: (err: Error | null, data?: any) => void) => {
        callback(new Error('DynamoDB get failed')); // Simulate DynamoDB error
      },
    );

    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: { taskId: TASK_ID },
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(500);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error', 'Could not fetch task');
  });
});

// Helper function to create a mock event
const createEvent = (
  overrides: Partial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent => ({
  path: '/tasks',
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'GET',
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
