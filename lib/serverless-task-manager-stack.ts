import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

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
  }
}
