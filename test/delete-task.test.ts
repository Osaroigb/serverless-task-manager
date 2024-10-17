import AWSMock from 'aws-sdk-mock';
import { handler } from '../lambdas/delete-task';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const TASK_ID = '12345';

describe('Delete Task Lambda', () => {
  beforeAll(() => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'get',
      (params: any, callback: any) => {
        callback(null, { Item: { taskId: TASK_ID } }); // Mocking a task that exists
      },
    );

    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'delete',
      (params: any, callback: any) => {
        callback(null, {}); // Mocking successful deletion
      },
    );
  });

  afterAll(() => {
    AWSMock.restore('DynamoDB.DocumentClient');
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should return 204 on successful deletion', async () => {
    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: { taskId: TASK_ID },
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(204);
    expect(result.body).toBe('');
  });

  it('should return 400 if taskId is not provided', async () => {
    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: {},
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(400);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error', 'taskId is required');
  });

  it('should return 404 if task does not exist', async () => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'get',
      (params: any, callback: any) => {
        callback(null, { Item: null }); // Simulating task not found
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

  it('should return 500 if there is an error during deletion', async () => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'get',
      (params: any, callback: any) => {
        callback(null, { Item: { taskId: TASK_ID } }); // Mocking a task that exists
      },
    );

    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'delete',
      (params: any, callback: any) => {
        callback(new Error('Deletion error')); // Simulating deletion error
      },
    );

    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: { taskId: TASK_ID },
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(500);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error', 'Could not delete task');
  });
});

// Helper function to create a mock event
const createEvent = (
  overrides: Partial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent => ({
  path: '/tasks/12345',
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'DELETE',
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
