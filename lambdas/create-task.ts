import { DynamoDB } from 'aws-sdk';
import { APIGatewayEvent, Context } from 'aws-lambda';

const TABLE_NAME = 'TasksTable';
const dynamoDb = new DynamoDB.DocumentClient({
  endpoint: 'http://host.docker.internal:8000',
});

export const handler = async (event: APIGatewayEvent, context: Context) => {
  try {
    const { title, description, status } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!title || !description || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const taskId = context.awsRequestId; // Use AWS request ID as a unique taskId

    const task = {
      taskId,
      title,
      description,
      status,
    };

    // Insert the new task into DynamoDB
    await dynamoDb
      .put({
        TableName: TABLE_NAME,
        Item: task,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify(task),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error creating task:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create task' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
