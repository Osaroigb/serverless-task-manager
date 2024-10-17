import * as dotenv from 'dotenv';
import { DynamoDB } from 'aws-sdk';
import { APIGatewayEvent, Context } from 'aws-lambda';

// Load environment variables in local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const dynamoDb = new DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME!;
if (!TABLE_NAME)
  throw new Error('TABLE_NAME environment variable is not defined');

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  const taskId = event.pathParameters?.taskId as string;

  // Validate that taskId is provided
  if (!taskId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'taskId is required' }),
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
    };
  } catch (error) {
    console.error(`Error deleting task with taskId ${taskId}:`, error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not delete task' }),
    };
  }
};
