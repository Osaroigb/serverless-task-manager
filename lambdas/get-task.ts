import * as dotenv from 'dotenv';
import { DynamoDB } from 'aws-sdk';
import { APIGatewayEvent, Context } from 'aws-lambda';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const dynamoDb = new DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME!;
if (!TABLE_NAME)
  throw new Error('TABLE_NAME environment variable is not defined');

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  // Extract taskId from the path parameters
  const taskId = event.pathParameters?.taskId as string;

  // Validate that taskId is provided
  if (!taskId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'taskId is required' }),
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
      };
    }

    // Return the task details
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error(`Error fetching task with taskId ${taskId}:`, error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch task' }),
    };
  }
};
