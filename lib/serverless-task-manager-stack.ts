import { join } from 'path';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';

export class ServerlessTaskManagerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
  }
}
