import { DynamoDB } from 'aws-sdk';
import { APIGatewayEvent, Context } from 'aws-lambda';

const TABLE_NAME = 'TasksTable';
const dynamoDb = new DynamoDB.DocumentClient({
  endpoint: 'http://host.docker.internal:8000',
});

// List of valid statuses
const VALID_STATUSES = ['pending', 'in-progress', 'completed'];

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  const taskId = event.pathParameters?.taskId as string;

  try {
    // Validate that taskId is provided
    if (!taskId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'taskId is required' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const { title, description, status } = JSON.parse(event.body || '{}');

    // Validate update fields
    if (!title && !description && !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            'At least one of title, description, or status must be provided',
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Validate the status field if it's provided
    if (status && !VALID_STATUSES.includes(status)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Invalid status value. Allowed values are: ${VALID_STATUSES.join(', ')}`,
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const task = await dynamoDb
      .get({
        TableName: TABLE_NAME,
        Key: { taskId },
      })
      .promise();

    // Check if the task exists
    if (!task.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Task not found' }),
        headers: { 'Content-Type': 'application/json' },
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

    // Update the task in DynamoDB
    const result = await dynamoDb
      .update({
        TableName: TABLE_NAME,
        Key: { taskId },
        UpdateExpression: updateExpressionString,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    // Return the updated task
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error(`Error updating task with taskId ${taskId}:`, error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not update task' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
