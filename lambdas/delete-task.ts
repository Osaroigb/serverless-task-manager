import { DynamoDB } from 'aws-sdk';
import { APIGatewayEvent, Context } from 'aws-lambda';

const TABLE_NAME = 'TasksTable';
const dynamoDb = new DynamoDB.DocumentClient({
  endpoint: 'http://host.docker.internal:8000',
});

export const handler = async (event: APIGatewayEvent, _context: Context) => {
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
    // Check if the task exists before attempting to delete
    const task = await dynamoDb
      .get({
        TableName: TABLE_NAME,
        Key: { taskId },
      })
      .promise();

    if (!task.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Task not found' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Delete the task from DynamoDB
    await dynamoDb
      .delete({
        TableName: TABLE_NAME,
        Key: { taskId },
        ReturnValues: 'NONE',
      })
      .promise();

    return {
      statusCode: 204, // No Content
      body: '',
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error(`Error deleting task with taskId ${taskId}:`, error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not delete task' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
