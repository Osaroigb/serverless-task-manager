import AWSMock from 'aws-sdk-mock';
import { handler } from '../lambdas/update-task';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const TASK_ID = '12345';

const UPDATED_TASK = {
  taskId: TASK_ID,
  title: 'Updated Task',
  description: 'Updated Description',
  status: 'completed',
};

describe('Update Task Lambda', () => {
  beforeAll(() => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'update',
      (
        params: any,
        callback: (
          err: null,
          data: { Attributes: typeof UPDATED_TASK },
        ) => void,
      ) => {
        callback(null, { Attributes: UPDATED_TASK });
      },
    );
  });

  afterAll(() => {
    AWSMock.restore('DynamoDB.DocumentClient');
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should update a task successfully', async () => {
    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: { taskId: TASK_ID },
      body: JSON.stringify({
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'completed',
      }),
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual(expect.objectContaining(UPDATED_TASK));
  });

  it('should return 400 if no update fields are provided', async () => {
    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: { taskId: TASK_ID },
      body: JSON.stringify({}),
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(400);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty(
      'error',
      'At least one of title, description, or status must be provided',
    );
  });

  // Additional test case for error handling
  it('should return 500 if DynamoDB update fails', async () => {
    AWSMock.mock(
      'DynamoDB.DocumentClient',
      'update',
      (params: any, callback: (err: Error | null, data?: any) => void) => {
        callback(new Error('DynamoDB update failed'));
      },
    );

    const event: APIGatewayProxyEvent = createEvent({
      pathParameters: { taskId: TASK_ID },
      body: JSON.stringify({
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'completed',
      }),
    });

    const context: Context = {} as any;
    const result = await handler(event, context);

    expect(result.statusCode).toEqual(500);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('error', 'Could not update task');
  });
});

// Helper function to create a mock event
const createEvent = (
  overrides: Partial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent => ({
  path: '/tasks/12345',
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'PUT',
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
