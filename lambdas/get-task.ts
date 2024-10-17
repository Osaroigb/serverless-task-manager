import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const TABLE_NAME = 'TasksTable';
const dynamoDb = new DynamoDB.DocumentClient({
  endpoint: 'http://host.docker.internal:8000',
});

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context,
) => {
  // Extract taskId from the path parameters
  const taskId = event.pathParameters?.taskId as string;

  // Validate that taskId is provided
  if (!taskId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'taskId is required' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Fetch the task from DynamoDB
    const result = await dynamoDb
      .get({
        TableName: TABLE_NAME,
        Key: { taskId },
      })
      .promise();

    // Check if the task exists
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Task not found' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Return the task details
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error(`Error fetching task with taskId ${taskId}:`, error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch task' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
