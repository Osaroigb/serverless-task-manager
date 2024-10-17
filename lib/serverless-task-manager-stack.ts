import { join } from 'path';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigateway from '@aws-cdk/aws-apigateway';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';

export class ServerlessTaskManagerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB Table
    const tasksTable = new dynamodb.Table(this, 'TasksTable', {
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: 'TasksTable',
    });

    const createTaskLambda = new NodejsFunction(this, 'CreateTaskLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: join(__dirname, '../lambdas/create-task.ts'),
      environment: {
        TABLE_NAME: tasksTable.tableName,
      },
    });

    const getTaskLambda = new NodejsFunction(this, 'GetTaskLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: join(__dirname, '../lambdas/get-task.ts'),
      environment: {
        TABLE_NAME: tasksTable.tableName,
      },
    });

    tasksTable.grantReadWriteData(createTaskLambda);
    tasksTable.grantReadData(getTaskLambda);

    // Create API Gateway to expose the POST endpoint
    const api = new apigateway.RestApi(this, 'TasksApi', {
      restApiName: 'Tasks Service',
      description: 'This service handles task management..',
    });

    const tasks = api.root.addResource('tasks');
    const taskId = tasks.addResource('{taskId}');

    tasks.addMethod('POST', new apigateway.LambdaIntegration(createTaskLambda));
    taskId.addMethod('GET', new apigateway.LambdaIntegration(getTaskLambda));
  }
}
