import * as dotenv from 'dotenv';
import { DynamoDB } from 'aws-sdk';
import { APIGatewayEvent, Context } from 'aws-lambda';

// Load environment variables in local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const dynamoDb = new DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME!;
if (!TABLE_NAME) throw new Error('TABLE_NAME environment variable is not defined');

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  const taskId = event.pathParameters?.taskId as string;

  // Validate that taskId is provided
  if (!taskId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'taskId is required' }),
    };
  }

  const { title, description, status } = JSON.parse(event.body || '{}');

  // Validate update fields
  if (!title && !description && !status) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'At least one of title, description, or status must be provided' }),
    };
  }

  const updateExpression: string[] = [];
  const ExpressionAttributeNames: any = {};
  const ExpressionAttributeValues: any = {};

  if (title) {
    updateExpression.push('#title = :title');
    ExpressionAttributeNames['#title'] = 'title';
    ExpressionAttributeValues[':title'] = title;
  }

  if (description) {
    updateExpression.push('#description = :description');
    ExpressionAttributeNames['#description'] = 'description';
    ExpressionAttributeValues[':description'] = description;
  }

  if (status) {
    updateExpression.push('#status = :status');
    ExpressionAttributeNames['#status'] = 'status';
    ExpressionAttributeValues[':status'] = status;
  }

  const updateExpressionString = 'SET ' + updateExpression.join(', ');

  try {
    // Update the task in DynamoDB
    const result = await dynamoDb.update({
      TableName: TABLE_NAME,
      Key: { taskId },
      UpdateExpression: updateExpressionString,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }).promise();

    // Return the updated task
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error(`Error updating task with taskId ${taskId}:`, error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not update task' }),
    };
  }
};
