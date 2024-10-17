
import * as dotenv from 'dotenv';
import { DynamoDB } from 'aws-sdk';
import { APIGatewayEvent, Context } from 'aws-lambda';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const dynamoDb = new DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME!;
if (!TABLE_NAME) throw new Error('TABLE_NAME environment variable is not defined');


export const handler = async (event: APIGatewayEvent, context: Context) => {
  try {
    const { title, description, status } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!title || !description || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
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
    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: task,
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify(task),
    };
  } catch (error) {
    console.error('Error creating task:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create task' }),
    };
  }
};
